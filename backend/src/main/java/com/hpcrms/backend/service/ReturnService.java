package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.ReturnResponse;

public interface ReturnService {
    ReturnResponse returnVehicle(Long reservationId, int mileage, int fuelLevel, String conditionNotes,
                                  boolean vehicleIssue, String requesterEmail, boolean isStaff);
}
