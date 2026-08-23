package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.AssistedReservationRequest;
import com.hpcrms.backend.dto.request.CreateReservationRequest;
import com.hpcrms.backend.dto.request.ModifyReservationRequest;
import com.hpcrms.backend.dto.response.ReservationResponse;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.security.UserPrincipal;
import com.hpcrms.backend.service.ReservationCreationParams;
import com.hpcrms.backend.service.ReservationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservations")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                       @Valid @RequestBody CreateReservationRequest request) {
        return reservationService.createReservation(principal.getUsername(), toParams(request));
    }

    @PostMapping("/assist")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('RENTAL_AGENT', 'BRANCH_MANAGER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ReservationResponse createForCustomer(@Valid @RequestBody AssistedReservationRequest request) {
        ReservationCreationParams params = new ReservationCreationParams(
                request.getVehicleId(), request.getStartDate(), request.getEndDate(),
                request.getPickupTime(), request.getReturnTime(), request.getDropoffBranchId());
        return reservationService.createReservationForCustomer(request.getCustomerId(), params);
    }

    private ReservationCreationParams toParams(CreateReservationRequest request) {
        return new ReservationCreationParams(
                request.getVehicleId(), request.getStartDate(), request.getEndDate(),
                request.getPickupTime(), request.getReturnTime(), request.getDropoffBranchId());
    }

    @GetMapping("/me")
    public List<ReservationResponse> getMyReservations(@AuthenticationPrincipal UserPrincipal principal) {
        return reservationService.getReservationsByCustomerEmail(principal.getUsername());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RENTAL_AGENT', 'BRANCH_MANAGER', 'FLEET_MANAGER', 'FINANCE_DEPARTMENT', 'SYSTEM_ADMINISTRATOR')")
    public List<ReservationResponse> getAll(
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) Long branchId) {
        return reservationService.getAllReservations(status, branchId);
    }

    @GetMapping("/{id}")
    public ReservationResponse getById(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return reservationService.getReservationById(id, principal.getUsername(), principal.isStaff());
    }

    @PutMapping("/{id}")
    public ReservationResponse modify(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long id, @Valid @RequestBody ModifyReservationRequest request) {
        return reservationService.modifyReservation(
                id, request.getStartDate(), request.getEndDate(), principal.getUsername(), principal.isStaff());
    }

    @DeleteMapping("/{id}")
    public ReservationResponse cancel(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return reservationService.cancelReservation(id, principal.getUsername(), principal.isStaff());
    }
}
