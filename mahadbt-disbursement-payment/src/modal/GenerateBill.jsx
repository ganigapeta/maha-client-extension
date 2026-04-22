import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

function GenerateBill({ 
  showGenerateModal,
  setShowGenerateModal
}) {

  if (!showGenerateModal || !showGenerateModal.show) return null;

  const handleClose = () => {
    setShowGenerateModal({ show: false, isConform: false });
  };

  const handleProceedToGenerate = () => {
    setShowGenerateModal({ 
      show: false, 
      isConform: true 
    });

    console.log('User confirmed bill generation');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        style={{ zIndex: 1050 }} 
        tabIndex="-1"
        aria-modal="true"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '550px' }}>
          <div className="modal-content border-0 shadow-lg">

            {/* Header */}
            <div className="modal-header bg-danger text-white py-3 px-4 border-0">
              <div className="d-flex align-items-center w-100">
                <div className="d-flex align-items-center flex-grow-1">
                  {/* <AlertTriangle size={24} className="me-3" /> */}
                  <h5 className="modal-title fw-bold mb-0">
                    Generate Bill
                  </h5>
                </div>
                <button 
                  type="button" 
                  className="btn btn-link text-white p-0"
                  onClick={handleClose}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body p-4">

              {/* Center Message */}
              <div className="text-center mb-3">
                <p className="fw-bold fs-6 mb-0">
                  Your bill is ready to submit
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="modal-footer border-top pt-3 pb-4 px-4">
              <div className="w-100">

                {/* Buttons */}
                <div className="d-flex justify-content-between mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={handleClose}
                  >
                   
                    Close
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger px-4 d-flex align-items-center"
                    onClick={handleProceedToGenerate}
                  > 
                    Ok
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default GenerateBill;