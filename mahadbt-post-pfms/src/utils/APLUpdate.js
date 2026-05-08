import { apiService } from "../api/external-api";
import { getLiferayUserId } from "../config";

  export const handleUpdateExternalBill = async (bill_no) => {

      const payload = {
        bill_no: bill_no,
        userId: getLiferayUserId(),
        status: "SIGNED_BY_DDO"
      };

      console.log('DDO - Bill Payload:', JSON.stringify(payload, null, 2));
  
      try {
        const response = await apiService.updateBilltatus(payload);
        console.log('Bill Submit response:', response);
        
      } catch (error) {
        console.error('Error submitting bill:', error);
        throw error; // Rethrow to be caught in handleSubmit
      
      }
    };