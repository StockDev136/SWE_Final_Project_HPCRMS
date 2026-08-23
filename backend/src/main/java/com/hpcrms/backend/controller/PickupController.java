package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.PickupRequest;
import com.hpcrms.backend.dto.response.PickupResponse;
import com.hpcrms.backend.service.PickupService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pickup")
@RequiredArgsConstructor
@Tag(name = "Pickup")
public class PickupController {

    private final PickupService pickupService;

    @PostMapping
    public PickupResponse pickup(@Valid @RequestBody PickupRequest request) {
        return pickupService.pickupVehicle(request.getPickupCode());
    }
}
