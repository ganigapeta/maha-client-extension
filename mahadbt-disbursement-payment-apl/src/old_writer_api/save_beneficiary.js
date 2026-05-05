export async function saveBeneficiaryDetails(payload = {}) {
  try {
    const response = await fetch(`/o/c/oldwriterrfts`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || ""
      },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch regular payment: ${response.status}${errorText ? ` - ${errorText}` : ""}`
      );
    }

    const data = await response.json();

    return data;

  } catch (err) {
    console.error("Error fetching regular payment:", err);
    return null;
  }
}
