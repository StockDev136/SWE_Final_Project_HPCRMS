import type { VehicleCategory } from "../types";

const CATEGORY_IMAGE: Record<VehicleCategory, string> = {
  ECONOMY: "/vehicle-images/economy.jpg",
  COMPACT: "/vehicle-images/compact.jpg",
  SEDAN: "/vehicle-images/sedan.jpg",
  SUV: "/vehicle-images/suv.jpg",
  TRUCK: "/vehicle-images/truck.jpg",
  LUXURY: "/vehicle-images/luxury.jpg",
  VAN: "/vehicle-images/van.jpg",
};

/** Representative image for a vehicle category — used both as the seeded
 * default and as a fallback if a vehicle has no imageUrl of its own. */
export function defaultImageForCategory(category: VehicleCategory): string {
  return CATEGORY_IMAGE[category];
}
