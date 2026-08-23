package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.RentalAgreementResponse;
import com.hpcrms.backend.dto.response.ReservationResponse;
import com.hpcrms.backend.entity.Customer;
import com.hpcrms.backend.entity.Reservation;
import com.hpcrms.backend.entity.RentalAgreement;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.mapper.RentalAgreementMapper;
import com.hpcrms.backend.mapper.ReservationMapper;
import com.hpcrms.backend.repository.RentalAgreementRepository;
import com.hpcrms.backend.repository.ReservationRepository;
import com.hpcrms.backend.service.CheckInService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CheckInServiceImpl implements CheckInService {

    private static final int MINIMUM_RENTAL_AGE = 21;

    private final ReservationRepository reservationRepository;
    private final RentalAgreementRepository rentalAgreementRepository;
    private final RentalAgreementMapper rentalAgreementMapper;
    private final ReservationMapper reservationMapper;

    @Override
    @Transactional
    public ReservationResponse verifyIdentity(Long reservationId, String licenseNumber, LocalDate dateOfBirth,
                                               LocalDate licenseExpirationDate, boolean selfieConfirmed,
                                               String requesterEmail, boolean isStaff) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));
        verifyOwnership(reservation, requesterEmail, isStaff);

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalStateException(
                    "Identity can only be verified for a PENDING reservation, current status: " + reservation.getStatus());
        }
        if (!selfieConfirmed) {
            throw new IllegalArgumentException("Selfie confirmation is required to verify identity");
        }

        int age = Period.between(dateOfBirth, LocalDate.now()).getYears();
        if (age < MINIMUM_RENTAL_AGE) {
            throw new IllegalArgumentException(
                    "Customer must be at least " + MINIMUM_RENTAL_AGE + " years old to rent a vehicle");
        }
        if (licenseExpirationDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Driver's license has expired");
        }

        Customer customer = reservation.getCustomer();
        if (!StringUtils.hasText(customer.getDriverLicenseNumber())) {
            customer.setDriverLicenseNumber(licenseNumber);
        }
        customer.setDateOfBirth(dateOfBirth);
        customer.setLicenseExpirationDate(licenseExpirationDate);

        reservation.setIdentityVerified(true);
        reservationRepository.save(reservation);

        return reservationMapper.toResponse(reservation);
    }

    @Override
    @Transactional
    public RentalAgreementResponse completeCheckIn(Long reservationId, String signatureData,
                                                     String requesterEmail, boolean isStaff) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));
        verifyOwnership(reservation, requesterEmail, isStaff);

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalStateException("Reservation must be PENDING to check in, current status: " + reservation.getStatus());
        }
        if (!reservation.isIdentityVerified()) {
            throw new IllegalStateException("Identity must be verified before check-in can be completed");
        }

        String contractText = generateContractText(reservation);

        RentalAgreement agreement = RentalAgreement.builder()
                .reservation(reservation)
                .contractText(contractText)
                .signatureData(signatureData)
                .signedDate(LocalDateTime.now())
                .build();
        agreement = rentalAgreementRepository.save(agreement);

        reservation.setPickupCode(generatePickupCode());
        reservation.setStatus(ReservationStatus.READY_FOR_PICKUP);
        reservationRepository.save(reservation);

        return rentalAgreementMapper.toResponse(agreement);
    }

    @Override
    public RentalAgreementResponse getAgreementByReservationId(Long reservationId, String requesterEmail, boolean isStaff) {
        RentalAgreement agreement = rentalAgreementRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No rental agreement found for reservation: " + reservationId));
        verifyOwnership(agreement.getReservation(), requesterEmail, isStaff);
        return rentalAgreementMapper.toResponse(agreement);
    }

    private void verifyOwnership(Reservation reservation, String requesterEmail, boolean isStaff) {
        if (!isStaff && !reservation.getCustomer().getEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("You do not have permission to access this reservation");
        }
    }

    private String generatePickupCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateContractText(Reservation reservation) {
        return "HPCRMS Rental Agreement\n"
                + "Reservation ID: " + reservation.getId() + "\n"
                + "Customer: " + reservation.getCustomer().getFirstName() + " " + reservation.getCustomer().getLastName() + "\n"
                + "Vehicle: " + reservation.getVehicle().getMake() + " " + reservation.getVehicle().getModel()
                + " (" + reservation.getVehicle().getLicensePlate() + ")\n"
                + "Pickup Branch: " + reservation.getPickupBranch().getName() + "\n"
                + "Rental Period: " + reservation.getStartDate() + " to " + reservation.getEndDate() + "\n"
                + "Estimated Cost: $" + reservation.getEstimatedCost();
    }
}
