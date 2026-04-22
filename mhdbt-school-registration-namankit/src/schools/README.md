# School Master Form — Liferay React Portlet

**Tribal Development Department, Maharashtra Government**

---

## Folder Structure

```
SchoolMaster/
│
├── SchoolMasterForm.jsx                 ← Main component (entry point)
│
├── styles/
│   └── SchoolMasterStyles.js           ← All CSS variables, keyframes & JS style objects
│
├── api/
│   └── schoolMasterAPI.js              ← All Liferay REST API calls
│
├── data/
│   └── mockData.js                     ← Mock dropdown & form data
│
└── components/
    └── SchoolMasterComponents.jsx      ← Reusable UI components
```

---

## What Each File Does

| File | Responsibility |
|------|---------------|
| `SchoolMasterForm.jsx` | State, validation, useEffect hooks, layout composition |
| `styles/SchoolMasterStyles.js` | CSS variables, keyframes, all JS style objects |
| `api/schoolMasterAPI.js` | Liferay fetch wrapper + all 7 REST endpoints |
| `data/mockData.js` | Districts, Talukas, Villages, PO Names mock arrays |
| `components/SchoolMasterComponents.jsx` | FormField, TDDInput, TDDSelect, TDDButton, Toast, etc. |

---

## Usage

### Basic (Real Liferay APIs)
```jsx
import SchoolMasterForm from './SchoolMaster/SchoolMasterForm';

<SchoolMasterForm useMockData={false} />
```

### Mock Mode (Dev / Demo)
```jsx
<SchoolMasterForm useMockData={true} />
```

### With Custom Back Handler
```jsx
<SchoolMasterForm
  useMockData={false}
  onBack={() => Liferay.Portlet.navigate('/some-url')}
/>
```

---

## API Endpoints  (`/o/tribal-dev/v1.0/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/districts` | All districts |
| GET | `/talukas?districtId=X` | Talukas for a district |
| GET | `/villages?talukaId=X` | Villages for a taluka |
| GET | `/po-names` | Post office names |
| POST | `/schools` | Create school record |
| PUT | `/schools/:id` | Update school record |
| DELETE | `/schools/:id` | Delete school record |
| GET | `/schools/:id` | Fetch one school (edit mode) |
| GET | `/schools/check-udise?code=X` | Check UDISE uniqueness |

### Auth (auto-handled)
- **CSRF**: `window.Liferay.authToken` → `X-CSRF-Token` header
- **Session**: `credentials: 'include'`
- **Base URL**: `window.Liferay.ThemeDisplay.getPortalURL()`

---

## Mock Data Behaviour

```
useMockData={true}
  → All dropdowns load from mockData.js (no network calls)
  → Save simulates 800ms delay and returns mock ID
  → "⚠ MOCK DATA MODE" badge shown in section header

useMockData={false}
  → Real Liferay API calls made
  → On failure → empty arrays (no crash, no mock bleed)
  → Error toast shown to user
```

---

## Cascading Dropdowns

```
Mount          → load Districts + PO Names in parallel
District set   → clear Taluka + Village → load Talukas
Taluka set     → clear Village → load Villages
```

All cascade effects use cleanup flags (`cancelled = true`) to prevent
state updates on unmounted components.

---

## Validation Rules

| Field | Rule |
|-------|------|
| School Name | Required |
| Address | Required |
| District | Required |
| Taluka | Required (depends on District) |
| Village | Required (depends on Taluka) |
| PO Name | Required |
| Mobile (School) | Required · 10 digits · starts with 6–9 |
| Mobile (Trustee) | Optional · 10 digits if provided |
| Mobile (Principal) | Optional · 10 digits if provided |
| Email ID | Required · valid email format |
| Primary UDISE | Required · exactly 11 digits |
| Secondary UDISE | Optional · 11 digits if provided |
| Higher Secondary UDISE | Optional · 11 digits if provided |
| Pincode | Optional · 6 digits if provided |
| Captcha | Required · must match arithmetic answer |

---

## Adding to Liferay Portlet

```js
// index.js (portlet entry point)
import React from 'react';
import ReactDOM from 'react-dom';
import SchoolMasterForm from './SchoolMaster/SchoolMasterForm';

export default function main({ portletElementId }) {
  ReactDOM.render(
    <SchoolMasterForm useMockData={false} />,
    document.getElementById(portletElementId)
  );
}
```

---

## Replacing Emoji Emblems with Real Images

In `SchoolMasterComponents.jsx`, find `PageHeader` and replace:
```jsx
// Before
<div style={headerStyles.emblemWrapper}>🏫</div>

// After
<img
  src={`${Liferay.ThemeDisplay.getPathContext()}/o/your-theme/images/tdd-logo.png`}
  alt="Tribal Development Department"
  style={{ width: 64, height: 64, objectFit: 'contain' }}
/>
```

---

## Dependencies

- React 16.8+ (hooks)
- No external UI libraries
- No external CSS frameworks
- Compatible with Liferay DXP 7.3 / 7.4
