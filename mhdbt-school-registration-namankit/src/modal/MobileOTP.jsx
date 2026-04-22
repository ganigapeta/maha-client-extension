// import React, { useState, useEffect } from 'react';
// import { sendMobileOTP, verifyMobileOTP } from "../api/verify-otp"; 

// function MobileOTP({ data, setMobileNumberVerification }) {
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSendingOTP, setIsSendingOTP] = useState(false);
//   const [error, setError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [resendTimer, setResendTimer] = useState(60);
//   const [showModal, setShowModal] = useState(true);
//   const [transactionId, setTransactionId] = useState(null);

//   useEffect(() => {
//     sendInitialOTP();
//   }, []);

//   useEffect(() => {
//     let interval;
//     if (resendTimer > 0) {
//       interval = setInterval(() => {
//         setResendTimer(prev => prev - 1);
//       }, 1000);
//     }
//     return () => clearInterval(interval);
//   }, [resendTimer]);

//   const sendInitialOTP = async () => {
//     if (!data?.mobileNumber) {
//       setError('Mobile number is required');
//       return;
//     }

//     setIsSendingOTP(true);
//     setError('');
//     setSuccessMessage('');

//     try {
//       const response = await sendMobileOTP(data.mobileNumber);

//       console.log("Send Mobile OTP Response:", response); // Debug log

//       // Check if response is valid and statusCode is 200
//       if (response && (response.statusCode === 200 || response.statusCode === '200')) {
//         setSuccessMessage(`OTP sent successfully to ${data.mobileNumber}`);
//         setTransactionId(response.id || null);
//         setResendTimer(60);
//       } else {
//         // Handle different error cases
//         if (response.message) {
//           console.log("Send Mobile OTP Error:", response.message);
//           setError('Failed to send OTP. Please try again.');
//         } else if (response.statusCode && (response.statusCode !== 200 || response.statusCode !== '200')) {
//           console.log("Send Mobile OTP Error Status Code:", response.statusCode);
//           setError('Failed to send OTP. Please try again.');
//         } else {
//           setError('Failed to send OTP. Please try again.');
//         }
//       }
//     } catch (err) {
//       console.error("Error in sendInitialOTP:", err);
//       setError(err.message || 'Failed to send OTP. Please try again.');
//     } finally {
//       setIsSendingOTP(false);
//     }
//   };

//   const handleOtpChange = (index, value) => {
//     if (!/^\d*$/.test(value)) return;

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);

//     if (value && index < 5) {
//       document.getElementById(`mobile-otp-input-${index + 1}`)?.focus();
//     }

//     setError('');
//   };

//   const handleKeyDown = (index, e) => {
//     if (e.key === 'Backspace' && !otp[index] && index > 0) {
//       document.getElementById(`mobile-otp-input-${index - 1}`)?.focus();
//     }
//   };

//   const verifyOtp = async () => {
//     const otpString = otp.join('');

//     if (otpString.length !== 6) {
//       setError('Please enter 6-digit OTP');
//       return;
//     }

//     // Check if we have transactionId (id from sendMobileOTP response)
//     if (!transactionId) {
//       setError('OTP session not found. Please resend OTP.');
//       return;
//     }

//     setIsLoading(true);
//     setError('');

//     try {
//       // For testing with 123456
//       if (otpString === '123456') {
//         // Simulate successful verification for testing
//         setTimeout(() => {
//           setMobileNumberVerification(prev => ({
//             ...prev,
//             show: false,
//             verified: true,
//             verifiedMobileNumber: prev.mobileNumber
//           }));
//           setSuccessMessage('Mobile number verified successfully!');
//           setOtp(['', '', '', '', '', '']);
//           setIsLoading(false);
//         }, 1000);
//         return;
//       }

//       // Call the actual verification API
//       const response = await verifyMobileOTP(data.mobileNumber, transactionId, otpString);

//       console.log("Verify Mobile OTP API Response:", response); // Debug log

//       // Check response
//       if (response && (response.statusCode === 200 || response.statusCode === '200')) {
//         if (response.matched === true) {
//           // OTP matched successfully
//           setMobileNumberVerification(prev => ({
//             ...prev,
//             show: false,
//             verified: true,
//             verifiedMobileNumber: prev.mobileNumber
//           }));

//           // Optional: Show success message
//           setSuccessMessage('Mobile number verified successfully!');

//           // Optional: Clear OTP fields
//           setOtp(['', '', '', '', '', '']);
//         } else {
//           // OTP didn't match
//           if (response.otpExpired === true) {
//             setError('OTP has expired. Please request a new one.');
//           } else {
//             setError('Invalid OTP. Please try again.');
//           }

//           // Clear OTP fields on error
//           setOtp(['', '', '', '', '', '']);
//           document.getElementById('mobile-otp-input-0')?.focus();
//         }
//       } else {
//         // Handle API errors
//         if (response.message) {
//           setError(response.message);
//         } else if (response.error) {
//           setError(response.error);
//         } else {
//           setError('Verification failed. Please try again.');
//         }
//       }
//     } catch (err) {
//       console.error("Error in verifyOtp:", err);
//       setError(err.message || 'Network error. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const resendOtp = async () => {
//     if (resendTimer > 0) return;

//     setIsSendingOTP(true);
//     setError('');
//     setSuccessMessage('');

//     try {
//       const response = await sendMobileOTP(data.mobileNumber);

//       console.log("Resend Mobile OTP Response:", response); // Debug log

//       if (response && (response.statusCode === 200 || response.statusCode === '200')) {
//         setSuccessMessage(`New OTP sent to ${data.mobileNumber}`);
//         setOtp(['', '', '', '', '', '']);
//         setResendTimer(60);
//         setTransactionId(response.id || null);
//         document.getElementById('mobile-otp-input-0')?.focus();
//       } else {
//         if (response.message) {
//           console.log("Resend Mobile OTP Error:", response.message);
//           setError('Failed to resend OTP. Please try again.');
//         } else if (response.statusCode && response.statusCode !== 200) {
//           console.log("Resend Mobile OTP Error Status Code:", response.statusCode);
//           setError('Failed to resend OTP. Please try again.');
//         } else {
//           setError('Failed to resend OTP. Please try again.');
//         }
//       }
//     } catch (err) {
//       console.error("Error in resendOtp:", err, err.message);
//       setError('Failed to resend OTP. Please try again.');
//     } finally {
//       setIsSendingOTP(false);
//     }
//   };

//   const closePopup = () => {
//     setShowModal(false);
//     setMobileNumberVerification(prev => ({
//       ...prev,
//       show: false
//     }));
//   };

//   // Format mobile number for display (e.g., show last 4 digits only)
//   const formatMobileNumber = (number) => {
//     if (!number) return '';
//     const lastFour = number.slice(-4);
//     return `xxxxxx${lastFour}`;
//   };

//   return showModal ? (
//     <>
//       <div className="modal-backdrop fade show"></div>
//       <div className="modal fade show d-block" tabIndex="-1" aria-modal="true" role="dialog">
//         <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px", width: "100%" }}>
//           <div className="modal-content shadow-lg border-0 rounded-2 overflow-hidden">
//             <div className="modal-header text-white py-2 px-3" style={{
//               background: "linear-gradient(135deg,#0d6efd,#6610f2)"
//             }}>
//               <h5 className="modal-title fw-bold mb-0 fs-6">
//                 <i className="bi bi-phone me-1"></i>Mobile Number Verification
//               </h5>
//               <button
//                 type="button"
//                 className="btn-close btn-close-white"
//                 onClick={closePopup}
//                 disabled={isLoading || isSendingOTP}
//                 aria-label="Close"
//                 style={{ transform: 'scale(0.8)' }}
//               />
//             </div>

//             <div className="modal-body p-3" style={{ background: "#f8f9fc" }}>
//               <div className="text-center mb-2">
//                 <p className="text-muted mb-1 small">
//                   Enter OTP sent to your mobile number
//                 </p>
//                 <p className="text-info small mb-0">
//                   <i className="bi bi-info-circle me-1"></i>
//                   For testing, use OTP: 123456
//                 </p>
//               </div>

//               <div className="mb-3 text-center">
//                 <div className="d-inline-block bg-white p-2 rounded-1 shadow-sm border">
//                   <h6 className="fw-bold text-secondary text-uppercase mb-1 small" style={{ fontSize: '0.7rem' }}>MOBILE NUMBER</h6>
//                   <p className="mb-0 fw-bold text-gray-800" style={{ fontSize: '0.9rem' }}>
//                     {formatMobileNumber(data.mobileNumber)}
//                   </p>
//                 </div>
//               </div>

//               {/* Debug info - remove in production */}
//               {process.env.NODE_ENV === 'development' && transactionId && (
//                 <div className="mb-2 text-center">
//                   <small className="text-muted">Transaction ID: {transactionId}</small>
//                 </div>
//               )}

//               {isSendingOTP && !successMessage && (
//                 <div className="mb-2 text-center">
//                   <div className="spinner-border spinner-border-sm text-primary" role="status">
//                     <span className="visually-hidden">Sending...</span>
//                   </div>
//                   <p className="mt-1 text-muted small">Sending OTP...</p>
//                 </div>
//               )}

//               {successMessage && (
//                 <div className="alert alert-success py-1 px-2 mb-2 text-center small" role="alert">
//                   <span>{successMessage}</span>
//                 </div>
//               )}

//               {!isSendingOTP && (
//                 <>
//                   <div className="mb-3">
//                     <label className="form-label fw-semibold mb-1 small">6-digit OTP</label>
//                     <div className="d-flex justify-content-center gap-1 mb-2">
//                       {otp.map((digit, index) => (
//                         <input
//                           key={index}
//                           id={`mobile-otp-input-${index}`}
//                           type="text"
//                           maxLength="1"
//                           value={digit}
//                           onChange={(e) => handleOtpChange(index, e.target.value)}
//                           onKeyDown={(e) => handleKeyDown(index, e)}
//                           className="form-control text-center"
//                           style={{ 
//                             width: '35px', 
//                             height: '40px', 
//                             fontSize: '1rem',
//                             borderColor: error ? '#dc3545' : '#dee2e6',
//                             padding: '0.25rem'
//                           }}
//                           disabled={isLoading || isSendingOTP}
//                         />
//                       ))}
//                     </div>

//                     {error && (
//                       <div className="alert alert-danger py-1 px-2 mb-2 text-center small" role="alert">
//                         <span>{error}</span>
//                       </div>
//                     )}
//                   </div>
//                 </>
//               )}

//               {!isSendingOTP && (
//                 <div>
//                   <button
//                     onClick={verifyOtp}
//                     disabled={isLoading || otp.join('').length !== 6 || isSendingOTP}
//                     className={`btn w-100 rounded-1 mb-2 py-1 ${
//                       isLoading || otp.join('').length !== 6 || isSendingOTP
//                         ? 'btn-secondary'
//                         : 'btn-primary'
//                     }`}
//                     style={{ fontSize: '0.9rem' }}
//                   >
//                     {isLoading ? (
//                       <>
//                         <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
//                         Verifying...
//                       </>
//                     ) : (
//                       'Verify OTP'
//                     )}
//                   </button>

//                   <button
//                     onClick={resendOtp}
//                     disabled={isLoading || isSendingOTP || resendTimer > 0}
//                     className={`btn w-100 rounded-1 py-1 ${
//                       isLoading || isSendingOTP || resendTimer > 0
//                         ? 'btn-outline-secondary'
//                         : 'btn-outline-primary'
//                     }`}
//                     style={{ fontSize: '0.9rem' }}
//                   >
//                     {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
//                   </button>
//                 </div>
//               )}
//             </div>

//             <div className="modal-footer border-0 p-2 bg-light">
//               <button
//                 type="button"
//                 className="btn btn-outline-secondary rounded-1 px-3 py-1"
//                 onClick={closePopup}
//                 disabled={isLoading || isSendingOTP}
//                 style={{ fontSize: '0.85rem' }}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   ) : null;
// }

// export default MobileOTP;



import React, { useState, useEffect } from 'react';
import { sendMobileOTP, verifyMobileOTP } from '../api/verify-otp';

function MobileOTP({ data, setMobileNumberVerification }) {
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
    if (!data?.mobileNumber) {
      setError('Mobile number is required');
      return;
    }

    setIsSendingOTP(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await sendMobileOTP(data.mobileNumber);

      console.log("Send SMS OTP Response:", response);

      if (response && (response.statusCode === 200 || response.statusCode === '200')) {
        setSuccessMessage(`OTP sent successfully to ${formatMobileNumber(data.mobileNumber)}`);

        setTransactionId(response.id || null);

        setResendTimer(60);
      } else {
        setError(response?.message || 'Failed to send OTP. Please try again.');
      }

    } catch (err) {
      console.error("Error in sendInitialOTP:", err);
      setError(err.message || 'Failed to send OTP');
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
      document.getElementById(`mobile-otp-input-${index + 1}`)?.focus();
    }

    setError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`mobile-otp-input-${index - 1}`)?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    if (!transactionId) {
      setError('Transaction ID missing. Please resend OTP.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {

      const payload = {
        id: transactionId,
        mobileNumber: data.mobileNumber,
        otp: otpString
      };
      console.log("Verify Payload:", payload);
      const response = await verifyMobileOTP(payload);
      console.log("Verify OTP API Response:", response);

      // if (response && (response.statusCode === 200 || response.statusCode === '200')) {

      //   if (response.matched === true) {
      //     setMobileNumberVerification(prev => ({
      //       ...prev,
      //       show: false,
      //       verified: true,
      //       verifiedMobileNumber: prev.mobileNumber
      //     }));

      //     setSuccessMessage('Mobile number verified successfully!');
      //     setOtp(['', '', '', '', '', '']);

      //   } else {
      //     setError('Invalid OTP. Please try again.');
      //     setOtp(['', '', '', '', '', '']);
      //     document.getElementById('mobile-otp-input-0')?.focus();
      //   }

      // } else {
      //   setError(
      //     response?.message ||
      //     response?.error ||
      //     'Verification failed. Please try again.'
      //   );

      //   setOtp(['', '', '', '', '', '']);
      //   document.getElementById('mobile-otp-input-0')?.focus();
      // }

      if (response && (response.statusCode === 200 || response.statusCode === '200')) {

        if (response.otpExpired) {
          setError('OTP has expired. Please resend OTP.');
          setOtp(['', '', '', '', '', '']);
          return;
        }

        if (response.matched === true) {
          setMobileNumberVerification(prev => ({
            ...prev,
            show: false,
            verified: true,
            verifiedMobileNumber: data.mobileNumber
          }));

          setSuccessMessage('Mobile number verified successfully!');
          setOtp(['', '', '', '', '', '']);
          return;
        }

        setError('Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('mobile-otp-input-0')?.focus();

      } else {
        setError(
          response?.message ||
          response?.error ||
          'Verification failed. Please try again.'
        );

        setOtp(['', '', '', '', '', '']);
        document.getElementById('mobile-otp-input-0')?.focus();
      }
    } catch (e) {
      console.error("Error in verifyOtp:", e);
      setError(e?.message || 'Network error. Please try again.');
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
      const response = await sendMobileOTP(data.mobileNumber);

      if (response && (response.statusCode === 200 || response.statusCode === '200')) {
        setSuccessMessage(`OTP resent successfully`);

        setTransactionId(response.id || null);

        setOtp(['', '', '', '', '', '']);
        setResendTimer(60);
        document.getElementById('mobile-otp-input-0')?.focus();
      } else {
        setError(response?.message || 'Failed to resend OTP');
      }

    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const closePopup = () => {
    setShowModal(false);
    setMobileNumberVerification(prev => ({
      ...prev,
      show: false
    }));
  };

  // Format mobile number for display (e.g., show last 4 digits only)
  const formatMobileNumber = (number) => {
    if (!number) return '';
    const lastFour = number.slice(-4);
    return `xxxxxx${lastFour}`;
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
                <i className="bi bi-phone me-1"></i>Mobile Number Verification
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
                  Enter OTP sent to your mobile number
                </p>
              </div>

              <div className="mb-3 text-center">
                <div className="d-inline-block bg-white p-2 rounded-1 shadow-sm border">
                  <h6 className="fw-bold text-secondary text-uppercase mb-1 small" style={{ fontSize: '0.7rem' }}>MOBILE NUMBER</h6>
                  <p className="mb-0 fw-bold text-gray-800" style={{ fontSize: '0.9rem' }}>
                    {formatMobileNumber(data.mobileNumber)}
                  </p>
                </div>
              </div>

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
                          id={`mobile-otp-input-${index}`}
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
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>

                    {error && (
                      <div className="alert alert-danger py-1 px-2 mb-2 text-center small" role="alert">
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!isSendingOTP && (
                <div>
                  <button
                    onClick={verifyOtp}
                    disabled={isLoading || otp.join('').length !== 6 || isSendingOTP}
                    className={`btn w-100 rounded-1 mb-2 py-1 ${isLoading || otp.join('').length !== 6 || isSendingOTP
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
                    className={`btn w-100 rounded-1 py-1 ${isLoading || isSendingOTP || resendTimer > 0
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

export default MobileOTP;