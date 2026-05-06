const { pool } = require('../../config/database');
const { chat } = require('../chatbot/chatbotEngine');
const { logAudit } = require('../business/businessController');

function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  return require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// ── Webhook (Twilio sends incoming WhatsApp messages here) ────────────────────

exports.webhook = async (req, res) => {
  res.status(200).set('Content-Type', 'text/xml').send('<Response></Response>');

  try {
    const { Body, From, To } = req.body;
    if (!Body || !From) return;

    const customerPhone = From.replace('whatsapp:', '');
    const botPhone = To.replace('whatsapp:', '');

    const botRes = await pool.query(
      `SELECT wb.*, c.id as chatbot_id, c.workspace_id,
              bp.ai_config
       FROM whatsapp_bots wb
       JOIN chatbots c ON c.id = wb.chatbot_id
       LEFT JOIN business_profiles bp ON bp.workspace_id = c.workspace_id
       WHERE wb.phone_number=$1 AND wb.is_active=true
       LIMIT 1`,
      [botPhone]
    );
    if (!botRes.rows.length) return;

    const bot = botRes.rows[0];
    const waConfig = bot.config || {};
    const aiConfig = bot.ai_config || {};
    const waAI = aiConfig.whatsapp_config || {};

    // Check business hours
    const now = new Date();
    const hour = now.getHours();
    const activeStr = waConfig.active_hours || waAI.active_hours || '8-22';
    const [startH, endH] = parseHours(activeStr);
    if (hour < startH || hour >= endH) {
      const awayMsg = waConfig.away_message || waAI.away_message
        || 'شكراً لتواصلك! سنرد عليك خلال أوقات العمل.';
      await sendMessage(botPhone, customerPhone, awayMsg);
      return;
    }

    // Escalation check
    const escalationWords = waConfig.escalation_keywords || waAI.escalation_keywords || [];
    if (escalationWords.some(w => Body.toLowerCase().includes(w.toLowerCase()))) {
      await sendMessage(botPhone, customerPhone,
        'سيتواصل معك أحد موظفينا في أقرب وقت. شكراً لصبرك.');
      return;
    }

    // Find or create conversation
    let convId;
    const convRes = await pool.query(
      `SELECT id FROM chatbot_conversations
       WHERE chatbot_id=$1 AND customer_phone=$2 AND channel='whatsapp' AND status='active'
       ORDER BY updated_at DESC LIMIT 1`,
      [bot.chatbot_id, customerPhone]
    );

    if (convRes.rows.length) {
      convId = convRes.rows[0].id;
    } else {
      const newConv = await pool.query(
        `INSERT INTO chatbot_conversations (chatbot_id, customer_phone, channel)
         VALUES ($1,$2,'whatsapp') RETURNING id`,
        [bot.chatbot_id, customerPhone]
      );
      convId = newConv.rows[0].id;

      const welcome = waConfig.welcome_message || waAI.welcome_message;
      if (welcome) await sendMessage(botPhone, customerPhone, welcome);
    }

    const result = await chat(bot.chatbot_id, convId, Body);
    await sendMessage(botPhone, customerPhone, result.reply);

  } catch (err) {
    console.error('WhatsApp webhook error:', err.message);
  }
};

function parseHours(str) {
  const match = str.match(/(\d+)[^-]*-\s*(\d+)/);
  if (match) return [parseInt(match[1]), parseInt(match[2])];
  return [8, 22];
}

async function sendMessage(fromNumber, toPhone, body) {
  const client = getTwilioClient();
  if (!client) return;
  await client.messages.create({
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${toPhone}`,
    body,
  });
}

// ── WhatsApp Bot Management ───────────────────────────────────────────────────

exports.getBots = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT wb.*, c.name as chatbot_name
       FROM whatsapp_bots wb
       LEFT JOIN chatbots c ON c.id = wb.chatbot_id
       WHERE wb.workspace_id=$1 ORDER BY wb.created_at DESC`,
      [req.workspace.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createBot = async (req, res) => {
  try {
    const { chatbot_id, phone_number, config } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO whatsapp_bots (workspace_id, chatbot_id, phone_number, config)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.workspace.id, chatbot_id, phone_number, JSON.stringify(config || {})]
    );
    await logAudit(req.workspace.id, req.user.id, req.user.full_name,
      'created_whatsapp_bot', 'whatsapp_bot', phone_number, {});
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBot = async (req, res) => {
  try {
    const { chatbot_id, config, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE whatsapp_bots SET chatbot_id=$1, config=$2, is_active=$3
       WHERE id=$4 AND workspace_id=$5 RETURNING *`,
      [chatbot_id, JSON.stringify(config || {}), is_active, req.params.id, req.workspace.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBot = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM whatsapp_bots WHERE id=$1 AND workspace_id=$2',
      [req.params.id, req.workspace.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, b.name as bot_name,
              (SELECT content FROM chatbot_messages
               WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT COUNT(*) FROM chatbot_messages WHERE conversation_id=c.id) as msg_count
       FROM chatbot_conversations c
       JOIN chatbots b ON b.id = c.chatbot_id
       WHERE b.workspace_id=$1 AND c.channel='whatsapp'
       ORDER BY c.updated_at DESC LIMIT 50`,
      [req.workspace.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
