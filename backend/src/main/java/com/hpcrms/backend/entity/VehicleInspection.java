package com.hpcrms.backend.entity;

import com.hpcrms.backend.entity.enums.InspectionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_inspections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private InspectionType type;

    @Column(nullable = false)
    private int mileage;

    @Column(nullable = false)
    private int fuelLevel;

    @Lob
    private String conditionNotes;

    @Lob
    private String damagePhotoUrls;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspected_by_employee_id")
    private Employee inspectedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime inspectedAt;

    @PrePersist
    protected void onCreate() {
        this.inspectedAt = LocalDateTime.now();
    }
}
