package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.RentalAgreement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RentalAgreementRepository extends JpaRepository<RentalAgreement, Long> {
    Optional<RentalAgreement> findByReservationId(Long reservationId);
}
