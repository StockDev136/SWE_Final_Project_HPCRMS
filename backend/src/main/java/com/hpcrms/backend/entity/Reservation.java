package com.hpcrms.backend.entity;

import com.hpcrms.backend.entity.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch pickupBranch;

    /** Drop-off location, if different from pickupBranch. Null means the
     * vehicle is returned to the same branch it was picked up from. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dropoff_branch_id")
    private Branch dropoffBranch;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    private LocalTime pickupTime;

    private LocalTime returnTime;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    private BigDecimal finalCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.PENDING;

    @Builder.Default
    private boolean identityVerified = false;

    @Builder.Default
    private boolean disputed = false;

    @Builder.Default
    private boolean paid = false;

    @Column(unique = true, length = 12)
    private String pickupCode;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
