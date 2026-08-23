package com.hpcrms.backend.security;

import com.hpcrms.backend.entity.Customer;
import com.hpcrms.backend.entity.Employee;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final String username;
    private final String password;
    private final String role;
    private final boolean enabled;

    public UserPrincipal(String username, String password, String role, boolean enabled) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.enabled = enabled;
    }

    public static UserPrincipal fromCustomer(Customer customer) {
        return new UserPrincipal(
                customer.getEmail(),
                customer.getPasswordHash(),
                "CUSTOMER",
                !customer.isAccountLocked());
    }

    public static UserPrincipal fromEmployee(Employee employee) {
        return new UserPrincipal(
                employee.getEmail(),
                employee.getPasswordHash(),
                employee.getRole().name(),
                employee.isActive());
    }

    public String getRole() {
        return role;
    }

    public boolean isStaff() {
        return !"CUSTOMER".equals(role);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return enabled;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
