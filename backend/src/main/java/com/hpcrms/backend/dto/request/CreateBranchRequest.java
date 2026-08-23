package com.hpcrms.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateBranchRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String address;

    @NotBlank
    private String city;

    private String phone;
}
