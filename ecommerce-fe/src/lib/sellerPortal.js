// Seller portal runs as a separate app; override per environment with VITE_SELLER_URL.
export const SELLER_PORTAL_URL = import.meta.env.VITE_SELLER_URL || 'http://localhost:3001'
