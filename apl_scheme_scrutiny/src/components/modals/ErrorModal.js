import React from 'react';
import { Modal, Button } from 'react-bootstrap';

/**
 * ErrorModal Component
 * Displays an error message with an error icon
 * 
 * @param {boolean} isOpen - Controls visibility of the modal
 * @param {string} title - Main title text (default: "Error!")
 * @param {string} message - Error message text
 * @param {Function} onClose - Callback function when Close button is clicked
 * @param {string} buttonText - Text for the action button (default: "Close")
 */
const ErrorModal = ({ 
  isOpen = false, 
  title = "Error!", 
  message = "An error occurred. Please try again.",
  onClose,
  buttonText = "Close"
}) => {
  return (
    <Modal 
      show={isOpen} 
      onHide={onClose}
      centered
      aria-labelledby="error-modal-title"
    >
      <Modal.Body className="p-4 text-center">
        {/* Error Icon */}
        <div className="d-flex justify-content-center mb-4">
          <div 
            className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
            style={{ width: '5rem', height: '5rem' }}
          >
            <svg 
              className="text-danger" 
              width="48"
              height="48"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h3 
          id="error-modal-title"
          className="h4 fw-bold text-dark mb-3"
        >
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-secondary mb-4">
          {message}
        </p>
        
        {/* Action Button */}
        <div className="d-flex justify-content-center">
          <Button
            variant="danger"
            onClick={onClose}
            className="fw-semibold px-4 py-2 shadow"
            style={{ minWidth: '120px' }}
          >
            {buttonText}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ErrorModal;
