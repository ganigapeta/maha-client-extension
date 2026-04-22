/**
 * SchoolMasterReviewStep.jsx
 * ─────────────────────────────────────────────────────────────
 * Review step for School Master Registration.
 * Tribal Development Department – Maharashtra Government.
 *
 * Displays all entered school details in a two-column table,
 * a declaration checkbox, and Back / Save action buttons.
 * Matches the TDD design system used across the portal.
 *
 * Props:
 *   reviewData             {object}   – Human-readable field values (labels, not IDs)
 *   isSubmitting           {boolean}  – True while save API call is in progress
 *   isDeclarationAccepted  {boolean}  – Controlled state of the declaration checkbox
 *   onToggleDeclaration    {function} – Called with (boolean) when checkbox changes
 *   onBack                 {function} – Go back to the form step
 *   onSubmit               {function} – Trigger the final save
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { layoutStyles } from './SchoolMasterStyles';

// ─── Review row definitions ──────────────────────────────────

function buildReviewRows(d) {
  return [
    // ── Basic Information
    { section: 'Basic Information' },
    { label: 'Trustee Name',             value: d.trusteeName },
    { label: 'School Name',              value: d.schoolName },
    { label: 'Address',                  value: d.address },

    // ── Location
    { section: 'Location' },
    { label: 'State',                    value: d.state },
    { label: 'District',                 value: d.district },
    { label: 'Taluka',                   value: d.taluka },
    { label: 'Village',                  value: d.village },
    { label: 'Pincode',                  value: d.pincode },
    { label: 'PO Name',                  value: d.poName },

    // ── Contact Details
    { section: 'Contact Details' },
    { label: 'Mobile No (School)',        value: d.mobileSchool },
    { label: 'Mobile No (Trustee)',       value: d.mobileTrustee },
    { label: 'Mobile No (Principal)',     value: d.mobilePrincipal },
    { label: 'Email ID',                 value: d.emailId },

    // ── UDISE Codes
    { section: 'UDISE Codes' },
    { label: 'Primary UDISE Code',       value: d.primaryUDISE },
    { label: 'Secondary UDISE Code',     value: d.secondaryUDISE },
    { label: 'Higher Secondary UDISE',   value: d.higherSecondaryUDISE },
  ];
}

// ─── Inline styles ───────────────────────────────────────────

const styles = {
  card: {
    ...layoutStyles.card,
  },
  sectionBar: {
    ...layoutStyles.sectionBar,
  },
  body: {
    padding: '24px 28px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--tdd-text-secondary, #6b7280)',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  sectionRow: {
    backgroundColor: 'var(--tdd-section-bg, #f0f4f8)',
  },
  sectionCell: {
    padding: '8px 14px',
    fontWeight: '600',
    fontSize: '12px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'var(--tdd-primary, #1a56db)',
    borderBottom: '1px solid var(--tdd-border, #e5e7eb)',
    colSpan: 2,
  },
  labelCell: {
    padding: '10px 14px',
    fontWeight: '500',
    color: 'var(--tdd-text-secondary, #374151)',
    borderBottom: '1px solid var(--tdd-border, #e5e7eb)',
    width: '40%',
    verticalAlign: 'top',
  },
  valueCell: {
    padding: '10px 14px',
    color: 'var(--tdd-text-primary, #111827)',
    borderBottom: '1px solid var(--tdd-border, #e5e7eb)',
    wordBreak: 'break-word',
  },
  emptyValue: {
    color: 'var(--tdd-text-muted, #9ca3af)',
    fontStyle: 'italic',
  },
  declarationBox: {
    marginTop: '24px',
    padding: '16px 18px',
    borderRadius: '8px',
    border: '1px solid var(--tdd-border, #e5e7eb)',
    backgroundColor: 'var(--tdd-bg-subtle, #f9fafb)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  checkbox: {
    marginTop: '2px',
    width: '16px',
    height: '16px',
    flexShrink: 0,
    cursor: 'pointer',
    accentColor: 'var(--tdd-primary, #1a56db)',
  },
  declarationLabel: {
    fontSize: '14px',
    color: 'var(--tdd-text-primary, #111827)',
    cursor: 'pointer',
    lineHeight: '1.5',
  },
  actionRow: {
    ...layoutStyles.actionRow,
  },
  overlayBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayPopup: {
    background: '#fff',
    borderRadius: '12px',
    padding: '36px 40px',
    textAlign: 'center',
    minWidth: '260px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  overlayTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '16px 0 8px',
    color: '#111827',
  },
  overlaySubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  spinnerWrap: {
    display: 'flex',
    justifyContent: 'center',
  },
  // Button styles mirroring TDDButton variants
  btnSave: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 22px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    background: 'var(--tdd-primary, #1a56db)',
    color: '#fff',
    opacity: 1,
    transition: 'opacity 0.15s',
  },
  btnSaveDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
  btnBack: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 22px',
    borderRadius: '6px',
    border: '1px solid var(--tdd-border, #d1d5db)',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--tdd-text-primary, #374151)',
  },
};

// ─── Component ───────────────────────────────────────────────

export default function SchoolMasterReviewStep({
  reviewData,
  isSubmitting,
  isDeclarationAccepted,
  onToggleDeclaration,
  onBack,
  onSubmit,
}) {
  console.log('Review Data:', reviewData, isSubmitting, isDeclarationAccepted); // Debug log to verify data structure
  const rows = buildReviewRows(reviewData);

  const saveDisabled = isSubmitting || !isDeclarationAccepted;

  return (
    <>
      <div className="tdd-card" style={styles.card}>

        {/* ── Header bar */}
        <div className="tdd-section-bar" style={styles.sectionBar}>
          <span>🔍</span>
          <span>Review School Details</span>
        </div>

        {/* ── Body */}
        <div style={styles.body}>
          <p style={styles.subtitle}>
            Please review all information carefully before saving.
            You can go back to edit any details.
          </p>

          {/* ── Review table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <tbody>
                {rows.map((row, idx) => {
                  // Section heading row
                  if (row.section) {
                    return (
                      <tr key={`section-${idx}`} style={styles.sectionRow}>
                        <td colSpan={2} style={styles.sectionCell}>
                          {row.section}
                        </td>
                      </tr>
                    );
                  }

                  // Data row
                  const isEmpty = !row.value || String(row.value).trim() === '';
                  return (
                    <tr key={row.label}>
                      <td style={styles.labelCell}>{row.label}</td>
                      <td style={styles.valueCell}>
                        {isEmpty
                          ? <span style={styles.emptyValue}>—</span>
                          : String(row.value)
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Declaration checkbox */}
          <div style={styles.declarationBox}>
            <input
              id="tdd-declaration"
              type="checkbox"
              style={styles.checkbox}
              checked={isDeclarationAccepted}
              onChange={(e) => onToggleDeclaration(e.target.checked)}
              disabled={isSubmitting}
            />
            <label htmlFor="tdd-declaration" style={styles.declarationLabel}>
              I hereby confirm that the above school details are correct and accurate.
              I understand that providing false information may lead to rejection or cancellation
              of the registration.
            </label>
          </div>
        </div>

        {/* ── Action buttons */}
        <div className="tdd-action-row" style={styles.actionRow}>
          <button
            type="button"
            style={{
              ...styles.btnSave,
              ...(saveDisabled ? styles.btnSaveDisabled : {}),
            }}
            onClick={onSubmit}
            disabled={saveDisabled}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'tdd-spin 0.7s linear infinite',
                  }}
                />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </button>

          <button
            type="button"
            style={styles.btnBack}
            onClick={onBack}
            disabled={isSubmitting}
          >
            ← Back to Edit
          </button>
        </div>

      </div>

      {/* ── Full-screen saving overlay */}
      {isSubmitting && (
        <div style={styles.overlayBackdrop} role="status" aria-live="polite" aria-busy="true">
          <div style={styles.overlayPopup}>
            <div style={styles.spinnerWrap}>
              <span
                style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e7eb',
                  borderTopColor: 'var(--tdd-primary, #1a56db)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'tdd-spin 0.7s linear infinite',
                }}
              />
            </div>
            <p style={styles.overlayTitle}>Saving School Details</p>
            <p style={styles.overlaySubtitle}>Please wait while we complete your registration.</p>
          </div>
        </div>
      )}
    </>
  );
}
