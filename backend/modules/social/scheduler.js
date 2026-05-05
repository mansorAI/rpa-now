const cron = require('node-cron');
const { query } = require('../../config/database');
const youtube = require('./platforms/youtube');
const twitter = require('./platforms/twitter');
const facebook = require('./platforms/facebook');
const instagram = require('./platforms/instagram');
const tiktok = require('./platforms/tiktok');
const snapchat = require('./platforms/snapchat');
const path = require('path');

const publishPost = async (post) => {
  const { rows: accounts } = await query(
    'SELECT * FROM social_accounts WHERE id = $1',
    [post.social_account_id]
  );
  const account = accounts[0];
  if (!account) throw new Error('الحساب غير موجود');

  const filePath = post.media_path ? path.join(__dirname, '../../../uploads', post.media_path) : null;
  const params = {
    credentials: account.credentials,
    filePath,
    mediaUrl: post.media_url,
    title: post.title,
    description: post.description,
    caption: post.description,
    text: post.description,
    hashtags: post.hashtags || [],
    isShort: post.metadata?.is_short || false,
    mediaType: post.post_type,
  };

  switch (post.platform) {
    case 'youtube':   return youtube.uploadVideo(params);
    case 'twitter':   return twitter.postTweet(params);
    case 'facebook':  return facebook.postToPage(params);
    case 'instagram': return post.post_type === 'video'
      ? instagram.publishReel(params)
      : instagram.publishPhoto(params);
    case 'tiktok':    return tiktok.uploadVideo(params);
    case 'snapchat':  return snapchat.uploadStory(params);
    default: throw new Error(`منصة غير مدعومة: ${post.platform}`);
  }
};

const processDuePosts = async () => {
  const { rows: duePosts } = await query(
    `SELECT * FROM social_posts
     WHERE status = 'scheduled' AND scheduled_at <= NOW()
     ORDER BY scheduled_at ASC LIMIT 10`
  );

  if (duePosts.length === 0) return;

  console.log(`[Scheduler] معالجة ${duePosts.length} منشور...`);

  for (const post of duePosts) {
    await query('UPDATE social_posts SET status = $1 WHERE id = $2', ['publishing', post.id]);

    try {
      const result = await publishPost(post);

      await query(
        `UPDATE social_posts SET status = 'posted', posted_at = NOW(), platform_post_id = $1 WHERE id = $2`,
        [result.platform_post_id, post.id]
      );

      await query(
        'UPDATE social_accounts SET updated_at = NOW() WHERE id = $1',
        [post.social_account_id]
      );

      console.log(`[Scheduler] ✅ نُشر: ${post.title} على ${post.platform}`);
    } catch (err) {
      await query(
        `UPDATE social_posts SET status = 'failed', error_message = $1 WHERE id = $2`,
        [err.message, post.id]
      );
      console.error(`[Scheduler] ❌ فشل: ${post.title} — ${err.message}`);
    }
  }
};

const startScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', processDuePosts);
  console.log('📅 جدولة المنشورات نشطة — تعمل كل دقيقة');
};

module.exports = { startScheduler, processDuePosts };
