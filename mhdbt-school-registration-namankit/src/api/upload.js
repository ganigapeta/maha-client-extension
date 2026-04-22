/* =========================
   GET FOLDER ID BY NAME
========================= */
async function getFolderIdByName(siteId, folderName) {
  const res = await fetch(
    `/o/headless-delivery/v1.0/sites/${siteId}/document-folders?search=${encodeURIComponent(folderName)}`,
    {
      method: "GET",
      headers: {
        // Accept: "application/json",
        // "x-csrf-token": window.Liferay?.authToken || "",
        Authorization: "Basic " + btoa("prabhudasu:root") 
      },
      credentials: "include",
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to fetch folders (${res.status}): ${errorText}`
    );
  }

  const data = await res.json();

  if (!data || !Array.isArray(data.items)) {
    throw new Error("Invalid folder response from server");
  }

  const folder = data.items.find(
    (f) => f.name.trim().toLowerCase() === folderName.trim().toLowerCase()
  );

  if (!folder) {
    throw new Error(`Folder not found: ${folderName}`);
  }

  return folder.id;
}

/* =========================
   UPLOAD FILE TO FOLDER
========================= */
export async function uploadAttachmentByFolderName(
  siteId,
  file,
  folderName
) {
  if (!file) {
    throw new Error("No file provided");
  }

  const folderId = await getFolderIdByName(siteId, folderName);

  const ext = file.name.split(".").pop();
  const uniqueName = `${Date.now()}_${Math.random()
    .toString(36)
    .substring(2)}.${ext}`;

  const renamedFile = new File([file], uniqueName, {
    type: file.type,
  });

  const uploadForm = new FormData();
  uploadForm.append("file", renamedFile);
  uploadForm.append("title", uniqueName);
  //uploadForm.append("externalReferenceCode");

  const uploadResponse = await fetch(
    `/o/headless-delivery/v1.0/document-folders/${folderId}/documents`,
    {
      method: "POST",
      headers: {
        // Accept: "application/json",
        // "x-csrf-token": window.Liferay?.authToken || "",
        Authorization: "Basic " + btoa("prabhudasu:root") 
      },
      body: uploadForm,
      credentials: "include",
    }
  );

  if (!uploadResponse.ok) {
    const err = await uploadResponse.text();
    throw new Error(
      `Upload failed (${uploadResponse.status}): ${err}`
    );
  }

  const data = await uploadResponse.json();

  return {
    documentId: data.id,
    title: data.title,
    downloadURL: data.contentUrl,
  };
}