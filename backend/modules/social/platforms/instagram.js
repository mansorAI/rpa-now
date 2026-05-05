const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const FB_API = 'https://graph.facebook.com/v18.0';

const getAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    scope: 'instagram_basic,instagram_content_publish,pages_read_engagement',
    response_type: 'code',
    state: state || 'ig_auth',
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
};

const getIGAccount = async (accessToken) => {
  const pages = await axios.get(`${FB_API}/me/accounts`, { params: { access_token: accessToken } });
  const page = pages.data.data[0];
  if (!page) throw new Error('لا توجد صفحة Facebook مربوطة');

  const igRes = await axios.get(`${FB_API}/${page.id}`, {
    params: { fields: 'instagram_business_account', access_token: page.access_token },
  });
  return { ig_id: igRes.data.instagram_business_account?.id, page_token: page.access_token };
};

const publishReel = async ({ credentials, mediaUrl, caption, hashtags = [] }) => {
  const { ig_id, page_token } = credentials;
  const fullCaption = `${caption}\n${hashtags.join(' ')}`;

  // Step 1: Create container
  const container = await axios.post(`${FB_API}/${ig_id}/media`, {
    video_url: mediaUrl,
    caption: fullCaption,
    media_type: 'REELS',
    access_token: page_token,
  });

  // Step 2: Wait for processing
  await new Promise(r => setTimeout(r, 5000));

  // Step 3: Publish
  const publish = await axios.post(`${FB_API}/${ig_id}/media_publish`, {
    creation_id: container.data.id,
    access_token: page_token,
  });

  return { platform_post_id: publish.data.id };
};

const publishPhoto = async ({ credentials, imageUrl, caption, hashtags = [] }) => {
  const { ig_id, page_token } = credentials;
  const fullCaption = `${caption}\n${hashtags.join(' ')}`;

  const container = await axios.post(`${FB_API}/${ig_id}/media`, {
    image_url: imageUrl,
    caption: fullCaption,
    access_token: page_token,
  });

  const publish = await axios.post(`${FB_API}/${ig_id}/media_publish`, {
    creation_id: container.data.id,
    access_token: page_token,
  });

  return { platform_post_id: publish.data.id };
};

module.exports = { getAuthUrl, getIGAccount, publishReel, publishPhoto };
