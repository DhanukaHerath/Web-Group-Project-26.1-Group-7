/* setup.js – registers <humation-avatar> once and exposes the asset manifest.
   Resolved through the import map in each HTML page → ./vendor/humation/... */
import { defineAvatarElement } from '@humation/web-component';
import { humation1 } from '@humation/assets-humation-1';

defineAvatarElement(humation1);

export const manifest = humation1;
export const SELECTION_SLOTS = manifest.selectionSlots.map(s => ({ id: s.id, label: s.label }));
export const COLOR_SLOTS = manifest.colors; // [{id,label,default,cssVariable}]
