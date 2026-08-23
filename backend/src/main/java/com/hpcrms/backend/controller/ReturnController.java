package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.ReturnVehicleRequest;
import com.hpcrms.backend.dto.response.ReturnResponse;
import com.hpcrms.backend.security.UserPrincipal;
import com.hpcrms.backend.service.ReturnService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/return")
@RequiredArgsConstructor
@Tag(name = "Return")
@PreAuthorize("hasAnyRole('RENTAL_AGENT', 'BRANCH_MANAGER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
public class ReturnController {

    private final ReturnService returnService;

    @PostMapping
    public ReturnResponse returnVehicle(@AuthenticationPrincipal UserPrincipal principal,
                                         @Valid @RequestBody ReturnVehicleRequest request) {
        return returnService.returnVehicle(
                request.getReservationId(), request.getMileage(), request.getFuelLevel(), request.getConditionNotes(),
                request.isVehicleIssue(), principal.getUsername(), principal.isStaff());
    }
}
