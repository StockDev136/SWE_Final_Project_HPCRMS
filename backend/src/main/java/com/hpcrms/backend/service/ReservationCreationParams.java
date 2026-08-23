package com.hpcrms.backend.service;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationCreationParams(
        Long vehicleId,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime pickupTime,
        LocalTime returnTime,
        Long dropoffBranchId) {
}
