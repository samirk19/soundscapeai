/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: "http://localhost:5173/";
    // Add other environment variables here
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  // Declare modules for file types that TypeScript doesn't recognize by default
  declare module '*.svg' {
    import React = require('react');
    export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
  }
  
  declare module '*.jpg' {
    const content: string;
    export default content;
  }
  
  declare module '*.png' {
    const content: string;
    export default content;
  }
  
  declare module '*.json' {
    const content: string;
    export default content;
  }
  
  declare module '*.mp3' {
    const src: string;
    export default src;
  }