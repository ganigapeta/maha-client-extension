/**
 * Sends an SMS by calling the ACL Gateway API directly via AJAX.
 * This approach avoids changing any Liferay Headless or Backend code.
 * @param {number|string} mobileNumber 
 * @param {string} message 
 */
export async function sendSMS(mobileNumber, message) {
  try {
    const baseUrl = "https://push3.aclgateway.com/servlet/com.aclwireless.pushconnectivity.listeners.TextListener";
    
    // Using parameters from the Groovy script provided
    const params = new URLSearchParams({
      appid: "mitdbt2x",
      userId: "mitdbt2x",
      pass: "mitd_08",
      contenttype: "1",
      from: "MAHGOV",
      alert: "1",
      selfid: "true",
      to: mobileNumber,
      text: message 
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    console.log("SMS Gateway API Request URL:", fullUrl);

    // Using 'no-cors' mode allows the browser to send the GET request 
    // even if the gateway doesn't explicitly allow the Liferay domain.
    // Note: In 'no-cors' mode, we cannot read the response content, 
    // but the SMS gateway will receive the request and process it.
    await fetch(fullUrl, {
      method: 'GET',
      mode: 'no-cors' 
    });

    return { success: true, message: "SMS request dispatched" };
    
  } catch (error) {
    console.error('Error in sendSMS:', error);
    return { success: false, error };
  }
}
