export async function getBeneficiaryRegistered(payload = {}) {
  try {
    const response = await fetch(
      `/o/mhdbt-headless-service/v1.0/mahakala-sanman/get-regular-payment`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || ""
        },
        credentials: "include",
        body: JSON.stringify(payload) // important
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch regular payment: ${response.status}`);
    }

    const data = await response.json();

    return data;

  } catch (err) {
    console.error("Error fetching regular payment:", err);
    return null;
  }
}