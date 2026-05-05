const axios = require('axios');
const fs = require('fs');

const TIKTOK_API = 'https://open.tiktokapis.com/v2';

const getAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    response_type: 'code',
    scope: 'user.info.basic,video.publish,video.upload',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    state: state || 'tiktok_auth',
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
};

const exchangeCode = async (code) => {
  const res = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI,
  });
  return res.data;
};

const uploadVideo = async ({ credentials, filePath, title, hashtags = [] }) => {
  const { access_token } = credentials;

  // Step 1: Init upload
  const fileSize = fs.statSync(filePath).size;
  const initRes = await axios.post(
    `${TIKTOK_API}/post/publish/video/init/`,
    {
      post_info: {
        title: `${title} ${hashtags.join(' ')}`.substring(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: { source: 'FILE_UPLOAD', video_size: fileSize, chunk_size: fileSize, total_chunk_count: 1 },
    },
    { headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json; charset=UTF-8' } }
  );

  const { upload_url, publish_id } = initRes.data.data;

  // Step 2: Upload file
  const videoBuffer = fs.readFileSync(filePath);
  await axios.put(upload_url, videoBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
    },
  });

  return { platform_post_id: publish_id };
};

const getUserInfo = async (access_token) => {
  const res = await axios.get(`${TIKTOK_API}/user/info/`, {
    headers: { Authorization: `Bearer ${access_token}` },
    params: { fields: 'open_id,union_id,avatar_url,display_name' },
  });
  return res.data.data.user;
};

module.exports = { getAuthUrl, exchangeCode, uploadVideo, getUserInfo };
