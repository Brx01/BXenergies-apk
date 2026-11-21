export const PLANT = {
  name: "BX Energies Nigeria",
  phoneDisplay: "+234 903 809 8658",
  phoneTel: "+2349038098658",
  whatsapp: "2349038098658",
  email: "bxenergies@gmail.com",
  street: "Amagba Junction, off Sapele Road",
  city: "Benin City",
  region: "Edo State",
  maps: "https://maps.google.com/?q=6.2650,5.6050",
  lat: 6.265,
  lng: 5.605,
} as const;

export const GAS_PER_KG = 1350;
export const DELIVERY_FEE = 2000;
export const MIN_KG = 0.5;
export const MAX_KG = 100;

export const PRESETS = [6, 12.5, 25, 50] as const;

export const CYLINDER_SIZES = [6, 12.5, 25, 50] as const;

export const AREAS = [
  "Amagba Junction",
  "Amagba GRA",
  "BIU axis",
  "Limit Road",
  "Aruogba",
  "Sapele Road",
] as const;

export const ADDONS = [
  { id: "regulator", label: "Low-pressure regulator" },
  { id: "hose", label: "Hose (1.5 m) and clips" },
] as const;

export type Fulfillment = "pickup" | "delivery";

export type OrderDraft = {
  kgText: string;
  fulfillment: Fulfillment;
  wantCylinder: boolean;
  cylinderKg: (typeof CYLINDER_SIZES)[number];
  addons: string[];
  area: string;
  address: string;
  name: string;
  phone: string;
  note: string;
};

export const DEFAULT_DRAFT: OrderDraft = {
  kgText: "12.5",
  fulfillment: "delivery",
  wantCylinder: false,
  cylinderKg: 12.5,
  addons: [],
  area: "",
  address: "",
  name: "",
  phone: "",
  note: "",
};

const TZ = "Africa/Lagos";

export function plantStatus(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = read("weekday");
  const mins = Number(read("hour")) * 60 + Number(read("minute"));
  const opens = weekday === "Sun" ? 10 * 60 : 7 * 60;
  const closes = 21 * 60;
  const open = mins >= opens && mins < closes;
  return {
    open,
    label: open ? "Open now" : "Closed now",
    hours: weekday === "Sun" ? "Sunday 10am–9pm" : "Mon–Sat 7am–9pm",
  };
}

export function naira(amount: number) {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export function parsedKg(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  if (rounded < MIN_KG || rounded > MAX_KG) return null;
  return rounded;
}

export function formatKg(kg: number) {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}

export function gasTotal(kg: number) {
  return Math.round(kg * GAS_PER_KG);
}

export function orderTotal(draft: OrderDraft) {
  const kg = parsedKg(draft.kgText);
  const gas = kg == null ? 0 : gasTotal(kg);
  const delivery = draft.fulfillment === "delivery" ? DELIVERY_FEE : 0;
  return { kg, gas, delivery, total: gas + delivery };
}

export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function problemsFor(draft: OrderDraft) {
  const issues: string[] = [];
  const kg = parsedKg(draft.kgText);
  if (kg == null) {
    issues.push(`Enter a weight between ${MIN_KG} kg and ${MAX_KG} kg.`);
  }
  if (draft.name.trim().length < 2) issues.push("Add the name for this order.");
  const digits = phoneDigits(draft.phone);
  if (digits.length < 10 || digits.length > 15) {
    issues.push("Add a phone number we can reach.");
  }
  if (draft.fulfillment === "delivery") {
    if (!draft.area) issues.push("Choose a delivery area.");
    if (draft.address.trim().length < 5) issues.push("Add the delivery address.");
  }
  return issues;
}

export function orderMessage(draft: OrderDraft) {
  const { kg, gas, delivery, total } = orderTotal(draft);
  const lines = [
    "Hello BX Energies, I would like to place an order.",
    "",
    kg == null
      ? "Gas: weight to confirm"
      : `Gas: ${formatKg(kg)} kg × ${naira(GAS_PER_KG)} = ${naira(gas)}`,
    draft.fulfillment === "delivery"
      ? `Delivery: ${naira(delivery)} flat fee`
      : "Pickup: at Amagba Junction (no delivery fee)",
    "Leak check: included",
  ];
  if (draft.wantCylinder) {
    lines.push(
      `New empty cylinder: ${formatKg(draft.cylinderKg)} kg — please confirm price and stock`,
    );
  }
  const addonLabels = ADDONS.filter((addon) => draft.addons.includes(addon.id)).map(
    (addon) => addon.label,
  );
  if (addonLabels.length) {
    lines.push(`Accessories: ${addonLabels.join(", ")} — please confirm price`);
  }
  lines.push("", `Gas + delivery total: ${naira(total)}`);
  lines.push(
    "",
    `Name: ${draft.name.trim() || "—"}`,
    `Phone: ${draft.phone.trim() || "—"}`,
  );
  if (draft.fulfillment === "delivery") {
    lines.push(`Area: ${draft.area || "—"}`, `Address: ${draft.address.trim() || "—"}`);
  }
  if (draft.note.trim()) lines.push(`Note: ${draft.note.trim()}`);
  return lines.join("\n");
}

export function whatsappHref(text: string) {
  return `https://wa.me/${PLANT.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "GasStation",
  name: PLANT.name,
  description:
    "100% digitally metered LPG cooking gas refills, brand-new cylinders, gas accessories, and doorstep pickup and delivery across Amagba and Benin City.",
  url: "https://bxenergies.com",
  telephone: PLANT.phoneTel,
  email: PLANT.email,
  priceRange: "₦₦",
  currenciesAccepted: "NGN",
  paymentAccepted: "Cash, Bank Transfer, POS",
  address: {
    "@type": "PostalAddress",
    streetAddress: PLANT.street,
    addressLocality: PLANT.city,
    addressRegion: PLANT.region,
    addressCountry: "NG",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: PLANT.lat,
    longitude: PLANT.lng,
  },
  areaServed: AREAS.map((name) => ({ "@type": "Place", name: `${name}, Benin City` })),
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "07:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "10:00",
      closes: "21:00",
    },
  ],
  makesOffer: {
    "@type": "Offer",
    itemOffered: {
      "@type": "Product",
      name: "LPG Cooking Gas Refill (Per KG)",
      description: "Digitally weighed LPG refill with a free home safety leak check.",
    },
    priceCurrency: "NGN",
    price: String(GAS_PER_KG),
    availability: "https://schema.org/InStock",
  },
};
