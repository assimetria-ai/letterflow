// @system — product identity config
// Merges with @custom/info.js overrides when present
import { customInfo } from '../@custom/info'

const defaults = {
  name: 'ProductTemplate',
  tagline: 'Your product tagline here',
  url: import.meta.env.VITE_APP_URL ?? 'http://localhost:5173',
  supportEmail: 'support@example.com',
}

export const info = { ...defaults, ...customInfo }
