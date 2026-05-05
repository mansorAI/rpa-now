const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/database');
const oauthStore = require('./oauthStore');
const twitter = require('./platforms/twitter');
const facebook = require('./platforms/facebook');
const instagram = require('./platforms/instagram');
const youtube = require('./platforms/youtube');
const tiktok = require('./platforms/tiktok');
const snapchat = require('./platforms/snapchat');
const axios = require('axios');

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';

const decodeState = (state) => {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {
    return null;
  }
};

const saveAccount = async (workspaceId, platform, accountName, accountId, credentials) => {
  const { rows } = await query(
    'SELECT id FROM social_accounts WHERE workspace_id=$1 AND platform=$2 AND account_id=$3',
    [workspaceId, platform, accountId]
  );
  if (rows[0]) {
    await query(
      'UPDATE social_accounts SET account_name=$1, credentials=$2, is_active=true WHERE id=$3',
      [accountName, JSON.stringify(credentials), rows[0].id]
    );
  } else {
    await query(
      'INSERT INTO social_accounts (id, workspace_id, platform, account_name, account_id, credentials) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), workspaceId, platform, accountName, accountId, JSON.stringify(credentials)]
    );
  }
};

// Twitter callback
const twitterCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const stored = oauthStore.get(state);
    if (!stored) return res.redirect(`${FRONTEND}/social?error=expired`);

    const { workspaceId, codeVerifier } = stored;
    oauthStore.del(state);

    const { accessToken, refreshToken, user } = await twitter.exchangeCode(code, codeVerifier);
    await saveAccount(workspaceId, 'twitter', `@${user.username}`, user.id, {
      oauth2_access_token: accessToken,
      oauth2_refresh_token: refreshToken,
    });

    res.redirect(`${FRONTEND}/social?connected=twitter`);
  } catch (err) {
    console.error('Twitter callback error:', err.message);
    res.redirect(`${FRONTEND}/social?error=twitter`);
  }
};

// YouTube callback
const youtubeCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const info = decodeState(state);
    if (!info) return res.redirect(`${FRONTEND}/social?error=invalid_state`);

    const tokens = await youtube.exchangeCode(code);
    const channel = await youtube.getChannelInfo(tokens);
    const channelName = channel?.snippet?.title || 'YouTube Channel';
    const channelId = channel?.id || uuidv4();

    await saveAccount(info.workspaceId, 'youtube', channelName, channelId, tokens);
    res.redirect(`${FRONTEND}/social?connected=youtube`);
  } catch (err) {
    console.error('YouTube callback error:', err.message);
    res.redirect(`${FRONTEND}/social?error=youtube`);
  }
};

// Facebook callback
const facebookCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const info = decodeState(state);
    if (!info) return res.redirect(`${FRONTEND}/social?error=invalid_state`);

    const tokenData = await facebook.exchangeCode(code);
    const pages = await facebook.getPages(tokenData.access_token);

    for (const page of pages) {
      await saveAccount(info.workspaceId, 'facebook', page.name, page.id, {
        page_access_token: page.access_token,
        page_id: page.id,
        user_access_token: tokenData.access_token,
      });
    }

    res.redirect(`${FRONTEND}/social?connected=facebook`);
  } catch (err) {
    console.error('Facebook callback error:', err.message);
    res.redirect(`${FRONTEND}/social?error=facebook`);
  }
};

// Instagram callback
const instagramCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const info = decodeState(state);
    if (!info) return res.redirect(`${FRONTEND}/social?error=invalid_state`);

    const FB_API = 'https://graph.facebook.com/v18.0';
    const tokenRes = await axios.get(`${FB_API}/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code,
      },
    });

    const { ig_id, page_token } = await instagram.getIGAccount(tokenRes.data.access_token);
    if (!ig_id) return res.redirect(`${FRONTEND}/social?error=no_ig_account`);

    const igInfo = await axios.get(`${FB_API}/${ig_id}`, {
      params: { fields: 'username', access_token: page_token },
    });

    await saveAccount(info.workspaceId, 'instagram', `@${igInfo.data.username}`, ig_id, {
      ig_id,
      page_token,
    });

    res.redirect(`${FRONTEND}/social?connected=instagram`);
  } catch (err) {
    console.error('Instagram callback error:', err.message);
    res.redirect(`${FRONTEND}/social?error=instagram`);
  }
};

// TikTok callback
const tiktokCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const info = decodeState(state);
    if (!info) return res.redirect(`${FRONTEND}/social?error=invalid_state`);

    const tokenData = await tiktok.exchangeCode(code);
    const user = await tiktok.getUserInfo(tokenData.access_token);

    await saveAccount(info.workspaceId, 'tiktok', user.display_name || 'TikTok User', user.open_id, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      open_id: user.open_id,
    });

    res.redirect(`${FRONTEND}/social?connected=tiktok`);
  } catch (err) {
    console.error('TikTok callback error:', err.message);
    res.redirect(`${FRONTEND}/social?error=tiktok`);
  }
};

// Snapchat callback
const snapchatCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const info = decodeState(state);
    if (!info) return res.redirect(`${FRONTEND}/social?error=invalid_state`);

    const tokenData = await snapchat.exchangeCode(code);
    await saveAccount(info.workspaceId, 'snapchat', 'Snapchat Account', tokenData.sub || uuidv4(), {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });

    res.redirect(`${FRONTEND}/social?connected=snapchat`);
  } catch (err) {
    console.error('Snapchat callback error:', err.message);
    res.redirect(`${FRONTEND}/social?error=snapchat`);
  }
};

module.exports = { twitterCallback, youtubeCallback, facebookCallback, instagramCallback, tiktokCallback, snapchatCallback };
