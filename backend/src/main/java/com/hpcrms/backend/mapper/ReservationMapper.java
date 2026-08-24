package com.hpcrms.backend.mapper;

import com.hpcrms.backend.dto.response.ReservationResponse;
import com.hpcrms.backend.entity.Reservation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = VehicleMapper.class)
public interface ReservationMapper {

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(target = "customerName",
            expression = "java(reservation.getCustomer().getFirstName() + \" \" + reservation.getCustomer().getLastName())")
    @Mapping(source = "pickupBranch.name", target = "pickupBranchName")
    @Mapping(source = "dropoffBranch.name", target = "dropoffBranchName")
    ReservationResponse toResponse(Reservation reservation);

    List<ReservationResponse> toResponseList(List<Reservation> reservations);

}
