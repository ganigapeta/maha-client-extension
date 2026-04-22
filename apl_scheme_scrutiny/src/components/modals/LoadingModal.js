import React from 'react';
import { Modal } from 'react-bootstrap';

/**
 * LoadingModal Component
 * Displays a loading spinner with a message while API operations are in progress
 * 
 * @param {boolean} isOpen - Controls visibility of the modal
 * @param {string} title - Main title text (default: "Processing...")
 * @param {string} subtitle - Subtitle text (default: "Please wait while we complete your request.")
 */
const LoadingModal = ({ 
  isOpen = false, 
  title = "Processing...", 
  subtitle = "Please wait while we complete your request." 
}) => {
  return (
    <Modal 
      show={isOpen} 
      centered 
      backdrop="static" 
      keyboard={false}
      aria-live="polite"
      aria-busy="true"
    >
      <Modal.Body className="p-4 text-center">
        {/* Spinner */}
        <div className="d-flex justify-content-center mb-4">
          <div 
            className="spinner-border" 
            role="status"
            style={{ 
              width: '4rem', 
              height: '4rem',
              borderWidth: '0.3rem',
              color: '#002B70'
            }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        
        {/* Title */}
        <h3 className="h5 fw-bold text-dark mb-2">
          {title}
        </h3>
        
        {/* Subtitle */}
        <p className="small text-secondary mb-0">
          {subtitle}
        </p>
      </Modal.Body>
    </Modal>
  );
};

export default LoadingModal;
