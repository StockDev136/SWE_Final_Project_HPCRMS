package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.CustomerResponse;
import com.hpcrms.backend.mapper.CustomerMapper;
import com.hpcrms.backend.repository.CustomerRepository;
import com.hpcrms.backend.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Override
    public List<CustomerResponse> search(String term) {
        return customerMapper.toResponseList(customerRepository.search(term));
    }
}
