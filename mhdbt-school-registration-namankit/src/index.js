import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';  // ✅ This should work if App.tsx exists
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/App.css';

import { createRoot } from "react-dom/client";


class WebComponent extends HTMLElement {
  connectedCallback() {
    // Create a root for this custom element
    this._root = createRoot(this);
    this._root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }

  disconnectedCallback() {
    // Properly unmount the React tree
    if (this._root) {
      this._root.unmount();
    }
  }
}

const ELEMENT_NAME = "mhdbt-school-namankit-reg";

if (customElements.get(ELEMENT_NAME)) {
  console.log(`Skipping registration for <${ELEMENT_NAME}> (already registered)`);
} else {
  customElements.define(ELEMENT_NAME, WebComponent);
}
