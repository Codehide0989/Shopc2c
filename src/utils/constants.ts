// --- ENVIRONMENT VARIABLES (SIMULATED) ---
export const ENV = {
    API_URL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api"),
    MONGODB_URI: import.meta.env.VITE_MONGODB_URI || "", // Not used in frontend anymore
    NODE_ENV: import.meta.env.VITE_NODE_ENV || "development"
};

export const DEFAULT_DISCORD_LINK = "https://discord.gg/shopc2c";
export const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1200";
export const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";

// Admin Defaults
export const DEFAULT_ADMIN_USER = import.meta.env.VITE_DEFAULT_ADMIN_USER || "admin";
export const DEFAULT_ADMIN_PASS = import.meta.env.VITE_DEFAULT_ADMIN_PASS || "admin123";
export const MASTER_KEY = import.meta.env.VITE_MASTER_KEY || "master_root";
