let cachedAccessToken = null;
let tokenExpiresAt = 0;

const getZohoAccessToken = async () => {
    const now = Date.now();

    if (cachedAccessToken && now < tokenExpiresAt) {
        return {
            accessToken: cachedAccessToken,
            apiDomain: "https://www.zohoapis.in"
        };
    }

    const params = new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token"
    });

    const response = await fetch(
        `https://accounts.zoho.in/oauth/v2/token?${params.toString()}`,
        {
            method: "POST"
        }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
        console.error("Zoho token refresh error:", data);
        throw new Error("Failed to generate Zoho access token");
    }

    cachedAccessToken = data.access_token;

    tokenExpiresAt = Date.now() + ((data.expires_in || 3600) - 300) * 1000;

    return {
        accessToken: cachedAccessToken,
        apiDomain: data.api_domain
    };
};

module.exports = {
    getZohoAccessToken
};