/**
 * SchoolMasterStyles.js
 * ─────────────────────────────────────────────────────────────
 * All visual styles for the School Master Registration Form.
 * Tribal Development Department – Maharashtra Government
 *
 * Design system:
 *   Primary    : #1a3d6e  (deep government navy)
 *   Accent     : #b8860b  (Maharashtra gold)
 *   Danger     : #8b0000  (deep crimson)
 *   Success    : #1a6b3a
 *   Surface    : #f5f7fa
 *   Card       : #ffffff
 *   Font       : 'Noto Sans', sans-serif (supports Devanagari)
 * ─────────────────────────────────────────────────────────────
 */

// ─── CSS Variables injected as a <style> block ───────────────
export const CSS_VARIABLES = `
  :root {
    --tdd-navy:       #033984;
    --tdd-navy-dark:  #0f2547;
    --tdd-navy-light: #2c5aa0;
    --tdd-gold:       #b8860b;
    --tdd-gold-light: #d4a017;
    --tdd-crimson:    #8b0000;
    --tdd-success:    #1a6b3a;
    --tdd-danger:     #c0392b;
    --tdd-warning:    #e67e22;
    --tdd-surface:    #f5f7fa;
    --tdd-border:     #cbd5e1;
    --tdd-text:       #1e293b;
    --tdd-muted:      #64748b;
    --tdd-white:      #ffffff;
    --tdd-shadow-sm:  0 1px 3px rgba(0,0,0,0.10);
    --tdd-shadow-md:  0 4px 16px rgba(0,0,0,0.12);
    --tdd-shadow-lg:  0 8px 32px rgba(0,0,0,0.16);
    --tdd-radius:     4px;
    --tdd-radius-lg:  8px;
    --tdd-transition: 0.2s ease;
  }
`;

// ─── Global animation keyframes ──────────────────────────────
export const KEYFRAMES = `
  @keyframes tdd-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes tdd-fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tdd-slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tdd-toastIn {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* Global resets scoped to portlet */
  .tdd-portlet *, .tdd-portlet *::before, .tdd-portlet *::after {
    box-sizing: border-box;
  }
  .tdd-portlet {
    font-family: 'Noto Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    color: var(--tdd-text);
    -webkit-font-smoothing: antialiased;
  }

  /* Input & Select shared hover/focus states */
  .tdd-input, .tdd-select {
    transition: border-color var(--tdd-transition), box-shadow var(--tdd-transition);
  }
  .tdd-input:hover:not(:disabled),
  .tdd-select:hover:not(:disabled) {
    border-color: var(--tdd-navy-light);
  }
  .tdd-input:focus, .tdd-select:focus {
    outline: none;
    border-color: var(--tdd-navy) !important;
    box-shadow: 0 0 0 3px rgba(26, 61, 110, 0.15) !important;
  }
  .tdd-input:disabled, .tdd-select:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
    opacity: 0.7;
  }

  /* Button states */
  .tdd-btn {
    transition: transform 0.1s ease, opacity 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
  }
  .tdd-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    opacity: 0.92;
  }
  .tdd-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .tdd-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Form card animation */
  .tdd-card {
    animation: tdd-fadeIn 0.35s ease both;
  }

  /* Field error shake */
  @keyframes tdd-shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-4px); }
    40%       { transform: translateX(4px); }
    60%       { transform: translateX(-3px); }
    80%       { transform: translateX(3px); }
  }
  .tdd-field-error .tdd-input,
  .tdd-field-error .tdd-select {
    animation: tdd-shake 0.35s ease;
  }

  /* Section header gradient line */
  .tdd-section-bar::after {
    content: '';
    display: block;
    height: 3px;
    background: linear-gradient(90deg, var(--tdd-gold) 0%, transparent 100%);
  }

  /* Responsive grid collapse */
  @media (max-width: 900px) {
    .tdd-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 600px) {
    .tdd-grid-3 { grid-template-columns: 1fr !important; }
    .tdd-action-row { justify-content: stretch !important; }
    .tdd-action-row .tdd-btn { flex: 1; }
  }
`;

// ─── JS Style Objects ─────────────────────────────────────────

export const pageStyles = {
  wrapper: {
    minHeight: '100vh',
    background: 'var(--tdd-surface)',
    fontFamily: "'Noto Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
};

export const headerStyles = {
  header: {
    background: 'var(--tdd-white)',
    borderBottom: '3px solid var(--tdd-gold)',
    padding: '12px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: 'var(--tdd-shadow-md)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  emblemWrapper: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: '3px solid var(--tdd-crimson)',
    background: 'radial-gradient(circle at 35% 35%, #fff8e1 0%, #ffd700 60%, #b8860b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    boxShadow: '0 3px 12px rgba(139,0,0,0.25), inset 0 1px 3px rgba(255,255,255,0.6)',
    flexShrink: 0,
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  titleMain: {
    color: 'var(--tdd-crimson)',
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: '0.3px',
    lineHeight: 1.15,
    margin: 0,
    textShadow: '0 1px 2px rgba(139,0,0,0.08)',
  },
  titleSub: {
    color: 'var(--tdd-muted)',
    fontSize: 12.5,
    margin: 0,
    letterSpacing: '0.4px',
  },
  rightEmblem: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 40% 40%, #fff8e1 0%, #ffd700 60%, #b8860b 100%)',
    border: '3px solid var(--tdd-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    boxShadow: '0 3px 12px rgba(184,134,11,0.25)',
    flexShrink: 0,
  },
};

export const layoutStyles = {
  main: {
    padding: '32px 20px 60px',
    minHeight: 'calc(100vh - 99px)',
  },
  card: {
    maxWidth: 1120,
    margin: '0 auto',
    background: 'var(--tdd-white)',
    borderRadius: 'var(--tdd-radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--tdd-shadow-lg)',
    border: '1px solid var(--tdd-border)',
  },
  sectionBar: {
    background: 'linear-gradient(90deg, var(--tdd-navy) 0%, var(--tdd-navy-light) 100%)',
    color: 'var(--tdd-white)',
    padding: '13px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.4px',
    borderBottom: '3px solid var(--tdd-gold)',
  },
  mockBadge: {
    marginLeft: 'auto',
    background: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffc107',
    borderRadius: 3,
    padding: '2px 10px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.8px',
  },
  formBody: {
    padding: '28px 28px 12px',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    color: 'var(--tdd-navy)',
    borderBottom: '2px solid var(--tdd-gold)',
    paddingBottom: 5,
    marginBottom: 16,
    display: 'inline-block',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px 24px',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, var(--tdd-border) 0%, transparent 100%)',
    margin: '4px 0 20px',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '16px 28px 24px',
    borderTop: '1px solid var(--tdd-border)',
    background: '#fafbfc',
    flexWrap: 'wrap',
  },
  captchaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 0 4px',
    borderTop: '1px solid var(--tdd-border)',
    marginTop: 8,
    flexWrap: 'wrap',
  },
};

export const formStyles = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: 700,
    color: 'var(--tdd-text)',
    letterSpacing: '0.2px',
    userSelect: 'none',
  },
  required: {
    color: 'var(--tdd-danger)',
    marginLeft: 2,
  },
  input: {
    height: 36,
    border: '1.5px solid var(--tdd-border)',
    borderRadius: 'var(--tdd-radius)',
    padding: '0 10px',
    fontSize: 13,
    color: 'var(--tdd-text)',
    background: 'var(--tdd-white)',
    width: '100%',
  },
  inputError: {
    borderColor: 'var(--tdd-danger) !important',
    boxShadow: '0 0 0 2px rgba(192,57,43,0.12) !important',
  },
  select: {
    height: 36,
    border: '1.5px solid var(--tdd-border)',
    borderRadius: 'var(--tdd-radius)',
    padding: '0 30px 0 10px',
    fontSize: 13,
    color: 'var(--tdd-text)',
    background: `var(--tdd-white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23475569' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 10px center`,
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  errorMsg: {
    fontSize: 11,
    color: 'var(--tdd-danger)',
    marginTop: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  captchaLabel: {
    fontSize: 13.5,
    fontWeight: 700,
    color: 'var(--tdd-text)',
    letterSpacing: '0.3px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  captchaQuestion: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 3,
    color: 'var(--tdd-navy)',
    background: '#eef3fb',
    border: '1.5px solid var(--tdd-border)',
    borderRadius: 'var(--tdd-radius)',
    padding: '4px 14px',
    fontVariantNumeric: 'tabular-nums',
  },
  captchaInput: {
    height: 36,
    width: 140,
    border: '1.5px solid var(--tdd-border)',
    borderRadius: 'var(--tdd-radius)',
    padding: '0 10px',
    fontSize: 14,
    fontWeight: 600,
  },
  refreshBtn: {
    background: 'none',
    border: '1.5px solid var(--tdd-border)',
    borderRadius: 'var(--tdd-radius)',
    cursor: 'pointer',
    color: 'var(--tdd-navy)',
    fontSize: 16,
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background var(--tdd-transition)',
    lineHeight: 1,
  },
};

export const buttonStyles = {
  save: {
    background: 'linear-gradient(135deg, #22863a 0%, #176d31 100%)',
    color: 'var(--tdd-white)',
    border: 'none',
    borderRadius: 'var(--tdd-radius)',
    padding: '9px 32px',
    fontSize: 13.5,
    fontWeight: 700,
    letterSpacing: '0.4px',
    boxShadow: '0 2px 8px rgba(22,101,52,0.35)',
    minWidth: 90,
  },
  reset: {
    background: 'linear-gradient(135deg, #e67e22 0%, #c96e1a 100%)',
    color: 'var(--tdd-white)',
    border: 'none',
    borderRadius: 'var(--tdd-radius)',
    padding: '9px 32px',
    fontSize: 13.5,
    fontWeight: 700,
    letterSpacing: '0.4px',
    boxShadow: '0 2px 8px rgba(230,126,34,0.35)',
    minWidth: 90,
  },
  back: {
    background: 'linear-gradient(135deg, #2980b9 0%, #1f618d 100%)',
    color: 'var(--tdd-white)',
    border: 'none',
    borderRadius: 'var(--tdd-radius)',
    padding: '9px 32px',
    fontSize: 13.5,
    fontWeight: 700,
    letterSpacing: '0.4px',
    boxShadow: '0 2px 8px rgba(41,128,185,0.35)',
    minWidth: 90,
  },
  spinner: {
    display: 'inline-block',
    width: 13,
    height: 13,
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'tdd-spin 0.7s linear infinite',
    marginLeft: 7,
    verticalAlign: 'middle',
  },
};

export const feedbackStyles = {
  toast: {
    position: 'fixed',
    bottom: 28,
    right: 28,
    padding: '13px 22px',
    borderRadius: 6,
    fontSize: 13.5,
    fontWeight: 600,
    color: 'var(--tdd-white)',
    zIndex: 9999,
    boxShadow: '0 6px 24px rgba(0,0,0,0.20)',
    animation: 'tdd-toastIn 0.3s ease both',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    minWidth: 260,
    maxWidth: 380,
  },
  toastSuccess: {
    background: 'linear-gradient(135deg, #1a6b3a 0%, #155a30 100%)',
    borderLeft: '4px solid #6ee7b7',
  },
  toastError: {
    background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
    borderLeft: '4px solid #fca5a5',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(245,247,250,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 'var(--tdd-radius-lg)',
    backdropFilter: 'blur(2px)',
  },
  loadingText: {
    color: 'var(--tdd-navy)',
    fontSize: 13,
    fontWeight: 600,
    marginLeft: 10,
  },
};
