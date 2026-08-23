package com.hpcrms.backend.mapper;

import com.hpcrms.backend.dto.response.RentalAgreementResponse;
import com.hpcrms.backend.entity.RentalAgreement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RentalAgreementMapper {

    @Mapping(source = "reservation.id", target = "reservationId")
    RentalAgreementResponse toResponse(RentalAgreement agreement);
}
