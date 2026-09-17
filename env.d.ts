import { DefaultTheme } from 'vitepress'

declare global {
  type NavItem = DefaultTheme.NavItem
  type SidebarItem = DefaultTheme.SidebarItem
  type ThemeConfig = DefaultTheme.Config

  interface ImportMetaEnv {
    readonly VITE_SERVER_URL: string
  }
}

export {}