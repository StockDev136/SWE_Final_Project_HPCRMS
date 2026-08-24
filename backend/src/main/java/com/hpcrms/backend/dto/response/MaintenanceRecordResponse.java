package com.hpcrms.backend.dto.response;

import com.hpcrms.backend.entity.enums.MaintenanceStatus;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceRecordResponse {
    private Long id;
    private Long vehicleId;
    private String vehicleDescription;
    private LocalDate scheduledDate;
    private LocalDate completedDate;
    private String description;
    private MaintenanceStatus status;
}
