import type { DefaultTheme } from 'vitepress'

declare global {
  type NavItem = DefaultTheme.NavItem
  type SidebarItem = DefaultTheme.SidebarItem
  type ThemeConfig = DefaultTheme.Config
}

declare module 'vite' {
  interface ImportMetaEnv {
    readonly VITE_SERVER_URL: string
  }
}

export {}
