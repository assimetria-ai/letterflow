// @custom — product-specific config override
// Override any values from @system/info.ts here.
// This file is NEVER overwritten during template sync.

export const customInfo = {
  name: 'Letterflow',
  tagline: 'Write. Land. Earn.',
  url: import.meta.env.VITE_APP_URL ?? 'https://letterflow-production.up.railway.app',
  supportEmail: 'support@letterflow.com',
}
