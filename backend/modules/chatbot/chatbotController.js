const { pool } = require('../../config/database');
const { processFile } = require('./fileProcessor');
const { chat } = require('./chatbotEngine');
const fs = require('fs');

// ── Bots ─────────────────────────────────────────────────────────────────────

exports.getBots = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, COUNT(DISTINCT k.id) as knowledge_count, COUNT(DISTINCT c.id) as conversation_count
       FROM chatbots b
       LEFT JOIN chatbot_knowledge k ON k.chatbot_id = b.id
       LEFT JOIN chatbot_conversations c ON c.chatbot_id = b.id
       WHERE b.workspace_id=$1
       GROUP BY b.id ORDER BY b.created_at DESC`,
      [req.workspace.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createBot = async (req, res) => {
  try {
    const { name, business_type, description, greeting, personality, language, allow_appointments } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO chatbots (workspace_id, name, business_type, description, greeting, personality, language, allow_appointments, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.workspace.id, name, business_type || 'general', description,
       greeting || 'مرحباً! كيف يمكنني مساعدتك؟',
       personality || 'مساعد ذكي ومهذب',
       language || 'ar', allow_appointments || false, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateBot = async (req, res) => {
  try {
    const fields = ['name', 'business_type', 'description', 'greeting', 'personality', 'language', 'is_active', 'allow_appointments'];
    const updates = [];
    const params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        params.push(req.body[f]);
        updates.push(`${f}=$${params.length}`);
      }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields' });
    params.push(new Date(), req.params.id, req.workspace.id);
    const { rows } = await pool.query(
      `UPDATE chatbots SET ${updates.join(',')}, updated_at=$${params.length - 2}
       WHERE id=$${params.length - 1} AND workspace_id=$${params.length} RETURNING *`,
      params
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteBot = async (req, res) => {
  try {
    await pool.query('DELETE FROM chatbots WHERE id=$1 AND workspace_id=$2', [req.params.id, req.workspace.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Knowledge / Files ─────────────────────────────────────────────────────────

exports.uploadKnowledge = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'لم يتم رفع ملف' });

  try {
    const { chatbot_id } = req.body;

    // Verify bot belongs to workspace
    const { rows: botRows } = await pool.query(
      'SELECT id FROM chatbots WHERE id=$1 AND workspace_id=$2',
      [chatbot_id, req.workspace.id]
    );
    if (!botRows.length) return res.status(404).json({ error: 'البوت غير موجود' });

    const chunks = await processFile(file.path, file.originalname);

    if (!chunks.length) return res.status(400).json({ error: 'لم يتم استخراج أي بيانات من الملف' });

    // Insert chunks in batches
    const values = chunks.map((c, i) => `($1, $2, $3, $4, $${i * 3 + 5}, $${i * 3 + 6}, $${i * 3 + 7})`);
    const flatParams = [chatbot_id, c => c.source_name, c => c.source_type];

    // Use simple loop for clarity
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const chunk of chunks) {
        await client.query(
          'INSERT INTO chatbot_knowledge (chatbot_id, source_name, source_type, chunk_text, chunk_index, metadata) VALUES ($1,$2,$3,$4,$5,$6)',
          [chatbot_id, chunk.source_name, chunk.source_type, chunk.chunk_text, chunk.chunk_index, JSON.stringify(chunk.metadata)]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // Clean up file
    try { fs.unlinkSync(file.path); } catch {}

    res.json({ success: true, chunks_added: chunks.length, source: file.originalname });
  } catch (err) {
    try { fs.unlinkSync(file.path); } catch {}
    res.status(500).json({ error: err.message });
  }
};

exports.addManualKnowledge = async (req, res) => {
  try {
    const { chatbot_id, text, source_name } = req.body;
    const { rows: botRows } = await pool.query(
      'SELECT id FROM chatbots WHERE id=$1 AND workspace_id=$2',
      [chatbot_id, req.workspace.id]
    );
    if (!botRows.length) return res.status(404).json({ error: 'البوت غير موجود' });

    const { rows } = await pool.query(
      'INSERT INTO chatbot_knowledge (chatbot_id, source_name, source_type, chunk_text, chunk_index) VALUES ($1,$2,$3,$4,0) RETURNING *',
      [chatbot_id, source_name || 'إدخال يدوي', 'manual', text]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getKnowledge = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT source_name, source_type, COUNT(*) as chunks, MAX(created_at) as uploaded_at
       FROM chatbot_knowledge WHERE chatbot_id=$1
       GROUP BY source_name, source_type ORDER BY uploaded_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteKnowledge = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM chatbot_knowledge WHERE chatbot_id=$1 AND source_name=$2',
      [req.params.id, req.query.source]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Conversations ─────────────────────────────────────────────────────────────

exports.getConversations = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, m.content as last_message
       FROM chatbot_conversations c
       LEFT JOIN LATERAL (
         SELECT content FROM chatbot_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1
       ) m ON true
       WHERE c.chatbot_id=$1 ORDER BY c.updated_at DESC LIMIT 50`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMessages = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM chatbot_messages WHERE conversation_id=$1 ORDER BY created_at',
      [req.params.convId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Chat (test + public) ──────────────────────────────────────────────────────

exports.startConversation = async (req, res) => {
  try {
    const { chatbot_id, customer_name, customer_phone, channel } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO chatbot_conversations (chatbot_id, customer_name, customer_phone, channel) VALUES ($1,$2,$3,$4) RETURNING *',
      [chatbot_id, customer_name || 'زبون', customer_phone || null, channel || 'web']
    );

    const bot = await pool.query('SELECT greeting FROM chatbots WHERE id=$1', [chatbot_id]);
    const greeting = bot.rows[0]?.greeting || 'مرحباً! كيف يمكنني مساعدتك؟';

    await pool.query(
      'INSERT INTO chatbot_messages (conversation_id, role, content) VALUES ($1,$2,$3)',
      [rows[0].id, 'assistant', greeting]
    );

    res.json({ conversation: rows[0], greeting });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { convId } = req.params;

    const { rows } = await pool.query(
      'SELECT chatbot_id FROM chatbot_conversations WHERE id=$1',
      [convId]
    );
    if (!rows.length) return res.status(404).json({ error: 'المحادثة غير موجودة' });

    const result = await chat(rows[0].chatbot_id, convId, message);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Public endpoint (no auth) ─────────────────────────────────────────────────

exports.publicChat = async (req, res) => {
  try {
    const { botId } = req.params;
    const { message, conversation_id, customer_name } = req.body;

    let convId = conversation_id;
    if (!convId) {
      const { rows } = await pool.query(
        'INSERT INTO chatbot_conversations (chatbot_id, customer_name, channel) VALUES ($1,$2,$3) RETURNING id',
        [botId, customer_name || 'زبون', 'api']
      );
      convId = rows[0].id;
    }

    const result = await chat(botId, convId, message);
    res.json({ ...result, conversation_id: convId });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT b.id) as total_bots,
              SUM(b.message_count) as total_messages,
              COUNT(DISTINCT c.id) as total_conversations
       FROM chatbots b
       LEFT JOIN chatbot_conversations c ON c.chatbot_id=b.id
       WHERE b.workspace_id=$1`,
      [req.workspace.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
