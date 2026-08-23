package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.PickupResponse;

public interface PickupService {

    PickupResponse pickupVehicle(String pickupCode);
}
