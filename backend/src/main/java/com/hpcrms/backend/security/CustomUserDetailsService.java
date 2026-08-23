package com.hpcrms.backend.security;

import com.hpcrms.backend.repository.CustomerRepository;
import com.hpcrms.backend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    public UserDetails loadUserByUsername(String email) {
        return customerRepository.findByEmail(email)
                .map(UserPrincipal::fromCustomer)
                .or(() -> employeeRepository.findByEmail(email).map(UserPrincipal::fromEmployee))
                .orElseThrow(() -> new UsernameNotFoundException("No account found for email: " + email));
    }
}
