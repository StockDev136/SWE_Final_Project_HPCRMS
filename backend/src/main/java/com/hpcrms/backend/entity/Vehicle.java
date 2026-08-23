package com.hpcrms.backend.entity;

import com.hpcrms.backend.entity.enums.VehicleCategory;
import com.hpcrms.backend.entity.enums.VehicleStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String licensePlate;

    @Column(nullable = false, length = 50)
    private String make;

    @Column(nullable = false, length = 50)
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VehicleStatus status = VehicleStatus.AVAILABLE;

    @Builder.Default
    private int mileage = 0;

    @Column(length = 255)
    private String imageUrl;

    private Double currentLatitude;
    private Double currentLongitude;
}
