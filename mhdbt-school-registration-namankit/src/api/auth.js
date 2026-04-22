
// Get access token from Liferay OAuth2

//Local Client ID and Client Secret
// const CLIENT_ID="id-213e4e7d-3130-c731-923c-7bafe177"
// const CLIENT_SECRET="secret-995776b4-caf8-fd4b-82f7-4e72f9bedf9"

//Production Client ID and Client Secret
//  const CLIENT_ID="id-bb4aeb8a-e476-5cfe-3346-4e0bde719d6"
//  const CLIENT_SECRET="secret-5a51426a-2f44-66ae-cc3e-b93d43ce05f"



const CLIENT_ID="id-cb73ae1e-361e-a1df-b2fa-222d62b59"
const CLIENT_SECRET="secret-ed72d85e-bb68-2c90-ea70-e28aac203429"
 
export async function getAccessToken() {
  try {
    const response = await fetch('/o/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error);
    return null;
  }
}

