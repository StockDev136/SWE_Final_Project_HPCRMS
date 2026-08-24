package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.PickupResponse;
import com.hpcrms.backend.entity.Reservation;
import com.hpcrms.backend.entity.Vehicle;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.entity.enums.VehicleStatus;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.repository.ReservationRepository;
import com.hpcrms.backend.repository.VehicleRepository;
import com.hpcrms.backend.service.PickupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PickupServiceImpl implements PickupService {

    private final ReservationRepository reservationRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    @Transactional
    public PickupResponse pickupVehicle(String pickupCode) {
        Reservation reservation = reservationRepository.findByPickupCode(pickupCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invalid or expired pickup code. Please see a Rental Agent for assistance."));

        if (reservation.getStatus() != ReservationStatus.READY_FOR_PICKUP) {
            throw new IllegalStateException(
                    "Reservation is not ready for pickup, current status: " + reservation.getStatus());
        }
        if (!reservation.isPaid()) {
            throw new IllegalStateException("Reservation has not been paid yet");
        }
        if (LocalDate.now().isBefore(reservation.getStartDate())) {
            throw new IllegalStateException(
                    "This reservation cannot be picked up before " + reservation.getStartDate());
        }

        // Vehicle assignment happens at reservation creation in this system, so
        // by the time a reservation reaches READY_FOR_PICKUP a vehicle is always
        // already attached — no auto-assignment step is needed here.
        Vehicle vehicle = reservation.getVehicle();

        reservation.setStatus(ReservationStatus.ACTIVE_RENTAL);
        reservationRepository.save(reservation);

        vehicle.setStatus(VehicleStatus.RENTED);
        vehicleRepository.save(vehicle);

        String instructions;
        if (vehicle.getParkingStall() != null && !vehicle.getParkingStall().isBlank()) {
            instructions = "Your vehicle is ready at " + reservation.getPickupBranch().getName()
                    + ". Go directly to stall " + vehicle.getParkingStall() + ".";
        } else {
            // No stall assigned yet for this vehicle — fall back to the
            // original plate-lookup instructions rather than send the
            // customer to a stall number that doesn't exist.
            instructions = "Your vehicle is ready at " + reservation.getPickupBranch().getName()
                    + ". Look for license plate " + vehicle.getLicensePlate() + ".";
        }

        return PickupResponse.builder()
                .reservationId(reservation.getId())
                .status(reservation.getStatus())
                .vehicleLicensePlate(vehicle.getLicensePlate())
                .vehicleMake(vehicle.getMake())
                .vehicleModel(vehicle.getModel())
                .parkingStall(vehicle.getParkingStall())
                .pickupBranchName(reservation.getPickupBranch().getName())
                .pickupBranchAddress(reservation.getPickupBranch().getAddress())
                .currentLatitude(vehicle.getCurrentLatitude())
                .currentLongitude(vehicle.getCurrentLongitude())
                .instructions(instructions)
                .build();
    }
}
