import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

/**
 * RemarksModal Component
 * Displays a modal to collect remarks/comments from the user
 * 
 * @param {boolean} isOpen - Controls visibility of the modal
 * @param {string} title - Main title text (default: "Enter Remarks")
 * @param {string} placeholder - Placeholder text for textarea
 * @param {Function} onSubmit - Callback with remarks when Submit is clicked
 * @param {Function} onCancel - Callback when Cancel button is clicked
 * @param {string} submitButtonText - Text for submit button (default: "Submit")
 * @param {string} cancelButtonText - Text for cancel button (default: "Cancel")
 */
const RemarksModal = ({ 
  isOpen = false, 
  title = "Enter Remarks", 
  placeholder = "Enter your remarks here...",
  onSubmit,
  onCancel,
  submitButtonText = "Submit",
  cancelButtonText = "Cancel"
}) => {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Validate remarks
    if (!remarks.trim()) {
      setError('Remarks are required');
      return;
    }

    // Clear error and call onSubmit
    setError('');
    onSubmit(remarks.trim());
    setRemarks(''); // Reset for next use
  };

  const handleCancel = () => {
    setRemarks('');
    setError('');
    onCancel();
  };

  const handleRemarksChange = (e) => {
    setRemarks(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <Modal 
      show={isOpen} 
      onHide={handleCancel}
      centered
      aria-labelledby="remarks-modal-title"
    >
      <Modal.Body className="p-4 text-center">
        {/* Icon */}
        <div className="d-flex justify-content-center mb-4">
          <div 
            className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center"
            style={{ width: '5rem', height: '5rem' }}
          >
            <svg 
              className="text-warning" 
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
              />
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h3 
          id="remarks-modal-title"
          className="h4 fw-bold text-dark mb-4"
        >
          {title}
        </h3>
        
        {/* Textarea */}
        <Form.Group className="mb-2 text-start">
          <Form.Control
            as="textarea"
            value={remarks}
            onChange={handleRemarksChange}
            placeholder={placeholder}
            rows={4}
            isInvalid={!!error}
            style={{ resize: 'none' }}
          />
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        </Form.Group>
        
        {/* Action Buttons */}
        <div className="d-flex justify-content-center gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={handleCancel}
            className="fw-semibold px-4 py-2 shadow"
            style={{ minWidth: '100px' }}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant="warning"
            onClick={handleSubmit}
            className="fw-semibold px-4 py-2 shadow"
            style={{ minWidth: '100px' }}
          >
            {submitButtonText}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default RemarksModal;
