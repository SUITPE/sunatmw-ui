import React from 'react'
import ReactDOM from 'react-dom/client'
import WidgetApp from './WidgetApp'
import { getWidgetCSS } from './widget-styles'
import type { WidgetTheme } from './widget-styles'

// ---------------------------------------------------------------------------
// <sunat-widget> Web Component
//
// Attributes:
//   api-key  (required) - API key for authentication
//   api-url  (optional) - Base URL of the SUNAT middleware API
//   theme    (optional) - "light" | "dark" (default: "light")
//   locale   (optional) - "es" (default: "es", reserved for future i18n)
// ---------------------------------------------------------------------------

const DEFAULT_API_URL = 'http://localhost:3000'

class SunatWidget extends HTMLElement {
  private root: ReactDOM.Root | null = null
  private shadow: ShadowRoot

  static get observedAttributes(): string[] {
    return ['api-key', 'api-url', 'theme', 'locale']
  }

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback(): void {
    this.render()
  }

  disconnectedCallback(): void {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }
  }

  attributeChangedCallback(): void {
    // Re-render when attributes change
    this.render()
  }

  private render(): void {
    const apiKey = this.getAttribute('api-key') ?? ''
    const apiUrl = this.getAttribute('api-url') ?? DEFAULT_API_URL
    const theme = (this.getAttribute('theme') ?? 'light') as WidgetTheme

    if (!apiKey) {
      this.shadow.innerHTML = `
        <div style="padding:16px;color:#dc2626;font-family:sans-serif;font-size:14px;border:1px solid #dc2626;border-radius:6px;">
          Error: el atributo <code>api-key</code> es obligatorio en &lt;sunat-widget&gt;.
        </div>
      `
      return
    }

    // Build the shadow DOM structure
    // Clear any previous error HTML
    if (!this.root) {
      this.shadow.innerHTML = ''

      // Inject styles
      const styleEl = document.createElement('style')
      styleEl.textContent = getWidgetCSS(theme)
      this.shadow.appendChild(styleEl)

      // Create mount point
      const mountPoint = document.createElement('div')
      mountPoint.setAttribute('id', 'sunat-widget-mount')
      this.shadow.appendChild(mountPoint)

      this.root = ReactDOM.createRoot(mountPoint)
    } else {
      // Update styles on theme change
      const styleEl = this.shadow.querySelector('style')
      if (styleEl) {
        styleEl.textContent = getWidgetCSS(theme)
      }
    }

    this.root.render(
      React.createElement(WidgetApp, {
        apiKey,
        apiUrl,
        host: this,
      }),
    )
  }
}

// Register the custom element if not already defined
if (!customElements.get('sunat-widget')) {
  customElements.define('sunat-widget', SunatWidget)
}
