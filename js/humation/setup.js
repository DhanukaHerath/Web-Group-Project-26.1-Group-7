import { defineAvatarElement } from "@humation/web-component";
import { humation1 } from "@humation/assets-humation-1";

defineAvatarElement(humation1);

// The avatar data holds here
export const manifest = humation1;
export const SELECTION_SLOTS = manifest.selectionSlots.map((s) => ({
  id: s.id,
  label: s.label,
}));
export const COLOR_SLOTS = manifest.colors;
