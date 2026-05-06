require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function migrate() {
  const schemas = ['schema.sql', 'social_schema.sql', 'rpa_schema.sql', 'chatbot_schema.sql', 'business_schema.sql'];
  try {
    for (const file of schemas) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        await pool.query(sql);
        console.log(`✅ ${file} migrated`);
      }
    }
    console.log('✅ All migrations completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
