/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_MONGODB_URI: string
    readonly VITE_NODE_ENV: string
    readonly VITE_DEFAULT_ADMIN_USER: string
    readonly VITE_DEFAULT_ADMIN_PASS: string
    readonly VITE_MASTER_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
