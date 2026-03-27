/** Site base URL for sitemap, robots, canonical links */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://drccars.com";

// Approximate USD → CDF rate (update via env or admin later)
export const CDF_PER_USD = Number(process.env.NEXT_PUBLIC_CDF_PER_USD) || 2750;

/** Support/admin email for sellers to reach out (e.g. when listing rejected) */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@drccars.com";

export const CURRENCIES = ["USD", "CDF"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CONDITIONS = [
  { value: "used", labelEn: "Used", labelFr: "Occasion" },
  { value: "new", labelEn: "New", labelFr: "Neuf" },
] as const;
export type Condition = (typeof CONDITIONS)[number]["value"];

export const TRANSMISSIONS = [
  { value: "automatic", labelEn: "Automatic", labelFr: "Automatique" },
  { value: "manual", labelEn: "Manual", labelFr: "Manuelle" },
] as const;
export type Transmission = (typeof TRANSMISSIONS)[number]["value"];

export const FUEL_TYPES = [
  { value: "essence", labelEn: "Petrol", labelFr: "Essence" },
  { value: "diesel", labelEn: "Diesel", labelFr: "Diesel" },
  { value: "electric", labelEn: "Electric", labelFr: "Électrique" },
  { value: "hybrid", labelEn: "Hybrid", labelFr: "Hybride" },
] as const;
export type FuelType = (typeof FUEL_TYPES)[number]["value"];

/** Common makes for browse filters (top sellers) */
export const COMMON_MAKES = [
  "Toyota", "Mercedes-Benz", "BMW", "Nissan", "Hyundai", "Honda", "Land Rover", "Ford",
];
export const OTHER_MAKE = "Other";

/** Pre-established list of car makes for add/edit forms (alphabetically sorted) */
export const CAR_MAKES = [
  "Audi", "BAIC", "BMW", "BYD", "Changan", "Chevrolet", "Chery", "Citroën",
  "Dacia", "Dongfeng", "Faw", "Fiat", "Ford", "Foton", "Geely", "GAC",
  "Haval", "Honda", "Hyundai", "Isuzu", "JAC", "Jeep", "Kia", "Land Rover",
  "Lexus", "Mahindra", "Mazda", "Mercedes-Benz", "MG", "Mini", "Mitsubishi",
  "Nissan", "Peugeot", "Renault", "SsangYong", "Subaru", "Suzuki", "Toyota",
  "Volkswagen", "Volvo", "Other",
] as const;
export type CarMake = (typeof CAR_MAKES)[number];

/** Main cities/provinces for location filter (matches home page) */
export const DRC_LOCATIONS = [
  "Kinshasa",
  "Lubumbashi",
  "Goma",
  "Bukavu",
  "Kisangani",
  "Beni",
  "Butembo",
  "Uvira",
];

export const CAR_TYPES = [
  "Sedan", "SUV", "Hatchback", "Van", "Truck", "Pick up", "Wagon", "Coupe",
  "Mini Van", "Mini Bus", "Bus", "Convertible", "Machinery", "Other",
];

/** Listing type: sale only, rent only, or both */
export const LISTING_TYPES = [
  { value: "sale", labelEn: "For sale", labelFr: "À vendre" },
  { value: "rent", labelEn: "For rent", labelFr: "À louer" },
  { value: "both", labelEn: "Sale & rent", labelFr: "Vente & location" },
] as const;
export type ListingType = (typeof LISTING_TYPES)[number]["value"];

/** Event categories for rentals */
export const RENTAL_EVENT_TYPES = [
  { value: "wedding", labelEn: "Weddings", labelFr: "Mariages" },
  { value: "tourism", labelEn: "Tourism", labelFr: "Tourisme" },
  { value: "corporate", labelEn: "Corporate", labelFr: "Entreprises" },
  { value: "airport", labelEn: "Airport / Transfer", labelFr: "Aéroport / Transfert" },
  { value: "private", labelEn: "Private hire", labelFr: "Location privée" },
] as const;
export type RentalEventType = (typeof RENTAL_EVENT_TYPES)[number]["value"];

/** Translation keys for event types (use with t()) */
export const RENTAL_EVENT_TRANSLATION_KEYS: Record<RentalEventType, string> = {
  wedding: "eventWedding",
  tourism: "eventTourism",
  corporate: "eventCorporate",
  airport: "eventAirport",
  private: "eventPrivate",
};

/** Translation keys for listing types */
export const LISTING_TYPE_TRANSLATION_KEYS: Record<ListingType, string> = {
  sale: "forSale",
  rent: "forRent",
  both: "saleAndRent",
};

export type CarFeature = { id: string; labelEn: string; labelKey?: string };

/** Car features (amenities/equipment) – select multiple per listing */
export const CAR_FEATURES: readonly CarFeature[] = [
  { id: "dgda_documents", labelEn: "DGDA documents", labelKey: "featureDgdaDocuments" },
  { id: "carte_rose", labelEn: "Carte rose", labelKey: "featureCarteRose" },
  { id: "has_some_issues", labelEn: "A quelques pannes", labelKey: "featureHasSomeIssues" },
  { id: "recent_technical_inspection", labelEn: "Recent controle technique", labelKey: "featureRecentTechnicalInspection" },
  { id: "insurance_available", labelEn: "Assurance", labelKey: "featureInsuranceAvailable" },
  { id: "cd_player", labelEn: "CD Player", labelKey: "featureCdPlayer" },
  { id: "sun_roof", labelEn: "Sun Roof", labelKey: "featureSunRoof" },
  { id: "leather_seat", labelEn: "Leather Seat", labelKey: "featureLeatherSeat" },
  { id: "alloy_wheels", labelEn: "Alloy Wheels", labelKey: "featureAlloyWheels" },
  { id: "power_steering", labelEn: "Power Steering", labelKey: "featurePowerSteering" },
  { id: "power_window", labelEn: "Power Window", labelKey: "featurePowerWindow" },
  { id: "ac", labelEn: "A/C", labelKey: "featureAc" },
  { id: "abs", labelEn: "ABS", labelKey: "featureAbs" },
  { id: "airbag", labelEn: "Airbag", labelKey: "featureAirbag" },
  { id: "radio", labelEn: "Radio", labelKey: "featureRadio" },
  { id: "cd_changer", labelEn: "CD Changer", labelKey: "featureCdChanger" },
  { id: "dvd", labelEn: "DVD", labelKey: "featureDvd" },
  { id: "tv", labelEn: "TV", labelKey: "featureTv" },
  { id: "power_seat", labelEn: "Power Seat", labelKey: "featurePowerSeat" },
  { id: "back_tire", labelEn: "Back Tire", labelKey: "featureBackTire" },
  { id: "grill_guard", labelEn: "Grill Guard", labelKey: "featureGrillGuard" },
  { id: "rear_spoiler", labelEn: "Rear Spoiler", labelKey: "featureRearSpoiler" },
  { id: "central_locking", labelEn: "Central Locking", labelKey: "featureCentralLocking" },
  { id: "jack", labelEn: "Jack", labelKey: "featureJack" },
  { id: "spare_tire", labelEn: "Spare Tire", labelKey: "featureSpareTire" },
  { id: "wheel_spanner", labelEn: "Wheel Spanner", labelKey: "featureWheelSpanner" },
  { id: "fog_lights", labelEn: "Fog Lights", labelKey: "featureFogLights" },
  { id: "back_camera", labelEn: "Back Camera", labelKey: "featureBackCamera" },
  { id: "push_start", labelEn: "Push Start", labelKey: "featurePushStart" },
  { id: "keyless_entry", labelEn: "Keyless Entry", labelKey: "featureKeylessEntry" },
  { id: "esc", labelEn: "ESC", labelKey: "featureEsc" },
  { id: "camera_360", labelEn: "360 Degree Camera", labelKey: "featureCamera360" },
  { id: "body_kit", labelEn: "Body Kit", labelKey: "featureBodyKit" },
  { id: "side_airbag", labelEn: "Side Airbag", labelKey: "featureSideAirbag" },
  { id: "power_mirror", labelEn: "Power Mirror", labelKey: "featurePowerMirror" },
  { id: "side_skirts", labelEn: "Side Skirts", labelKey: "featureSideSkirts" },
  { id: "front_lip_spoiler", labelEn: "Front Lip Spoiler", labelKey: "featureFrontLipSpoiler" },
  { id: "navigation", labelEn: "Navigation", labelKey: "featureNavigation" },
  { id: "turbo", labelEn: "Turbo", labelKey: "featureTurbo" },
  { id: "power_slide_door", labelEn: "Power Slide Door", labelKey: "featurePowerSlideDoor" },
];
export type CarFeatureId = CarFeature["id"];

export const CAR_FEATURE_BY_ID = Object.fromEntries(
  CAR_FEATURES.map((f) => [f.id, f] as const)
) as Record<string, CarFeature>;
