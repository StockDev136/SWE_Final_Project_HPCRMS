package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.RentalAgreementResponse;
import com.hpcrms.backend.dto.response.ReservationResponse;

import java.time.LocalDate;

public interface CheckInService {

    ReservationResponse verifyIdentity(Long reservationId, String licenseNumber, LocalDate dateOfBirth,
                                        LocalDate licenseExpirationDate, boolean selfieConfirmed,
                                        String requesterEmail, boolean isStaff);

    RentalAgreementResponse completeCheckIn(Long reservationId, String signatureData,
                                             String requesterEmail, boolean isStaff);

    RentalAgreementResponse getAgreementByReservationId(Long reservationId, String requesterEmail, boolean isStaff);
}
