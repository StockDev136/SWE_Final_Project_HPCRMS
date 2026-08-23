package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.ReturnResponse;
import com.hpcrms.backend.entity.Employee;
import com.hpcrms.backend.entity.Reservation;
import com.hpcrms.backend.entity.Vehicle;
import com.hpcrms.backend.entity.VehicleInspection;
import com.hpcrms.backend.entity.enums.InspectionType;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.entity.enums.VehicleStatus;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.repository.EmployeeRepository;
import com.hpcrms.backend.repository.ReservationRepository;
import com.hpcrms.backend.repository.VehicleInspectionRepository;
import com.hpcrms.backend.repository.VehicleRepository;
import com.hpcrms.backend.service.ReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReturnServiceImpl implements ReturnService {

    private final ReservationRepository reservationRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleInspectionRepository vehicleInspectionRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public ReturnResponse returnVehicle(Long reservationId, int mileage, int fuelLevel, String conditionNotes,
                                         boolean vehicleIssue, String requesterEmail, boolean isStaff) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));

        if (!isStaff && !reservation.getCustomer().getEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("You do not have permission to access this reservation");
        }
        if (reservation.getStatus() != ReservationStatus.ACTIVE_RENTAL) {
            throw new IllegalStateException(
                    "Reservation must be an active rental to be returned, current status: " + reservation.getStatus());
        }

        Vehicle vehicle = reservation.getVehicle();
        LocalDate today = LocalDate.now();
        boolean earlyReturn = today.isBefore(reservation.getEndDate());

        // Billing policy for early returns:
        // - Not a vehicle issue (customer's own choice/convenience, e.g. an
        //   emergency on their end): full reserved amount still applies, no
        //   discount for unused days. This is also the outcome for an
        //   on-time or late return, since finalCost just mirrors the estimate.
        // - Vehicle issue (mechanical/safety problem caused the early
        //   return): customer is only charged for days actually used.
        BigDecimal finalCost;
        boolean prorated = earlyReturn && vehicleIssue;
        if (prorated) {
            long actualDays = Math.max(1, ChronoUnit.DAYS.between(reservation.getStartDate(), today));
            finalCost = vehicle.getDailyRate().multiply(BigDecimal.valueOf(actualDays));
        } else {
            finalCost = reservation.getEstimatedCost();
        }

        String notes = conditionNotes;
        if (vehicleIssue) {
            String tag = "[VEHICLE ISSUE — EARLY RETURN]";
            notes = (notes == null || notes.isBlank()) ? tag : tag + " " + notes;
        }

        // Only attributed to a staff member when the returner actually is one —
        // this endpoint is staff-only at the controller, so in practice isStaff
        // is always true here, but the null-safe lookup is kept in case that
        // restriction is ever relaxed to allow customer self-return.
        Employee inspectedBy = isStaff ? employeeRepository.findByEmail(requesterEmail).orElse(null) : null;

        VehicleInspection inspection = VehicleInspection.builder()
                .reservation(reservation)
                .type(InspectionType.RETURN)
                .mileage(mileage)
                .fuelLevel(fuelLevel)
                .conditionNotes(notes)
                .inspectedBy(inspectedBy)
                .build();
        vehicleInspectionRepository.save(inspection);

        reservation.setStatus(ReservationStatus.COMPLETED);
        reservation.setFinalCost(finalCost);
        reservationRepository.save(reservation);

        vehicle.setMileage(mileage);
        vehicle.setStatus(VehicleStatus.AVAILABLE);
        if (reservation.getDropoffBranch() != null) {
            vehicle.setBranch(reservation.getDropoffBranch());
        }
        vehicleRepository.save(vehicle);

        return ReturnResponse.builder()
                .reservationId(reservation.getId())
                .finalCost(finalCost)
                .returnedToBranchName(vehicle.getBranch().getName())
                .finalMileage(vehicle.getMileage())
                .earlyReturn(earlyReturn)
                .prorated(prorated)
                .build();
    }
}
