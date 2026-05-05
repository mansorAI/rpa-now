require('dotenv').config();
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function run() {
  const { rows: workspaces } = await query('SELECT id FROM workspaces LIMIT 1');
  if (!workspaces[0]) { console.log('لا توجد مساحة عمل'); process.exit(1); }

  const creds = {
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  };

  await query(
    `INSERT INTO social_accounts (id, workspace_id, platform, account_name, account_id, credentials)
     VALUES ($1, $2, 'twitter', '@MansorAird', '1790493982637674496', $3)`,
    [uuidv4(), workspaces[0].id, JSON.stringify(creds)]
  );

  console.log('✅ تم إضافة حساب @MansorAird بنجاح');
  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
