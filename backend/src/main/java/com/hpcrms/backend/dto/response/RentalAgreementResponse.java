package com.hpcrms.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalAgreementResponse {
    private Long id;
    private Long reservationId;
    private String contractText;
    private LocalDateTime signedDate;
}
