const axios = require('axios');
const fs = require('fs');

const SNAP_API = 'https://adsapi.snapchat.com/v1';

const getAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.SNAPCHAT_CLIENT_ID,
    redirect_uri: process.env.SNAPCHAT_REDIRECT_URI,
    response_type: 'code',
    scope: 'snapchat-marketing-api',
    state: state || 'snap_auth',
  });
  return `https://accounts.snapchat.com/login/oauth2/authorize?${params}`;
};

const exchangeCode = async (code) => {
  const res = await axios.post('https://accounts.snapchat.com/login/oauth2/access_token', {
    client_id: process.env.SNAPCHAT_CLIENT_ID,
    client_secret: process.env.SNAPCHAT_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.SNAPCHAT_REDIRECT_URI,
  });
  return res.data;
};

// Snapchat Story upload via Snap Kit Creator API
const uploadStory = async ({ credentials, mediaPath, caption }) => {
  const { access_token } = credentials;

  const formData = new (require('form-data'))();
  formData.append('media', fs.createReadStream(mediaPath));
  formData.append('caption', caption);

  // Note: Snapchat story posting requires Snap Kit approval
  const res = await axios.post(
    'https://kit.snapchat.com/v1/media',
    formData,
    { headers: { ...formData.getHeaders(), Authorization: `Bearer ${access_token}` } }
  );

  return { platform_post_id: res.data.id };
};

module.exports = { getAuthUrl, exchangeCode, uploadStory };
