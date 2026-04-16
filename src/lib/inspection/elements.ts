/**
 * Element checklist definitions per room type.
 *
 * Based on official French état des lieux templates (Décret 2016-382).
 * Every main room gets 10 standard elements.
 * Kitchen adds 8 specific elements.
 * Bathroom adds 3 specific elements.
 * Parties privatives get a lighter checklist (overview only).
 */

export interface ElementDef {
  key: string;
  labelFr: string;
  labelEn: string;
}

/* 10 standard elements — every main room */
export const STANDARD_ELEMENTS: ElementDef[] = [
  { key: "portes", labelFr: "Portes, menuiserie", labelEn: "Doors, woodwork" },
  { key: "fenetres", labelFr: "Fenêtres (vitres et volets)", labelEn: "Windows (glass and shutters)" },
  { key: "plafond", labelFr: "Plafond", labelEn: "Ceiling" },
  { key: "sol", labelFr: "Sol", labelEn: "Floor" },
  { key: "plinthes", labelFr: "Plinthes", labelEn: "Baseboards" },
  { key: "murs", labelFr: "Murs", labelEn: "Walls" },
  { key: "chauffage", labelFr: "Chauffage / tuyauterie", labelEn: "Heating / plumbing" },
  { key: "prises", labelFr: "Prises et interrupteurs", labelEn: "Outlets and switches" },
  { key: "eclairage", labelFr: "Éclairage", labelEn: "Lighting" },
  { key: "rangement", labelFr: "Rangement / placard", labelEn: "Storage / cupboard" },
];

/* Extra elements for kitchen */
export const KITCHEN_ELEMENTS: ElementDef[] = [
  { key: "evier", labelFr: "Évier(s)", labelEn: "Sink(s)" },
  { key: "evacuations", labelFr: "Évacuations eau", labelEn: "Drainage" },
  { key: "plaques", labelFr: "Plaques de cuisson", labelEn: "Hob/stovetop" },
  { key: "lave_vaisselle", labelFr: "Lave-vaisselle", labelEn: "Dishwasher" },
  { key: "refrigerateur", labelFr: "Réfrigérateur", labelEn: "Fridge" },
  { key: "hotte", labelFr: "Hotte", labelEn: "Extractor hood" },
  { key: "plan_travail", labelFr: "Plan de travail", labelEn: "Worktop" },
  { key: "four", labelFr: "Four", labelEn: "Oven" },
];

/* Extra elements for bathroom */
export const BATHROOM_ELEMENTS: ElementDef[] = [
  { key: "baignoire_douche", labelFr: "Baignoire / douche", labelEn: "Bath / shower" },
  { key: "evier_sdb", labelFr: "Lavabo", labelEn: "Washbasin" },
  { key: "robinetterie", labelFr: "Robinetterie", labelEn: "Taps/fittings" },
];

/* Parties privatives — lighter checklist */
export const PRIVATIVE_ELEMENTS: ElementDef[] = [
  { key: "etat_general", labelFr: "État général", labelEn: "General condition" },
  { key: "sol", labelFr: "Sol", labelEn: "Floor" },
  { key: "murs", labelFr: "Murs / clôture", labelEn: "Walls / fencing" },
];

/* Rating scale */
export type Rating = "TB" | "B" | "M" | "MV";

export const RATINGS: { value: Rating; labelFr: string; labelEn: string; color: string }[] = [
  { value: "TB", labelFr: "Très bon", labelEn: "Very good", color: "text-tenu-success" },
  { value: "B", labelFr: "Bon", labelEn: "Good", color: "text-tenu-forest" },
  { value: "M", labelFr: "Moyen", labelEn: "Fair", color: "text-tenu-warning" },
  { value: "MV", labelFr: "Mauvais", labelEn: "Poor", color: "text-tenu-danger" },
];

/* Room types that are kitchens, bathrooms, or privatives */
const KITCHEN_TYPES = new Set(["cuisine"]);
const BATHROOM_TYPES = new Set(["salle_de_bain", "salle_de_bain_2"]);
const PRIVATIVE_TYPES = new Set(["cave", "parking", "balcon", "terrasse", "jardin"]);

/**
 * Get the full element checklist for a given room type.
 */
export function getElementsForRoomType(roomType: string): ElementDef[] {
  if (PRIVATIVE_TYPES.has(roomType)) {
    return PRIVATIVE_ELEMENTS;
  }
  const base = [...STANDARD_ELEMENTS];
  if (KITCHEN_TYPES.has(roomType)) {
    return [...base, ...KITCHEN_ELEMENTS];
  }
  if (BATHROOM_TYPES.has(roomType)) {
    return [...base, ...BATHROOM_ELEMENTS];
  }
  return base;
}
