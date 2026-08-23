package com.hpcrms.backend.mapper;

import com.hpcrms.backend.dto.response.CustomerResponse;
import com.hpcrms.backend.entity.Customer;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
    CustomerResponse toResponse(Customer customer);
    List<CustomerResponse> toResponseList(List<Customer> customers);
}
