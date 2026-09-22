import type { Theme } from 'vitepress'
import BaseTheme, { themeContextKey, VoidZeroTheme } from '@voidzero-dev/vitepress-theme'
import { Watermark } from './components/Watermark'
import { Links } from './components/Links'

import logoDark from '/logo_w_b.svg'
import logoLight from '/logo_w_w.svg'
import footerBg from '@assets/vite/footer-background.jpg'
import monoIcon from '@assets/icons/viteplus-mono.svg'
import './styles.css'

export default {
  extends: BaseTheme,
  enhanceApp({ app }) {
    app.provide(themeContextKey, {
      logoDark,
      logoLight,
      logoAlt: 'verse',
			footerBg,
      monoIcon,
    })
    app.component('Watermark', Watermark)
    app.component('Links', Links)
    // VoidZeroTheme.enhanceApp(ctx)
  },
} satisfies Theme