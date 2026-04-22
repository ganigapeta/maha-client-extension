/**
 * SchoolMasterComponents.jsx
 * ─────────────────────────────────────────────────────────────
 * Reusable UI sub-components for the School Master Form.
 * All components are purely presentational (no API calls, no state).
 *
 * Exports:
 *   FormField       – Labelled field wrapper with error display
 *   TDDInput        – Styled text input
 *   TDDSelect       – Styled select with loading state
 *   TDDButton       – Styled button (save / reset / back variants)
 *   Spinner         – Inline loading spinner
 *   Toast           – Floating notification
 *   SectionLabel    – Sub-section title
 *   CaptchaWidget   – Arithmetic captcha with refresh
 *   PageHeader      – Government header bar
 *   MockDataBadge   – Visible badge when mock mode is active
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { formStyles, buttonStyles, feedbackStyles, headerStyles, layoutStyles } from './SchoolMasterStyles';

// ─────────────────────────────────────────────
// FormField
// ─────────────────────────────────────────────
/**
 * Wrapper around a single form field: renders label + children + error.
 *
 * @param {object} props
 * @param {string}    props.label      – Field label text
 * @param {boolean}   props.required   – Show red asterisk
 * @param {string}    [props.error]    – Validation error message
 * @param {React.ReactNode} props.children
 */
export function FormField({ label, required, error, children }) {
  return (
    <div
      style={formStyles.field}
      className={error ? 'tdd-field-error' : ''}
    >
      <label style={formStyles.label}>
        {label}
        {required && <span style={formStyles.required}>*</span>}
      </label>
      {children}
      {error && (
        <span style={formStyles.errorMsg}>
          <span>⚠</span> {error}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// TDDInput
// ─────────────────────────────────────────────
/**
 * Styled text / email / tel input.
 *
 * @param {object} props          – All standard <input> props
 * @param {boolean} props.hasError – Apply error border style
 */
export const TDDInput = React.forwardRef(function TDDInput(
  { hasError, style, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className="tdd-input"
      style={{
        ...formStyles.input,
        ...(hasError
          ? {
              borderColor: 'var(--tdd-danger)',
              boxShadow: '0 0 0 2px rgba(192,57,43,0.12)',
            }
          : {}),
        ...(style || {}),
      }}
      {...props}
    />
  );
});

// ─────────────────────────────────────────────
// TDDSelect
// ─────────────────────────────────────────────
/**
 * Styled <select> element with loading and disabled states.
 *
 * @param {object}  props
 * @param {boolean} props.hasError  – Apply error border
 * @param {boolean} props.loading   – Show loading placeholder
 * @param {string}  props.loadingText – Placeholder text while loading
 * @param {string}  props.emptyText   – Placeholder when no options
 * @param {Array}   props.options   – [{ id, name }]
 * @param {string}  props.value
 * @param {function} props.onChange
 */
export function TDDSelect({
  hasError,
  loading,
  loadingText = 'Loading...',
  emptyText = '---Select---',
  options = [],
  disabled,
  style,
  children,
  ...props
}) {
  return (
    <select
      className="tdd-select"
      style={{
        ...formStyles.select,
        ...(hasError
          ? { borderColor: 'var(--tdd-danger)' }
          : {}),
        ...(loading || disabled ? { opacity: 0.7 } : {}),
        ...(style || {}),
      }}
      disabled={loading || disabled}
      {...props}
    >
      <option value="">
        {loading ? loadingText : emptyText}
      </option>
      {!loading &&
        options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name || ''}
          </option>
        ))}
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────
// TDDButton
// ─────────────────────────────────────────────
/**
 * Styled action button. Variants: 'save' | 'reset' | 'back'
 *
 * @param {object}   props
 * @param {'save'|'reset'|'back'} props.variant
 * @param {boolean}  props.loading   – Show spinner
 * @param {string}   props.loadingText
 */
export function TDDButton({
  variant = 'save',
  loading = false,
  loadingText = 'Saving...',
  children,
  disabled,
  style,
  ...props
}) {
  const variantStyle = buttonStyles[variant] || buttonStyles.save;
  return (
    <button
      // className="tdd-btn"
      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"

      type="button"
      // style={{ ...variantStyle, ...(style || {}) }}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          {loadingText}
          <Spinner />
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────
/**
 * Small inline spinning circle.
 * Used inside buttons and loading states.
 */
export function Spinner({ size = 13, color = 'rgba(255,255,255,0.85)' }) {
  return (
    <span
      style={{
        ...buttonStyles.spinner,
        width: size,
        height: size,
        borderColor: `rgba(255,255,255,0.3)`,
        borderTopColor: color,
      }}
    />
  );
}

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
/**
 * Fixed-position floating notification.
 *
 * @param {object}  props
 * @param {string}  props.message
 * @param {'success'|'error'} props.type
 * @param {boolean} props.visible
 */
export function Toast({ message, type = 'success', visible }) {
  if (!visible) return null;
  const icon = type === 'success' ? '✅' : '❌';
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        ...feedbackStyles.toast,
        ...(type === 'success'
          ? feedbackStyles.toastSuccess
          : feedbackStyles.toastError),
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// SectionLabel
// ─────────────────────────────────────────────
/**
 * Small uppercase section sub-heading with gold underline.
 */
export function SectionLabel({ children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={layoutStyles.sectionLabel}>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// CaptchaWidget
// ─────────────────────────────────────────────
/**
 * Arithmetic captcha with refresh button.
 *
 * @param {object}   props
 * @param {string}   props.question    – e.g. "4 + 7 = ?"
 * @param {string}   props.value       – Current answer input value
 * @param {function} props.onChange    – onChange handler for input
 * @param {function} props.onRefresh   – Click handler for refresh
 * @param {string}   [props.error]     – Validation error
 */
export function CaptchaWidget({ question, value, onChange, onRefresh, error }) {
  return (
    <div style={layoutStyles.captchaRow}>
      <span style={formStyles.captchaLabel}>
        Captcha :&nbsp;
        <span style={formStyles.captchaQuestion}>{question}</span>
      </span>

      <button
        type="button"
        style={formStyles.refreshBtn}
        onClick={onRefresh}
        title="Refresh Captcha"
        aria-label="Generate new captcha"
      >
        🔄
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TDDInput
          name="captchaAnswer"
          value={value}
          onChange={onChange}
          hasError={!!error}
          style={formStyles.captchaInput}
          placeholder="Enter answer"
          maxLength={4}
          inputMode="numeric"
          aria-label="Captcha answer"
        />
        {error && (
          <span style={formStyles.errorMsg}>
            <span>⚠</span> {error}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PageHeader
// ─────────────────────────────────────────────
/**
 * Maharashtra Government top header bar.
 * Renders left emblem, title block, and right seal.
 */
export function PageHeader() {
  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.left}>
        {/* Left Emblem – replace src with real image in production */}
        <div
          style={headerStyles.emblemWrapper}
          role="img"
          aria-label="Tribal Development Department Logo"
        >
          🏫
        </div>
        <div style={headerStyles.titleBlock}>
          <h1 style={headerStyles.titleMain}>
            Tribal Development Department
          </h1>
          <p style={headerStyles.titleSub}>
            Initiative DFT to Namankit School
          </p>
        </div>
      </div>

      {/* Right Government Seal */}
      <div
        style={headerStyles.rightEmblem}
        role="img"
        aria-label="Maharashtra Government Seal"
      >
        🔱
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// MockDataBadge
// ─────────────────────────────────────────────
/**
 * Visible pill shown in the section header when useMockData is true.
 * Helps developers distinguish mock vs real API mode at a glance.
 */
export function MockDataBadge() {
  return (
    <span style={layoutStyles.mockBadge} title="API calls are mocked">
      ⚠ MOCK DATA MODE
    </span>
  );
}

// ─────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────
/**
 * Horizontal rule between form sections.
 */
export function Divider() {
  return <div style={layoutStyles.divider} />;
}
