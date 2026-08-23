package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.ReservationResponse;
import com.hpcrms.backend.entity.enums.ReservationStatus;

import java.time.LocalDate;
import java.util.List;

public interface ReservationService {

    ReservationResponse createReservation(String customerEmail, ReservationCreationParams params);

    ReservationResponse createReservationForCustomer(Long customerId, ReservationCreationParams params);

    ReservationResponse getReservationById(Long id, String requesterEmail, boolean isStaff);

    List<ReservationResponse> getReservationsByCustomerEmail(String customerEmail);

    List<ReservationResponse> getAllReservations(ReservationStatus status, Long branchId);

    ReservationResponse modifyReservation(Long id, LocalDate startDate, LocalDate endDate, String requesterEmail, boolean isStaff);

    ReservationResponse cancelReservation(Long id, String requesterEmail, boolean isStaff);
}
