package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.RentalAgreementResponse;
import com.hpcrms.backend.dto.response.ReservationResponse;
import com.hpcrms.backend.entity.Branch;
import com.hpcrms.backend.entity.Customer;
import com.hpcrms.backend.entity.RentalAgreement;
import com.hpcrms.backend.entity.Reservation;
import com.hpcrms.backend.entity.Vehicle;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.mapper.RentalAgreementMapper;
import com.hpcrms.backend.mapper.ReservationMapper;
import com.hpcrms.backend.repository.RentalAgreementRepository;
import com.hpcrms.backend.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the Check-In use case (UC-4), which in this system is two
 * mandatory, sequential steps: verifyIdentity() then completeCheckIn().
 * Covers both steps' preconditions — including the minimum-rental-age and
 * license-expiration business rules — plus the ownership rule shared across
 * every reservation-scoped action.
 *
 * Fixture data reflects the current US fleet/branch seed data (LAX Airport,
 * Toyota Corolla) rather than the original Jamaica seed data.
 */
@ExtendWith(MockitoExtension.class)
class CheckInServiceImplTest {

    private static final LocalDate VALID_DOB = LocalDate.now().minusYears(30);
    private static final LocalDate VALID_LICENSE_EXPIRY = LocalDate.now().plusYears(2);

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private RentalAgreementRepository rentalAgreementRepository;
    @Mock
    private RentalAgreementMapper rentalAgreementMapper;
    @Mock
    private ReservationMapper reservationMapper;

    @InjectMocks
    private CheckInServiceImpl checkInService;

    private Reservation reservation;
    private Customer customer;

    @BeforeEach
    void setUp() {
        Branch branch = Branch.builder().id(1L).name("LAX Airport").address("1 World Way").city("Los Angeles, CA").build();
        Vehicle vehicle = Vehicle.builder().id(100L).make("Toyota").model("Corolla").licensePlate("CA1001").build();
        customer = Customer.builder().id(10L).firstName("Jane").lastName("Doe").email("jane@example.com").build();

        reservation = Reservation.builder()
                .id(1L)
                .customer(customer)
                .vehicle(vehicle)
                .pickupBranch(branch)
                .status(ReservationStatus.PENDING)
                .estimatedCost(new BigDecimal("135.00"))
                .build();

        lenient().when(reservationMapper.toResponse(any(Reservation.class))).thenReturn(new ReservationResponse());
        lenient().when(rentalAgreementMapper.toResponse(any(RentalAgreement.class)))
                .thenReturn(new RentalAgreementResponse());
    }

    // ---------- Normal cases ----------

    @Test
    void verifyIdentity_pendingReservationWithConfirmedSelfie_setsIdentityVerified() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        checkInService.verifyIdentity(1L, "J1234567", VALID_DOB, VALID_LICENSE_EXPIRY, true, "jane@example.com", false);

        assertTrue(reservation.isIdentityVerified());
        verify(reservationRepository).save(reservation);
    }

    @Test
    void completeCheckIn_verifiedPendingReservation_generatesPickupCodeAndAdvancesStatus() {
        reservation.setIdentityVerified(true);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(rentalAgreementRepository.save(any(RentalAgreement.class))).thenAnswer(inv -> inv.getArgument(0));

        RentalAgreementResponse response = checkInService.completeCheckIn(1L, "Jane Doe", "jane@example.com", false);

        assertNotNull(response);
        assertEquals(ReservationStatus.READY_FOR_PICKUP, reservation.getStatus());
        assertNotNull(reservation.getPickupCode());
        assertEquals(8, reservation.getPickupCode().length());
    }

    // ---------- Boundary cases ----------

    @Test
    void verifyIdentity_customerAlreadyHasLicenseOnFile_doesNotOverwriteIt() {
        customer.setDriverLicenseNumber("EXISTING123");
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        checkInService.verifyIdentity(1L, "NEWNUMBER456", VALID_DOB, VALID_LICENSE_EXPIRY, true, "jane@example.com", false);

        assertEquals("EXISTING123", customer.getDriverLicenseNumber());
    }

    @Test
    void verifyIdentity_customerHasNoLicenseOnFile_storesTheProvidedNumber() {
        customer.setDriverLicenseNumber(null);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        checkInService.verifyIdentity(1L, "NEWNUMBER456", VALID_DOB, VALID_LICENSE_EXPIRY, true, "jane@example.com", false);

        assertEquals("NEWNUMBER456", customer.getDriverLicenseNumber());
    }

    @Test
    void verifyIdentity_exactlyMinimumAge_isAllowed() {
        LocalDate exactlyTwentyOne = LocalDate.now().minusYears(21);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertDoesNotThrow(() -> checkInService.verifyIdentity(
                1L, "J1234567", exactlyTwentyOne, VALID_LICENSE_EXPIRY, true, "jane@example.com", false));
    }

    @Test
    void verifyIdentity_licenseExpiresToday_isAllowed() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertDoesNotThrow(() -> checkInService.verifyIdentity(
                1L, "J1234567", VALID_DOB, LocalDate.now(), true, "jane@example.com", false));
    }

    // ---------- Error cases ----------

    @Test
    void verifyIdentity_customerUnderMinimumAge_throwsIllegalArgument() {
        LocalDate justUnderTwentyOne = LocalDate.now().minusYears(21).plusDays(1);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> checkInService.verifyIdentity(
                1L, "J1234567", justUnderTwentyOne, VALID_LICENSE_EXPIRY, true, "jane@example.com", false));
        assertTrue(ex.getMessage().contains("21 years old"));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void verifyIdentity_licenseExpired_throwsIllegalArgument() {
        LocalDate expiredYesterday = LocalDate.now().minusDays(1);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> checkInService.verifyIdentity(
                1L, "J1234567", VALID_DOB, expiredYesterday, true, "jane@example.com", false));
        assertTrue(ex.getMessage().contains("expired"));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void verifyIdentity_selfieNotConfirmed_throwsIllegalArgument() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThrows(IllegalArgumentException.class, () -> checkInService.verifyIdentity(
                1L, "J1234567", VALID_DOB, VALID_LICENSE_EXPIRY, false, "jane@example.com", false));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void verifyIdentity_reservationNotPending_throwsIllegalState() {
        reservation.setStatus(ReservationStatus.READY_FOR_PICKUP);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThrows(IllegalStateException.class, () -> checkInService.verifyIdentity(
                1L, "J1234567", VALID_DOB, VALID_LICENSE_EXPIRY, true, "jane@example.com", false));
    }

    @Test
    void completeCheckIn_identityNotYetVerified_throwsIllegalState() {
        // reservation.identityVerified defaults to false
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> checkInService.completeCheckIn(1L, "Jane Doe", "jane@example.com", false));
        assertTrue(ex.getMessage().contains("Identity must be verified"));
        verify(rentalAgreementRepository, never()).save(any());
    }

    @Test
    void completeCheckIn_reservationNotPending_throwsIllegalState() {
        reservation.setIdentityVerified(true);
        reservation.setStatus(ReservationStatus.CANCELLED);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThrows(IllegalStateException.class,
                () -> checkInService.completeCheckIn(1L, "Jane Doe", "jane@example.com", false));
    }

    @Test
    void verifyIdentity_nonOwnerCustomer_throwsAccessDenied() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThrows(AccessDeniedException.class, () -> checkInService.verifyIdentity(
                1L, "J1234567", VALID_DOB, VALID_LICENSE_EXPIRY, true, "someone-else@example.com", false));
    }

    @Test
    void verifyIdentity_staffRequester_bypassesOwnershipCheck() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertDoesNotThrow(() -> checkInService.verifyIdentity(
                1L, "J1234567", VALID_DOB, VALID_LICENSE_EXPIRY, true, "agent@hpcrms.com", true));
    }

    @Test
    void getAgreementByReservationId_noAgreementYet_throwsResourceNotFound() {
        when(rentalAgreementRepository.findByReservationId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> checkInService.getAgreementByReservationId(1L, "jane@example.com", false));
    }
}
