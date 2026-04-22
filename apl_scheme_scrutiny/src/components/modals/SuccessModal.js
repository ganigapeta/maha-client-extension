import React from 'react';
import { Modal, Button } from 'react-bootstrap';

/**
 * SuccessModal Component
 * Displays a success message with a checkmark icon
 * 
 * @param {boolean} isOpen - Controls visibility of the modal
 * @param {string} title - Main title text (default: "Success!")
 * @param {string} message - Success message text
 * @param {Function} onClose - Callback function when OK button is clicked
 * @param {string} buttonText - Text for the action button (default: "OK")
 */
const SuccessModal = ({ 
  isOpen = false, 
  title = "Success!", 
  message = "Operation completed successfully.",
  onClose,
  buttonText = "OK"
}) => {
  return (
    <Modal 
      show={isOpen} 
      onHide={onClose}
      centered
      aria-labelledby="success-modal-title"
    >
      <Modal.Body className="p-4 text-center">
        {/* Success Icon */}
        <div className="d-flex justify-content-center mb-4">
          <div 
            className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center"
            style={{ width: '5rem', height: '5rem' }}
          >
            <svg 
              className="text-success" 
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
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h3 
          id="success-modal-title"
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
            onClick={onClose}
            className="fw-semibold px-4 py-2 shadow"
            style={{ 
              backgroundColor: '#002B70', 
              borderColor: '#002B70',
              minWidth: '120px'
            }}
          >
            {buttonText}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default SuccessModal;
