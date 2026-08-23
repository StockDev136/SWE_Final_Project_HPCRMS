package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.CustomerResponse;

import java.util.List;

public interface CustomerService {
    List<CustomerResponse> search(String term);
}
