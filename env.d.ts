/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const component: DefineComponent<{}, {}, any>
    export default component
  }

declare module 'fake-backend'
declare module 'fetch-wrapper'
declare module 'bootstrap'
declare module 'global.d.ts'

declare const __BUILD_TIME__: string