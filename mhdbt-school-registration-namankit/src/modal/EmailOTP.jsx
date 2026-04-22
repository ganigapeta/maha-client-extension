import React, { useState, useEffect } from 'react';
import { sendEmailOTP, verifyEmailOTP } from "../api/verify-otp"; // Import both functions

function EmailOTP({ data, setEmailVerification }) {
  const displayEmail = data?.displayEmail || data?.email || "";
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [showModal, setShowModal] = useState(true);
  const [transactionId, setTransactionId] = useState(null);

  useEffect(() => {
    sendInitialOTP();
  }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendInitialOTP = async () => {
    if (!data?.email) {
      setError('Email address is required');
      return;
    }

    setIsSendingOTP(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await sendEmailOTP(data.email);
      
      console.log("Send OTP Response:", response); // Debug log
      
      // Check if response is valid and statusCode is 200
      if (response && (response.statusCode === 200 || response.statusCode === '200')) {
        setSuccessMessage(`OTP sent successfully to ${displayEmail}`);
        setTransactionId(response.id || null);
        setResendTimer(60);
      } else {
        // Handle different error cases
        if (response.message) {
          console.log("Send OTP Error:", response.message);
          setError('Failed to send OTP. Please try again.');
        } else if (response.statusCode && (response.statusCode !== 200 || response.statusCode !== '200')) {
          console.log("Send OTP Error Status Code:", response.statusCode);
          setError('Failed to send OTP. Please try again.');
        } else {
          setError('Failed to send OTP. Please try again.');
        }
      }
    } catch (err) {
      console.error("Error in sendInitialOTP:", err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      document.getElementById(`email-otp-input-${index + 1}`)?.focus();
    }
    
    setError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`email-otp-input-${index - 1}`)?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    
    // Check if we have transactionId (id from sendEmailOTP response)
    if (!transactionId) {
      setError('OTP session not found. Please resend OTP.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call the actual verification API
      const response = await verifyEmailOTP(data.email, transactionId, otpString);
      
      console.log("Verify OTP API Response:", response); // Debug log
      
      // Check response
      if (response && (response.statusCode === 200 || response.statusCode === '200')) {
        if (response.matched === true) {
          // OTP matched successfully
          setEmailVerification(prev => ({
            ...prev,
            show: false,
            verified: true,
            verifiedEmail: prev.email 
          }));
         
          // setVerifiedsField(prev=>({
          //   ...prev,
          //   emailid:false,
          //   emailidotp:true,
          // }))
          // setShowModal(false);
          
          // Optional: Show success message
          setSuccessMessage('Email verified successfully!');
          
          // Optional: Clear OTP fields
          setOtp(['', '', '', '', '', '']);
        } else {
          // OTP didn't match
          if (response.otpExpired === true) {
            setError('OTP has expired. Please request a new one.');
          } else {
            setError('Invalid OTP. Please try again.');
          }
          
          // Clear OTP fields on error
          setOtp(['', '', '', '', '', '']);
          document.getElementById('email-otp-input-0')?.focus();
        }
      } else {
        // Handle API errors
        if (response.message) {
          setError(response.message);
        } else if (response.error) {
          setError(response.error);
        } else {
          setError('Verification failed. Please try again.');
        }
      }
    } catch (err) {
      console.error("Error in verifyOtp:", err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsSendingOTP(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await sendEmailOTP(data.email);
      
      console.log("Resend OTP Response:", response); // Debug log
      
      if (response && (response.statusCode === 200 || response.statusCode === '200')) {
        setSuccessMessage(`New OTP sent to ${displayEmail}`);
        setOtp(['', '', '', '', '', '']);
        setResendTimer(60);
        setTransactionId(response.id || null);
        document.getElementById('email-otp-input-0')?.focus();
      } else {
        if (response.message) {
          console.log("Resend OTP Error:", response.message);
          setError('Failed to resend OTP. Please try again.');
        } else if (response.statusCode && response.statusCode !== 200) {
          console.log("Resend OTP Error Status Code:", response.statusCode);
          setError('Failed to resend OTP. Please try again.');
        } else {
          setError('Failed to resend OTP. Please try again.');
        }
      }
    } catch (err) {
      console.error("Error in resendOtp:", err, err.message);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const closePopup = () => {
    setShowModal(false);
    setEmailVerification(prev => ({
      ...prev,
      show: false
    }));
  };

  return showModal ? (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1" aria-modal="true" role="dialog">
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px", width: "100%" }}>
          <div className="modal-content shadow-lg border-0 rounded-2 overflow-hidden">
            <div className="modal-header text-white py-2 px-3" style={{
              background: "linear-gradient(135deg,#0d6efd,#6610f2)"
            }}>
              <h5 className="modal-title fw-bold mb-0 fs-6">
                <i className="bi bi-envelope-check me-1"></i>Email Verification
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={closePopup}
                disabled={isLoading || isSendingOTP}
                aria-label="Close"
                style={{ transform: 'scale(0.8)' }}
              />
            </div>

            <div className="modal-body p-3" style={{ background: "#f8f9fc" }}>
              <div className="text-center mb-2">
                <p className="text-muted mb-1 small">
                  Enter OTP sent to your email address
                </p>
              </div>

              <div className="mb-3 text-center">
                <div className="d-inline-block bg-white p-2 rounded-1 shadow-sm border">
                  <h6 className="fw-bold text-secondary text-uppercase mb-1 small" style={{ fontSize: '0.7rem' }}>EMAIL ADDRESS</h6>
                  <p className="mb-0 fw-bold text-gray-800" style={{ fontSize: '0.9rem' }}>{displayEmail}</p>
                </div>
              </div>

              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && transactionId && (
                <div className="mb-2 text-center">
                  <small className="text-muted">Transaction ID: {transactionId}</small>
                </div>
              )}

              {isSendingOTP && !successMessage && (
                <div className="mb-2 text-center">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Sending...</span>
                  </div>
                  <p className="mt-1 text-muted small">Sending OTP...</p>
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success py-1 px-2 mb-2 text-center small" role="alert">
                  <span>{successMessage}</span>
                </div>
              )}

              {!isSendingOTP && (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-semibold mb-1 small">6-digit OTP</label>
                    <div className="d-flex justify-content-center gap-1 mb-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`email-otp-input-${index}`}
                          type="text"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="form-control text-center"
                          style={{ 
                            width: '35px', 
                            height: '40px', 
                            fontSize: '1rem',
                            borderColor: error ? '#dc3545' : '#dee2e6',
                            padding: '0.25rem'
                          }}
                          disabled={isLoading || isSendingOTP}
                        />
                      ))}
                    </div>
                    
                    {error && (
                      <div className="alert alert-danger py-1 px-2 mb-2 text-center small" role="alert">
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Add session info display */}
                  {/* {transactionId && (
                    <div className="text-center mb-2">
                      <small className="text-muted">
                        Session ID: {transactionId.substring(0, 8)}...
                      </small>
                    </div>
                  )} */}
                </>
              )}

              {!isSendingOTP && (
                <div>
                  <button
                    onClick={verifyOtp}
                    disabled={isLoading || otp.join('').length !== 6 || isSendingOTP}
                    className={`btn w-100 rounded-1 mb-2 py-1 ${
                      isLoading || otp.join('').length !== 6 || isSendingOTP
                        ? 'btn-secondary'
                        : 'btn-primary'
                    }`}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>

                  <button
                    onClick={resendOtp}
                    disabled={isLoading || isSendingOTP || resendTimer > 0}
                    className={`btn w-100 rounded-1 py-1 ${
                      isLoading || isSendingOTP || resendTimer > 0
                        ? 'btn-outline-secondary'
                        : 'btn-outline-primary'
                    }`}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer border-0 p-2 bg-light">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-1 px-3 py-1"
                onClick={closePopup}
                disabled={isLoading || isSendingOTP}
                style={{ fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;
}

export default EmailOTP;
