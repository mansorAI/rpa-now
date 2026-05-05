const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const FB_API = 'https://graph.facebook.com/v18.0';

const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
    scope: 'pages_manage_posts,pages_read_engagement,publish_video',
    response_type: 'code',
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
};

const exchangeCode = async (code) => {
  const res = await axios.get(`${FB_API}/oauth/access_token`, {
    params: {
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
      code,
    },
  });
  return res.data;
};

const getPages = async (accessToken) => {
  const res = await axios.get(`${FB_API}/me/accounts`, {
    params: { access_token: accessToken },
  });
  return res.data.data;
};

const postToPage = async ({ credentials, text, hashtags = [], mediaPath, mediaType = 'photo' }) => {
  const { page_access_token, page_id } = credentials;
  const fullText = `${text}\n${hashtags.join(' ')}`;

  if (mediaPath && mediaType === 'video') {
    const form = new FormData();
    form.append('source', fs.createReadStream(mediaPath));
    form.append('description', fullText);
    form.append('access_token', page_access_token);

    const res = await axios.post(`${FB_API}/${page_id}/videos`, form, {
      headers: form.getHeaders(),
    });
    return { platform_post_id: res.data.id };
  }

  if (mediaPath) {
    const form = new FormData();
    form.append('source', fs.createReadStream(mediaPath));
    form.append('caption', fullText);
    form.append('access_token', page_access_token);

    const res = await axios.post(`${FB_API}/${page_id}/photos`, form, {
      headers: form.getHeaders(),
    });
    return { platform_post_id: res.data.id };
  }

  const res = await axios.post(`${FB_API}/${page_id}/feed`, {
    message: fullText,
    access_token: page_access_token,
  });
  return { platform_post_id: res.data.id };
};

module.exports = { getAuthUrl, exchangeCode, getPages, postToPage };
