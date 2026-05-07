import React from 'react';

/**
 * Reusable Tab Container Component
 * @param {Object[]} tabs - Array of tab objects with {id, label, count}
 * @param {string} activeTab - Currently active tab id
 * @param {function} onTabChange - Callback when tab is clicked
 */
const TabContainer = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="mb-4">
      <nav className="nav-custom-tabs d-flex gap-4" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="btn btn-link text-decoration-none text-nowrap py-3 px-2"
              aria-current={isActive ? 'page' : undefined}
              style={{ borderRadius: 0 }}
            >
              <span className={`nav-item-text py-2 ${
                isActive
                  ? 'border-bottom border-2 border-0'
                  : 'border-0'
              }`}>
                {tab.label}
                {tab.count !== undefined && (
                <span className={`ms-2 badge rounded-pill ${
                  isActive
                    ? 'bg-primary bg-opacity-10 text-primary'
                    : 'bg-secondary bg-opacity-10 text-secondary'
                }`}>
                  {tab.count}
                </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabContainer;
