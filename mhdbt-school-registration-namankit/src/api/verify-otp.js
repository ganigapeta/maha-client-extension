import {getAccessToken} from "./auth"
// import { getCsrfToken } from "../utils/liferay";
export async function sendAadhaarOTP(aadhaarNumber) {
  try {
      const token = await getAccessToken();
      console.log("token:::::", token);
    const response = await fetch(
      "/o/mhdbt-headless-service/v1.0/send-aadhaar-otp",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          aadhaarNumber: aadhaarNumber
        }),
         credentials: "omit" 
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send Aadhaar OTP. Status: ${response.status}, Response: ${errorText}`
      );
    }

     const data = await response.json();
    return data; 


  } catch (error) {
    console.error("Error sending Aadhaar OTP:", error);
    return {status:"400",error:"Failed to send Aadhaar OTP. Please try again.",success:false}
  }
}


// In your api/verify-otp.js or similar file
export async function verifyAadhaarOTP(aadhaarNumber, id, otp) {
  try {
    console.log("Verifying OTP:", { aadhaarNumber, id, otp });
    const token = await getAccessToken();
    console.log("token:::::", token);
    const response = await fetch(
      "/o/mhdbt-headless-service/v1.0/verify-aadhaar-otp",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
           "Authorization": `Bearer ${token}`
          // "x-csrf-token": window.Liferay?.authToken || "",
          // Add Authorization if needed
          // "Authorization": `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify({
          aadhaarNumber: aadhaarNumber,
          id: id,
          aadhaarOTP: otp
        }),
        credentials: "include"
      }
    );

    console.log("Verify OTP Response Status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Verify OTP Error:", errorText);
      throw new Error(
        `Failed to verify OTP. Status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Verify OTP Success Response:", data);
    return data;

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      statusCode: 400,
      message: "Verification failed. Please try again.",
      error: "Failed to verify OTP",
      success: false
    };
  }
}


export async function sendEmailOTP(email) {
  try {
    console.log("sendEmailOTP:::::", email);
    const token = await getAccessToken();
      console.log("token:::::", token);
    // const csrfToken = await getCsrfToken(); 
    //   if (!csrfToken) throw new Error("Access csrfToken not available");
    
    const response = await fetch(
      "/o/mhdbt-headless-service/v1.0/send-email-otp",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email
        }),
        credentials: "include" 
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(
        `Failed to send Email OTP. Status: ${response.statusCode}`
      );
    }

    const data = await response.json();
    console.log("sendEmailOTP Success Response:", data);
    return data;

  } catch (error) {
    console.error("Error sending Email OTP:", error);
    // Return a more descriptive error object
    return {
      status: 400,
      message: "OTP sending failed. Please try again.",
      success: false,
      error: error.message || "An unexpected error occurred while sending OTP."
    };
  }
}

// In your api/verify-otp.js or similar file
export async function verifyEmailOTP(email, id, otp) {
  try {
    console.log("Verifying OTP:", { email, id, otp });
    const token = await getAccessToken();
      console.log("token:::::", token);
    const response = await fetch(
      "/o/mhdbt-headless-service/v1.0/verify-otp",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
          // Add Authorization if needed
          // "Authorization": `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify({
          email: email,
          id: id,
          otp: otp
        }),
        credentials: "omit"
      }
    );

    console.log("Verify OTP Response Status:", response.statusCode);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Verify OTP Error:", errorText);
      throw new Error(
        `Failed to verify OTP. Status: ${response.statusCode}`
      );
    }
  
    const data = await response.json();
    console.log("Verify OTP Success Response:", data);
    return data;

  } catch (error) {
    console.error("Error verifying OTP:", error,error.message);
    return {
      statusCode: 400,
      message:"Verification failed. Please try again.",
      success: false,
      error: error.message || "An unexpected error occurred during OTP verification."
    };
  }
}

export async function checkVerified(verification,setSubmissionModal, verifiedFields, fieldName,errorFieldName,payloadData,verifyingField) {
    try {
        // Check if email and aadhaar fields exist in verifiedFields
        const hasField = fieldName && fieldName in verifiedFields;
        // Determine verification status from multiple sources
       const isVerified = (verification?.verified === true && payloadData === verifyingField) || 
                   (hasField && verifiedFields[fieldName] === true);
        // If both are verified, return true
        if (isVerified) {
            return true;
        }
        // Check if we should even verify these fields (based on whether they exist in verifiedFields)
        const shouldCheck = hasField || verification !== undefined;
        // Only show errors for fields that actually need verification
        const missingVerifications = [];
        
        if (shouldCheck) {
            missingVerifications.push(errorFieldName || "");
        }
      
        // If there are missing verifications, show error
        if (missingVerifications.length > 0) {
            let message = "";
                message = `Please verify your ${missingVerifications[0]} before proceeding.`;
            // Show modal with error
            setSubmissionModal({
                show: true,
                title: "Verification Required",
                message: message,
                variant: "primary",
                isVerified: true
            });
            
            return false;
        }
        return true;

    } catch (error) {
        console.error("Error in check for Verified field:", error);
        
        // Show error modal
        setSubmissionModal({
            show: true,
            title: "Verification Error",
            message: "Unable to check verification status. Please try again.",
            variant: "primary"
        });
        
        return false;
    }
}

async function verifyOtrNumber(otrNumber, aadhaarnumber) {
  try {
    const response = await fetch(
      "/o/mhdbt-headless-service/v1.0/validate/otr",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
        body: JSON.stringify({
          otrNo: otrNumber,
          aadhaar: aadhaarnumber
        }),
        credentials: "include"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "FAILURE",
        message: data?.error || "Something went wrong"
      };
    }

    console.log("OTR Validation Response:", data);
    return {
      status: data.status,
      message: data?.error || "Validation Successful"
    };

  } catch (error) {
    console.error("Error verifying OTR number:", error);
    return {
      status: "FAILURE",
      message: "Server error occurred"
    };
  }
}


export async function sendMobileOTP(mobileNumber) {
  try {
    console.log("sendEmailOTP:::::", mobileNumber);
    const token = await getAccessToken();
      console.log("token:::::", token);
    // const csrfToken = await getCsrfToken(); 
    //   if (!csrfToken) throw new Error("Access csrfToken not available");
    
    const response = await fetch(
      "/o/mhdbt-headless-service/v1.0/send-sms-otp",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          mobileNumber: mobileNumber
        }),
        credentials: "omit" 
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(
        `Failed to send Email OTP. Status: ${response.statusCode}`
      );
    }

    const data = await response.json();
    console.log("sendEmailOTP Success Response:", data);
    return data;

  } catch (error) {
    console.error("Error sending Email OTP:", error);
    // Return a more descriptive error object
    return {
      status: 400,
      message: "OTP sending failed. Please try again.",
      success: false,
      error: error.message || "An unexpected error occurred while sending OTP."
    };
  }
}



export async function verifyMobileOTP(payload) {
  try {
    console.log("Verifying OTP:", { payload });
    const token = await getAccessToken();
      console.log("token:::::", token);
    const response = await fetch(
      "/o/mhdbt-headless-service/v1.0/verify-sms-otp",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
          // Add Authorization if needed
          // "Authorization": `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify(payload),
        credentials: "omit"
      }
    );

    console.log("Verify OTP Response Status:", response.statusCode);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Verify OTP Error:", errorText);
      throw new Error(
        `Failed to verify OTP. Status: ${response.statusCode}`
      );
    }
  
    const data = await response.json();
    console.log("Verify OTP Success Response:", data);
    return data;

  } catch (error) {
    console.error("Error verifying OTP:", error,error.message);
    return {
      statusCode: 400,
      message:"Verification failed. Please try again.",
      success: false,
      error: error.message || "An unexpected error occurred during OTP verification."
    };
  }
}