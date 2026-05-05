const { google } = require('googleapis');
const fs = require('fs');

const getOAuthClient = (credentials) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
  });
  return oauth2Client;
};

const getAuthUrl = (state) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    prompt: 'consent',
    state: state || '',
  });
};

const exchangeCode = async (code) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

const uploadVideo = async ({ credentials, filePath, title, description, hashtags = [], isShort = false }) => {
  const auth = getOAuthClient(credentials);
  const youtube = google.youtube({ version: 'v3', auth });

  const tags = hashtags.map(h => h.replace('#', ''));
  const finalDescription = `${description}\n\n${hashtags.join(' ')}`;

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: isShort ? title.substring(0, 100) : title,
        description: finalDescription,
        tags,
        categoryId: '22',
        defaultLanguage: 'ar',
      },
      status: { privacyStatus: 'public' },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });

  return { platform_post_id: response.data.id, url: `https://youtube.com/watch?v=${response.data.id}` };
};

const getChannelInfo = async (credentials) => {
  const auth = getOAuthClient(credentials);
  const youtube = google.youtube({ version: 'v3', auth });
  const res = await youtube.channels.list({ part: ['snippet'], mine: true });
  return res.data.items[0];
};

module.exports = { getAuthUrl, exchangeCode, uploadVideo, getChannelInfo };
