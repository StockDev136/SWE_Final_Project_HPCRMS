import type { VehicleCategory } from "../types";

const CATEGORY_IMAGE: Record<VehicleCategory, string> = {
  ECONOMY: "/vehicle-images/economy.svg",
  COMPACT: "/vehicle-images/compact.svg",
  SEDAN: "/vehicle-images/sedan.svg",
  SUV: "/vehicle-images/suv.svg",
  TRUCK: "/vehicle-images/truck.svg",
  LUXURY: "/vehicle-images/luxury.svg",
  VAN: "/vehicle-images/van.svg",
};

/** Representative image for a vehicle category — used both as the seeded
 * default and as a fallback if a vehicle has no imageUrl of its own. */
export function defaultImageForCategory(category: VehicleCategory): string {
  return CATEGORY_IMAGE[category];
}
