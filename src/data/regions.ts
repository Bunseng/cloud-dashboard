/* ------------------------------------------------------------------ *
 * VPS Region & Location — where a server's datacenter actually sits,
 * same split Hetzner/DigitalOcean show on their own instance detail
 * pages (datacenter code, city, country, network zone) plus a map to
 * place it visually. CreateVpsPage's own province picker stays a flat
 * list of names; this is the richer lookup the instance detail page's
 * "Region & Location" panel renders from. `x`/`y` are percentage
 * coordinates into the CambodiaMap viewBox, not real geographic data —
 * close enough to read as "about where that city is" on a simplified
 * outline, not a surveyed map.
 * ------------------------------------------------------------------ */

export interface VpsRegion {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  datacenter: string;
  networkZone: string;
  available: boolean;
  x: number;
  y: number;
}

export const VPS_REGIONS: VpsRegion[] = [
  {
    id: "phnom-penh",
    city: "Phnom Penh",
    country: "Cambodia",
    countryCode: "KH",
    datacenter: "PNH-DC1",
    networkZone: "KH-Central",
    available: true,
    x: 50,
    y: 62,
  },
  {
    id: "siem-reap",
    city: "Siem Reap",
    country: "Cambodia",
    countryCode: "KH",
    datacenter: "SIP-DC1",
    networkZone: "KH-North",
    available: false,
    x: 38,
    y: 28,
  },
  {
    id: "battambang",
    city: "Battambang",
    country: "Cambodia",
    countryCode: "KH",
    datacenter: "BTB-DC1",
    networkZone: "KH-North",
    available: false,
    x: 22,
    y: 34,
  },
  {
    id: "preah-sihanouk",
    city: "Preah Sihanouk",
    country: "Cambodia",
    countryCode: "KH",
    datacenter: "SHV-DC1",
    networkZone: "KH-South",
    available: false,
    x: 28,
    y: 88,
  },
  {
    id: "kampong-cham",
    city: "Kampong Cham",
    country: "Cambodia",
    countryCode: "KH",
    datacenter: "KPC-DC1",
    networkZone: "KH-Central",
    available: false,
    x: 64,
    y: 50,
  },
  {
    id: "kandal",
    city: "Kandal",
    country: "Cambodia",
    countryCode: "KH",
    datacenter: "KDL-DC1",
    networkZone: "KH-Central",
    available: false,
    x: 54,
    y: 68,
  },
];

// Accepts either a bare city ("Phnom Penh") or the "City, KH" shorthand
// used elsewhere on the instance detail page — whichever a given record
// happens to store.
export function findVpsRegion(region: string): VpsRegion | undefined {
  const city = region.split(",")[0]?.trim();
  return VPS_REGIONS.find((r) => r.city === city);
}
