/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // Add other environment variables here
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Declare modules for file types that TypeScript doesn't recognize by default
declare module '*.svg' {


    const src: string;

}

declare module '*.jpg' {
    const content: string;

}

declare module '*.png' {
    const content: string;

}

declare module '*.json' {
    const content: string;

}

declare module '*.mp3' {
    const src: string;

}