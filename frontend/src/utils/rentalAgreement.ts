import type { ReservationResponse } from "../types";

/**
 * Generates the rental agreement text shown to the customer before they can
 * sign and check in. Built client-side from the reservation's own data so no
 * extra backend call is needed before signing — the backend independently
 * generates and stores its own copy of the contract text once check-in
 * actually completes (see CheckInServiceImpl.generateContractText), so this
 * is a preview, not the system of record.
 */
export function generateAgreementText(r: ReservationResponse): string {
  const vehicleDesc = r.vehicle
    ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.licensePlate})`
    : "Vehicle to be assigned";
  const returnLocation = r.dropoffBranchName ?? r.pickupBranchName;

  return `HPCRMS VEHICLE RENTAL AGREEMENT

Renter: ${r.customerName}
Vehicle: ${vehicleDesc}
Pickup: ${r.pickupBranchName} on ${r.startDate}${r.pickupTime ? ` at ${r.pickupTime}` : ""}
Return: ${returnLocation} on ${r.endDate}${r.returnTime ? ` at ${r.returnTime}` : ""}
Estimated Charges: $${r.estimatedCost}

TERMS AND CONDITIONS

1. Eligibility. The Renter confirms they hold a valid driver's license, meet the minimum age requirement, and that the license is not expired, as verified during identity verification.

2. Rental Period. The vehicle must be returned to the branch above by the date and time stated. Late returns may incur additional daily charges at the rate shown for this vehicle.

3. Condition and Use. The Renter agrees to operate the vehicle in a safe and lawful manner and to return it in the same condition as received, ordinary wear excepted. The vehicle may not be used for illegal purposes, off-road driving, or driven by any person other than the Renter without prior authorization.

4. Fuel Policy. The vehicle should be returned with the same fuel level recorded at pickup.

5. Damage and Liability. The Renter is responsible for any damage to the vehicle beyond normal wear during the rental period, subject to inspection at pickup and at return.

6. Payment. The Renter authorizes HPCRMS to charge the payment method on file for the estimated rental amount shown above, and for any additional charges arising from this agreement.

7. Early Return. A vehicle returned before the scheduled end date may still be charged the full reserved amount, unless the early return is due to a documented vehicle issue confirmed at return.

By signing below, the Renter acknowledges they have read, understood, and agree to be bound by the terms of this Rental Agreement.`;
}

/**
 * Requires an actual first + last name, not just any non-empty text — fixes
 * the gap where a single character or nonsense string was accepted as a
 * "signature."
 */
export function isValidFullName(signature: string): boolean {
  const trimmed = signature.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every((p) => /^[A-Za-z.'-]+$/.test(p));
}
