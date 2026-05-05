const { TwitterApi } = require('twitter-api-v2');

const getClient = (credentials = {}) => {
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: credentials.access_token || process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: credentials.access_token_secret || process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });
};

const getAuthUrl = (state) => {
  const client = new TwitterApi({
    clientId: process.env.TWITTER_API_KEY,
    clientSecret: process.env.TWITTER_API_SECRET,
  });
  const { url, codeVerifier } = client.generateOAuth2AuthLink(
    process.env.TWITTER_REDIRECT_URI,
    { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'], state }
  );
  return { url, codeVerifier };
};

const exchangeCode = async (code, codeVerifier) => {
  const client = new TwitterApi({
    clientId: process.env.TWITTER_API_KEY,
    clientSecret: process.env.TWITTER_API_SECRET,
  });
  const { client: loggedClient, accessToken, refreshToken } = await client.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: process.env.TWITTER_REDIRECT_URI,
  });
  const { data } = await loggedClient.v2.me({ 'user.fields': ['name', 'username', 'profile_image_url'] });
  return { accessToken, refreshToken, user: data };
};

const getAccountInfo = async () => {
  const client = getClient();
  const { data } = await client.v2.me({ 'user.fields': ['name', 'username', 'profile_image_url'] });
  return data;
};

const postTweet = async ({ credentials, text, description, hashtags = [], mediaPath, title }) => {
  let client;
  if (credentials.oauth2_access_token) {
    client = new TwitterApi(credentials.oauth2_access_token);
  } else {
    client = getClient(credentials);
  }

  const content = text || description || title || '';
  const tags = hashtags.length > 0 ? '\n' + hashtags.join(' ') : '';
  const fullText = (content + tags).substring(0, 280);

  if (mediaPath) {
    const fs = require('fs');
    if (fs.existsSync(mediaPath)) {
      const rwClient = client.readWrite;
      const mediaId = await rwClient.v1.uploadMedia(mediaPath);
      const { data } = await rwClient.v2.tweet({ text: fullText, media: { media_ids: [mediaId] } });
      return { platform_post_id: data.id, url: `https://x.com/i/web/status/${data.id}` };
    }
  }

  const { data } = await client.v2.tweet(fullText);
  return { platform_post_id: data.id, url: `https://x.com/i/web/status/${data.id}` };
};

const testConnection = async () => {
  const client = getClient();
  const { data } = await client.v2.me();
  return { success: true, username: data.username, name: data.name };
};

module.exports = { getClient, getAuthUrl, exchangeCode, getAccountInfo, postTweet, testConnection };
