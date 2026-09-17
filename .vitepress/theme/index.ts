import type { Theme } from 'vitepress'
import BaseTheme, { themeContextKey, VoidZeroTheme } from '@voidzero-dev/vitepress-theme'
import logoDark from '/logoFFF.png'
import logoLight from '/logoFFF.png'
import footerBg from '@assets/vite/footer-background.jpg'
import monoIcon from '@assets/icons/viteplus-mono.svg'
import './styles.css'

export default {
  extends: BaseTheme,
  enhanceApp(ctx) {
		VoidZeroTheme.enhanceApp(ctx),
    ctx.app.provide(themeContextKey, {
      logoDark,
      logoLight,
      logoAlt: 'verse',
			footerBg,
      monoIcon,
    })
  },
} satisfies Theme