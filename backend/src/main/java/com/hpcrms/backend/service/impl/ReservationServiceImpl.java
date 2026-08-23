package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.ReservationResponse;
import com.hpcrms.backend.entity.Branch;
import com.hpcrms.backend.entity.Customer;
import com.hpcrms.backend.entity.Reservation;
import com.hpcrms.backend.entity.Vehicle;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.entity.enums.VehicleStatus;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.exception.VehicleUnavailableException;
import com.hpcrms.backend.mapper.ReservationMapper;
import com.hpcrms.backend.repository.BranchRepository;
import com.hpcrms.backend.repository.CustomerRepository;
import com.hpcrms.backend.repository.ReservationRepository;
import com.hpcrms.backend.repository.VehicleRepository;
import com.hpcrms.backend.service.ReservationCreationParams;
import com.hpcrms.backend.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationServiceImpl implements ReservationService {

    private static final List<ReservationStatus> BLOCKING_RESERVATION_STATUSES =
            List.of(ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP, ReservationStatus.ACTIVE_RENTAL);

    private final ReservationRepository reservationRepository;
    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final ReservationMapper reservationMapper;

    @Override
    @Transactional
    public ReservationResponse createReservation(String customerEmail, ReservationCreationParams params) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerEmail));
        return createReservationInternal(customer, params);
    }

    @Override
    @Transactional
    public ReservationResponse createReservationForCustomer(Long customerId, ReservationCreationParams params) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
        return createReservationInternal(customer, params);
    }

    private ReservationResponse createReservationInternal(Customer customer, ReservationCreationParams params) {
        LocalDate startDate = params.startDate();
        LocalDate endDate = params.endDate();
        LocalTime pickupTime = params.pickupTime();
        LocalTime returnTime = params.returnTime();

        LocalDateTime pickupDateTime = LocalDateTime.of(startDate, pickupTime != null ? pickupTime : LocalTime.MIN);
        LocalDateTime returnDateTime = LocalDateTime.of(endDate, returnTime != null ? returnTime : LocalTime.MAX);

        if (!returnDateTime.isAfter(pickupDateTime)) {
            throw new IllegalArgumentException("Return date/time must be after pickup date/time");
        }
        if (pickupDateTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Pickup date/time cannot be in the past");
        }

        Vehicle vehicle = vehicleRepository.findById(params.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + params.vehicleId()));

        if (vehicle.getStatus() == VehicleStatus.MAINTENANCE || vehicle.getStatus() == VehicleStatus.UNAVAILABLE) {
            throw new VehicleUnavailableException("Vehicle " + params.vehicleId() + " is not in service");
        }

        boolean hasVehicleConflict = hasSchedulingConflict(
                params.vehicleId(), startDate, endDate, pickupTime, returnTime, null);
        if (hasVehicleConflict) {
            throw new VehicleUnavailableException(
                    "Vehicle " + params.vehicleId() + " is already reserved for part or all of the requested period");
        }

        boolean hasCustomerConflict = hasCustomerSchedulingConflict(
                customer.getId(), startDate, endDate, pickupTime, returnTime, null);
        if (hasCustomerConflict) {
            throw new IllegalStateException(
                    "This customer already has another reservation that overlaps the requested period");
        }

        Branch dropoffBranch = null;
        if (params.dropoffBranchId() != null) {
            dropoffBranch = branchRepository.findById(params.dropoffBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + params.dropoffBranchId()));
        }

        BigDecimal cost = estimateCost(vehicle, startDate, endDate);

        Reservation reservation = Reservation.builder()
                .customer(customer)
                .vehicle(vehicle)
                .pickupBranch(vehicle.getBranch())
                .dropoffBranch(dropoffBranch)
                .startDate(startDate)
                .endDate(endDate)
                .pickupTime(pickupTime)
                .returnTime(returnTime)
                .estimatedCost(cost)
                .status(ReservationStatus.PENDING)
                .build();

        reservation = reservationRepository.save(reservation);

        return reservationMapper.toResponse(reservation);
    }

    @Override
    public ReservationResponse getReservationById(Long id, String requesterEmail, boolean isStaff) {
        Reservation reservation = findReservationOrThrow(id);
        verifyOwnership(reservation, requesterEmail, isStaff);
        return reservationMapper.toResponse(reservation);
    }

    @Override
    public List<ReservationResponse> getReservationsByCustomerEmail(String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerEmail));
        return reservationMapper.toResponseList(reservationRepository.findByCustomerId(customer.getId()));
    }

    @Override
    public List<ReservationResponse> getAllReservations(ReservationStatus status, Long branchId) {
        return reservationMapper.toResponseList(reservationRepository.findAllForStaff(status, branchId));
    }

    @Override
    @Transactional
    public ReservationResponse modifyReservation(Long id, LocalDate startDate, LocalDate endDate,
                                                  String requesterEmail, boolean isStaff) {
        Reservation reservation = findReservationOrThrow(id);
        verifyOwnership(reservation, requesterEmail, isStaff);

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalStateException("Only a PENDING reservation can be modified");
        }

        LocalTime pickupTime = reservation.getPickupTime();
        LocalTime returnTime = reservation.getReturnTime();
        LocalDateTime pickupDateTime = LocalDateTime.of(startDate, pickupTime != null ? pickupTime : LocalTime.MIN);
        LocalDateTime returnDateTime = LocalDateTime.of(endDate, returnTime != null ? returnTime : LocalTime.MAX);

        if (!returnDateTime.isAfter(pickupDateTime)) {
            throw new IllegalArgumentException("Return date/time must be after pickup date/time");
        }
        if (pickupDateTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Pickup date/time cannot be in the past");
        }

        boolean hasVehicleConflict = hasSchedulingConflict(
                reservation.getVehicle().getId(), startDate, endDate, pickupTime, returnTime, reservation.getId());
        if (hasVehicleConflict) {
            throw new VehicleUnavailableException(
                    "Vehicle is already reserved for part or all of the requested period");
        }

        boolean hasCustomerConflict = hasCustomerSchedulingConflict(
                reservation.getCustomer().getId(), startDate, endDate, pickupTime, returnTime, reservation.getId());
        if (hasCustomerConflict) {
            throw new IllegalStateException(
                    "This customer already has another reservation that overlaps the requested period");
        }

        reservation.setStartDate(startDate);
        reservation.setEndDate(endDate);
        reservation.setEstimatedCost(estimateCost(reservation.getVehicle(), startDate, endDate));

        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public ReservationResponse cancelReservation(Long id, String requesterEmail, boolean isStaff) {
        Reservation reservation = findReservationOrThrow(id);
        verifyOwnership(reservation, requesterEmail, isStaff);

        if (reservation.getStatus() == ReservationStatus.ACTIVE_RENTAL
                || reservation.getStatus() == ReservationStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a reservation that is active or completed");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    private Reservation findReservationOrThrow(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + id));
    }

    private void verifyOwnership(Reservation reservation, String requesterEmail, boolean isStaff) {
        if (!isStaff && !reservation.getCustomer().getEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("You do not have permission to access this reservation");
        }
    }

    /**
     * Fetches DATE-range candidates (broad, cheap query) then checks genuine
     * minute-level overlap in Java using actual pickup/return times. This is
     * what makes same-day bookings work correctly: two reservations dated
     * "today" only conflict if their actual time windows overlap, not just
     * because they share a calendar date. Missing times (legacy rows from
     * before this field existed) default to the full day (00:00–23:59:59) so
     * they're treated conservatively as blocking the whole day.
     */
    private boolean hasSchedulingConflict(Long vehicleId, LocalDate startDate, LocalDate endDate,
                                           LocalTime pickupTime, LocalTime returnTime, Long excludeReservationId) {
        LocalDateTime newStart = LocalDateTime.of(startDate, pickupTime != null ? pickupTime : LocalTime.MIN);
        LocalDateTime newEnd = LocalDateTime.of(endDate, returnTime != null ? returnTime : LocalTime.MAX);

        List<Reservation> candidates = reservationRepository.findCandidateOverlaps(
                vehicleId, startDate, endDate, BLOCKING_RESERVATION_STATUSES, excludeReservationId);

        return overlapsAny(candidates, newStart, newEnd);
    }

    /**
     * Same minute-level overlap check as hasSchedulingConflict, but scoped to
     * everything a given CUSTOMER currently has booked, regardless of which
     * vehicle. Stops one customer from holding several simultaneous
     * reservations for the same trip — different vehicles at the same branch
     * for the same dates is otherwise completely normal and not blocked
     * anywhere else in this system, only this specific case (same customer,
     * overlapping time, another active reservation of theirs) is.
     */
    private boolean hasCustomerSchedulingConflict(Long customerId, LocalDate startDate, LocalDate endDate,
                                                   LocalTime pickupTime, LocalTime returnTime, Long excludeReservationId) {
        LocalDateTime newStart = LocalDateTime.of(startDate, pickupTime != null ? pickupTime : LocalTime.MIN);
        LocalDateTime newEnd = LocalDateTime.of(endDate, returnTime != null ? returnTime : LocalTime.MAX);

        List<Reservation> candidates = reservationRepository.findCandidateOverlapsForCustomer(
                customerId, startDate, endDate, BLOCKING_RESERVATION_STATUSES, excludeReservationId);

        return overlapsAny(candidates, newStart, newEnd);
    }

    private boolean overlapsAny(List<Reservation> candidates, LocalDateTime newStart, LocalDateTime newEnd) {
        for (Reservation existing : candidates) {
            LocalDateTime existingStart = LocalDateTime.of(existing.getStartDate(),
                    existing.getPickupTime() != null ? existing.getPickupTime() : LocalTime.MIN);
            LocalDateTime existingEnd = LocalDateTime.of(existing.getEndDate(),
                    existing.getReturnTime() != null ? existing.getReturnTime() : LocalTime.MAX);

            if (existingStart.isBefore(newEnd) && existingEnd.isAfter(newStart)) {
                return true;
            }
        }
        return false;
    }

    private BigDecimal estimateCost(Vehicle vehicle, LocalDate startDate, LocalDate endDate) {
        long days = Math.max(1, ChronoUnit.DAYS.between(startDate, endDate));
        return vehicle.getDailyRate().multiply(BigDecimal.valueOf(days));
    }
}
