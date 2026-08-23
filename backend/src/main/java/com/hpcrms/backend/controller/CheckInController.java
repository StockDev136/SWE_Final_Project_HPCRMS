package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.CheckInRequest;
import com.hpcrms.backend.dto.request.VerifyIdentityRequest;
import com.hpcrms.backend.dto.response.RentalAgreementResponse;
import com.hpcrms.backend.dto.response.ReservationResponse;
import com.hpcrms.backend.security.UserPrincipal;
import com.hpcrms.backend.service.CheckInService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/checkin")
@RequiredArgsConstructor
@Tag(name = "Check-In")
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping("/verify-identity")
    public ReservationResponse verifyIdentity(@AuthenticationPrincipal UserPrincipal principal,
                                               @Valid @RequestBody VerifyIdentityRequest request) {
        return checkInService.verifyIdentity(
                request.getReservationId(), request.getLicenseNumber(), request.getDateOfBirth(),
                request.getLicenseExpirationDate(), request.isSelfieConfirmed(),
                principal.getUsername(), principal.isStaff());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RentalAgreementResponse checkIn(@AuthenticationPrincipal UserPrincipal principal,
                                            @Valid @RequestBody CheckInRequest request) {
        return checkInService.completeCheckIn(
                request.getReservationId(), request.getSignatureData(), principal.getUsername(), principal.isStaff());
    }

    @GetMapping("/reservation/{reservationId}")
    public RentalAgreementResponse getByReservation(@AuthenticationPrincipal UserPrincipal principal,
                                                      @PathVariable Long reservationId) {
        return checkInService.getAgreementByReservationId(reservationId, principal.getUsername(), principal.isStaff());
    }
}
