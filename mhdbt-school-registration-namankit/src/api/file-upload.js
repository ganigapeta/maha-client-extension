import { getAccessToken } from "./auth";

// Fetch folderId based on folderName
async function getFolderIdByName(siteId, folderName) {
  const token = await getAccessToken();

  const response = await fetch(
    `/o/headless-delivery/v1.0/sites/${siteId}/document-folders`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch folders");
  }

  const data = await response.json();
  const folder = data.items.find(f => f.name === folderName);

  if (!folder) {
    throw new Error(`Folder not found: ${folderName}`);
  }

  return folder.id;
}

// Upload attachment using only folderName
export async function uploadAttachmentByFolderName(siteId, file, folderName) {
  const token = await getAccessToken();
  
  // Step 1 → Get folderId automatically
  const folderId = await getFolderIdByName(siteId, folderName);
 
  // Step 2 → Upload file into that folder
  const originalFileName = file.name;
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${originalFileName}`;

  const uploadForm = new FormData();
  uploadForm.append("file", file, uniqueFileName);
  uploadForm.append("title", uniqueFileName);
 
  const uploadResponse = await fetch(
    `/o/headless-delivery/v1.0/document-folders/${folderId}/documents`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: uploadForm,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`File upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  const data = await uploadResponse.json();
  return {
    documentId: data.id,
    title: data.title,
    contentUrl: data.contentUrl,
  };
}


// export async function checkValidFileAPI (file) {
//   const formData = new FormData();
//   formData.append("file", file);
 
//   try {
//     // Get the access token
//     let token;
//     try {
//       token = await getAccessToken();
//     } catch (tokenError) {
//       console.error("Failed to get access token:", tokenError);
//       return false;
//     }

//     const response = await fetch(
//       "/o/mhdbt-headless-service/v1.0/check-valid-file",
//       {
//         method: "POST",
//         body: formData,
//         headers: {
//           "Content-Type": "multipart/form-data",
//           "Authorization": `Bearer ${token}`,
//         },
//         credentials: "include",
//       }
//     );

//     // Handle non-2xx responses
//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(`API error ${response.status}:`, errorText);
//       return false;
//     }

//     // Parse JSON response
//     const data = await response.json();
    
//     // Log for debugging
//     console.log("File validation response:", data);
    
//     // API RESPONSE: { IsValid: true / false }
//     return data?.IsValid === true;
 
//   } catch (error) {
//     console.error("File validation API error:", error);
//     return false; // treat API failure as invalid file
//   }
// };


