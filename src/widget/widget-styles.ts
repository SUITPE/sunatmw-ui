// ---------------------------------------------------------------------------
// Inline CSS for the <sunat-widget> Shadow DOM.
// Two themes: light and dark.
// ---------------------------------------------------------------------------

export type WidgetTheme = 'light' | 'dark'

interface ThemeTokens {
  bg: string
  bgCard: string
  bgInput: string
  bgMuted: string
  text: string
  textMuted: string
  border: string
  primary: string
  primaryText: string
  success: string
  successBg: string
  error: string
  errorBg: string
  inputBorder: string
  inputFocus: string
}

const lightTokens: ThemeTokens = {
  bg: '#ffffff',
  bgCard: '#ffffff',
  bgInput: '#ffffff',
  bgMuted: '#f4f4f5',
  text: '#09090b',
  textMuted: '#71717a',
  border: '#e4e4e7',
  primary: '#2563eb',
  primaryText: '#ffffff',
  success: '#16a34a',
  successBg: '#dcfce7',
  error: '#dc2626',
  errorBg: '#fee2e2',
  inputBorder: '#d4d4d8',
  inputFocus: '#2563eb',
}

const darkTokens: ThemeTokens = {
  bg: '#09090b',
  bgCard: '#18181b',
  bgInput: '#27272a',
  bgMuted: '#27272a',
  text: '#fafafa',
  textMuted: '#a1a1aa',
  border: '#3f3f46',
  primary: '#3b82f6',
  primaryText: '#ffffff',
  success: '#22c55e',
  successBg: '#052e16',
  error: '#ef4444',
  errorBg: '#450a0a',
  inputBorder: '#52525b',
  inputFocus: '#3b82f6',
}

export function getWidgetCSS(theme: WidgetTheme): string {
  const t = theme === 'dark' ? darkTokens : lightTokens

  return `
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: ${t.text};
      line-height: 1.5;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .widget-root {
      background: ${t.bgCard};
      border: 1px solid ${t.border};
      border-radius: 8px;
      padding: 24px;
      max-width: 640px;
    }

    .widget-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .widget-subtitle {
      font-size: 13px;
      color: ${t.textMuted};
      margin-bottom: 20px;
    }

    /* --- Sections --- */
    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${t.textMuted};
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid ${t.border};
    }

    /* --- Grid --- */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }

    .grid-5 {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 32px;
      gap: 8px;
      align-items: end;
    }

    /* --- Form elements --- */
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-full {
      grid-column: 1 / -1;
    }

    label {
      font-size: 12px;
      font-weight: 500;
      color: ${t.textMuted};
    }

    input, select {
      height: 36px;
      padding: 0 10px;
      border: 1px solid ${t.inputBorder};
      border-radius: 6px;
      font-size: 13px;
      color: ${t.text};
      background: ${t.bgInput};
      outline: none;
      transition: border-color 0.15s;
      width: 100%;
    }

    input:focus, select:focus {
      border-color: ${t.inputFocus};
      box-shadow: 0 0 0 2px ${t.inputFocus}33;
    }

    input::placeholder {
      color: ${t.textMuted};
      opacity: 0.6;
    }

    /* --- Buttons --- */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 36px;
      padding: 0 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: opacity 0.15s, background 0.15s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: ${t.primary};
      color: ${t.primaryText};
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid ${t.border};
      color: ${t.text};
    }

    .btn-outline:hover:not(:disabled) {
      background: ${t.bgMuted};
    }

    .btn-ghost {
      background: transparent;
      color: ${t.error};
      padding: 0 6px;
      min-width: 32px;
    }

    .btn-ghost:hover:not(:disabled) {
      background: ${t.errorBg};
    }

    .btn-full {
      width: 100%;
      height: 42px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 8px;
    }

    /* --- Items --- */
    .item-row {
      padding: 10px;
      background: ${t.bgMuted};
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .item-number {
      font-size: 12px;
      font-weight: 600;
      color: ${t.textMuted};
    }

    .add-item-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: ${t.primary};
      cursor: pointer;
      background: none;
      border: none;
      padding: 4px 0;
      font-weight: 500;
    }

    .add-item-btn:hover {
      text-decoration: underline;
    }

    /* --- Totals --- */
    .totals {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid ${t.border};
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 3px 0;
    }

    .total-row.grand {
      font-size: 16px;
      font-weight: 700;
      padding-top: 8px;
      margin-top: 6px;
      border-top: 2px solid ${t.border};
    }

    .total-label {
      color: ${t.textMuted};
    }

    .grand .total-label {
      color: ${t.text};
    }

    /* --- Alerts --- */
    .alert {
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 12px;
    }

    .alert-error {
      background: ${t.errorBg};
      color: ${t.error};
      border: 1px solid ${t.error}33;
    }

    .alert-success {
      background: ${t.successBg};
      color: ${t.success};
      border: 1px solid ${t.success}33;
    }

    /* --- Result --- */
    .result {
      text-align: center;
      padding: 24px 0;
    }

    .result-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .result-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }

    .result-status.accepted {
      background: ${t.successBg};
      color: ${t.success};
    }

    .result-status.rejected {
      background: ${t.errorBg};
      color: ${t.error};
    }

    .result-status.other {
      background: ${t.bgMuted};
      color: ${t.textMuted};
    }

    .result-doc-id {
      font-family: monospace;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .result-doc-label {
      font-size: 12px;
      color: ${t.textMuted};
      margin-bottom: 4px;
    }

    .result-cdr {
      text-align: left;
      margin-top: 16px;
      padding: 12px;
      background: ${t.bgMuted};
      border-radius: 6px;
      font-size: 12px;
    }

    .result-cdr-title {
      font-weight: 600;
      margin-bottom: 6px;
    }

    .result-actions {
      margin-top: 20px;
    }

    /* --- Spinner --- */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid ${t.primaryText};
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    /* --- Separator --- */
    .separator {
      border: none;
      border-top: 1px solid ${t.border};
      margin: 16px 0;
    }
  `
}
