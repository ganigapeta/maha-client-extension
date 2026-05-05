import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

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

const ELEMENT_NAME = "mahadbt-disbursement-payment-apl";

if (customElements.get(ELEMENT_NAME)) {
  console.log(`Skipping registration for <${ELEMENT_NAME}> (already registered)`);
} else {
  customElements.define(ELEMENT_NAME, WebComponent);
}
