package com.hpcrms.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "rental_agreements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    private Reservation reservation;

    @Lob
    @Column(nullable = false)
    private String contractText;

    @Lob
    private String signatureData;

    private LocalDateTime signedDate;
}
