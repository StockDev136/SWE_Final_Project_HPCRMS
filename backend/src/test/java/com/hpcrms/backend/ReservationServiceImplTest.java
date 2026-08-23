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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the Reservation use case (UC-2), covering creation,
 * modification, and cancellation. All collaborators are mocked so these
 * exercise ReservationServiceImpl's own logic in isolation — the date/time
 * validation, the vehicle scheduling-conflict check, the customer
 * scheduling-conflict check, the ownership check, and the status-transition
 * rules — not the database or the mapper.
 *
 * Fixture data reflects the current US fleet/branch seed data (LAX Airport,
 * Toyota Corolla) rather than the original Jamaica seed data.
 */
@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private ReservationMapper reservationMapper;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private Customer customer;
    private Branch branch;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        branch = Branch.builder().id(1L).name("LAX Airport").address("1 World Way").city("Los Angeles, CA").build();

        customer = Customer.builder()
                .id(10L)
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@example.com")
                .passwordHash("hashed")
                .build();

        vehicle = Vehicle.builder()
                .id(100L)
                .licensePlate("CA1001")
                .make("Toyota")
                .model("Corolla")
                .branch(branch)
                .dailyRate(new BigDecimal("45.00"))
                .status(VehicleStatus.AVAILABLE)
                .build();

        // Mapper isn't under test here — MapStruct owns that. Just make sure
        // it never returns null so we can assert a response came back.
        lenient().when(reservationMapper.toResponse(any(Reservation.class)))
                .thenReturn(new ReservationResponse());
    }

    private ReservationCreationParams paramsFor(LocalDate start, LocalDate end, LocalTime pickup, LocalTime ret) {
        return new ReservationCreationParams(vehicle.getId(), start, end, pickup, ret, null);
    }

    private void stubNoConflicts() {
        lenient().when(reservationRepository.findCandidateOverlaps(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of());
        lenient().when(reservationRepository.findCandidateOverlapsForCustomer(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of());
    }

    // ---------- Normal cases ----------

    @Test
    void createReservation_happyPath_savesPendingReservationWithCorrectCost() {
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(4); // 3-day rental
        ReservationCreationParams params = paramsFor(start, end, LocalTime.of(10, 0), LocalTime.of(10, 0));

        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));
        stubNoConflicts();
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.createReservation("jane@example.com", params);

        assertNotNull(response);
        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        Reservation saved = captor.getValue();

        assertEquals(ReservationStatus.PENDING, saved.getStatus());
        assertEquals(customer, saved.getCustomer());
        assertEquals(vehicle, saved.getVehicle());
        assertEquals(branch, saved.getPickupBranch());
        assertEquals(0, new BigDecimal("135.00").compareTo(saved.getEstimatedCost())); // 3 days * $45
    }

    @Test
    void createReservationForCustomer_agentAssisted_looksUpCustomerById() {
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(2);
        ReservationCreationParams params = paramsFor(start, end, LocalTime.of(9, 0), LocalTime.of(9, 0));

        when(customerRepository.findById(10L)).thenReturn(Optional.of(customer));
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));
        stubNoConflicts();
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.createReservationForCustomer(10L, params);

        assertNotNull(response);
        verify(customerRepository).findById(10L);
        verify(customerRepository, never()).findByEmail(any());
    }

    @Test
    void cancelReservation_pendingReservation_transitionsToCancelled() {
        Reservation reservation = Reservation.builder()
                .id(1L).customer(customer).vehicle(vehicle).pickupBranch(branch)
                .status(ReservationStatus.PENDING).build();

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        reservationService.cancelReservation(1L, "jane@example.com", false);

        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
    }

    @Test
    void createReservation_customerHasNoOtherReservations_succeeds() {
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(3);
        ReservationCreationParams params = paramsFor(start, end, LocalTime.of(9, 0), LocalTime.of(9, 0));

        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));
        stubNoConflicts();
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> reservationService.createReservation("jane@example.com", params));
        verify(reservationRepository).findCandidateOverlapsForCustomer(
                eq(10L), eq(start), eq(end), any(), isNull());
    }

    // ---------- Boundary cases ----------

    @Test
    void createReservation_sameDayWithLaterReturnTime_isAllowed() {
        LocalDate today = LocalDate.now().plusDays(1); // still "same day" relative to itself
        ReservationCreationParams params = paramsFor(today, today, LocalTime.of(9, 0), LocalTime.of(18, 0));

        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));
        stubNoConflicts();
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> reservationService.createReservation("jane@example.com", params));
    }

    @Test
    void createReservation_sameDayRental_costFloorsToOneDayMinimum() {
        LocalDate today = LocalDate.now().plusDays(1);
        ReservationCreationParams params = paramsFor(today, today, LocalTime.of(9, 0), LocalTime.of(18, 0));

        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));
        stubNoConflicts();
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        reservationService.createReservation("jane@example.com", params);

        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        // DAYS.between(start, start) is 0 — must floor to 1 day's rate, not $0.
        assertEquals(0, new BigDecimal("45.00").compareTo(captor.getValue().getEstimatedCost()));
    }

    @Test
    void createReservation_sameDayReturnTimeNotAfterPickupTime_throws() {
        LocalDate today = LocalDate.now().plusDays(1);
        ReservationCreationParams params = paramsFor(today, today, LocalTime.of(15, 0), LocalTime.of(15, 0));

        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.createReservation("jane@example.com", params));
        verify(vehicleRepository, never()).findById(any());
    }

    // ---------- Error cases ----------

    @Test
    void createReservation_customerNotFound_throwsResourceNotFound() {
        ReservationCreationParams params = paramsFor(
                LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), LocalTime.NOON, LocalTime.NOON);
        when(customerRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> reservationService.createReservation("ghost@example.com", params));
    }

    @Test
    void createReservation_vehicleNotFound_throwsResourceNotFound() {
        ReservationCreationParams params = paramsFor(
                LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), LocalTime.NOON, LocalTime.NOON);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(vehicleRepository.findById(100L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> reservationService.createReservation("jane@example.com", params));
    }

    @Test
    void createReservation_vehicleInMaintenance_throwsVehicleUnavailable() {
        vehicle.setStatus(VehicleStatus.MAINTENANCE);
        ReservationCreationParams params = paramsFor(
                LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), LocalTime.NOON, LocalTime.NOON);

        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));

        assertThrows(VehicleUnavailableException.class,
                () -> reservationService.createReservation("jane@example.com", params));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void createReservation_pickupInThePast_throwsIllegalArgument() {
        ReservationCreationParams params = paramsFor(
                LocalDate.now().minusDays(1), LocalDate.now().plusDays(1), LocalTime.NOON, LocalTime.NOON);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.createReservation("jane@example.com", params));
    }

    @Test
    void createReservation_overlappingVehicleReservationExists_throwsVehicleUnavailable() {
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(3);
        ReservationCreationParams params = paramsFor(start, end, LocalTime.of(9, 0), LocalTime.of(9, 0));

        Reservation conflicting = Reservation.builder()
                .id(999L).startDate(start).endDate(end)
                .pickupTime(LocalTime.of(8, 0)).returnTime(LocalTime.of(20, 0))
                .status(ReservationStatus.PENDING).build();

        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));
        when(reservationRepository.findCandidateOverlaps(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of(conflicting));

        assertThrows(VehicleUnavailableException.class,
                () -> reservationService.createReservation("jane@example.com", params));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void createReservation_customerHasOverlappingReservationOnDifferentVehicle_throwsIllegalState() {
        // Same customer, same dates, but for a DIFFERENT vehicle — this is
        // exactly the scenario that was previously allowed and shouldn't be:
        // one customer holding several simultaneous bookings for one trip.
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(3);
        ReservationCreationParams params = paramsFor(start, end, LocalTime.of(9, 0), LocalTime.of(9, 0));

        Reservation existingForSameCustomer = Reservation.builder()
                .id(555L).startDate(start).endDate(end)
                .pickupTime(LocalTime.of(8, 0)).returnTime(LocalTime.of(20, 0))
                .status(ReservationStatus.PENDING).build();

        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));
        when(reservationRepository.findCandidateOverlaps(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of()); // no VEHICLE conflict — it's a different car
        when(reservationRepository.findCandidateOverlapsForCustomer(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of(existingForSameCustomer)); // but a CUSTOMER conflict

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> reservationService.createReservation("jane@example.com", params));
        assertTrue(ex.getMessage().contains("already has another reservation"));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void getReservationById_nonOwnerCustomer_throwsAccessDenied() {
        Reservation reservation = Reservation.builder()
                .id(1L).customer(customer).status(ReservationStatus.PENDING).build();
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThrows(AccessDeniedException.class,
                () -> reservationService.getReservationById(1L, "someone-else@example.com", false));
    }

    @Test
    void getReservationById_staffRequester_bypassesOwnershipCheck() {
        Reservation reservation = Reservation.builder()
                .id(1L).customer(customer).status(ReservationStatus.PENDING).build();
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertDoesNotThrow(() -> reservationService.getReservationById(1L, "agent@hpcrms.com", true));
    }

    @Test
    void cancelReservation_activeRental_throwsIllegalState() {
        Reservation reservation = Reservation.builder()
                .id(1L).customer(customer).status(ReservationStatus.ACTIVE_RENTAL).build();
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThrows(IllegalStateException.class,
                () -> reservationService.cancelReservation(1L, "jane@example.com", false));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void modifyReservation_wouldOverlapCustomersOtherReservation_throwsIllegalState() {
        LocalDate newStart = LocalDate.now().plusDays(5);
        LocalDate newEnd = LocalDate.now().plusDays(8);

        Reservation reservation = Reservation.builder()
                .id(1L).customer(customer).vehicle(vehicle).pickupBranch(branch)
                .status(ReservationStatus.PENDING)
                .startDate(LocalDate.now().plusDays(1)).endDate(LocalDate.now().plusDays(2))
                .pickupTime(LocalTime.of(9, 0)).returnTime(LocalTime.of(9, 0))
                .build();

        Reservation otherCustomerReservation = Reservation.builder()
                .id(777L).startDate(newStart).endDate(newEnd)
                .pickupTime(LocalTime.of(8, 0)).returnTime(LocalTime.of(20, 0))
                .status(ReservationStatus.PENDING).build();

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.findCandidateOverlaps(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of());
        when(reservationRepository.findCandidateOverlapsForCustomer(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of(otherCustomerReservation));

        assertThrows(IllegalStateException.class,
                () -> reservationService.modifyReservation(1L, newStart, newEnd, "jane@example.com", false));
        verify(reservationRepository, never()).save(any());
    }
}
