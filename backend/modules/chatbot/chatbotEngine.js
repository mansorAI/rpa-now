const { pool } = require('../../config/database');
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BUSINESS_PROMPTS = {
  spare_parts: 'أنت مساعد متخصص في قطع الغيار. تساعد الزبائن في البحث عن القطع المتوفرة وأسعارها وتوافرها. أجب بدقة من البيانات المتوفرة.',
  clinic: 'أنت مساعد عيادة طبية. تساعد المرضى في حجز المواعيد والاستفسار عن الخدمات والأطباء وأوقات العمل. أجب باحترافية.',
  restaurant: 'أنت مساعد مطعم. تساعد الزبائن في الاطلاع على القائمة والأسعار وساعات العمل وإمكانية الحجز. كن ودوداً ومرحباً.',
  real_estate: 'أنت وكيل عقاري ذكي. تساعد العملاء في البحث عن العقارات المتاحة وأسعارها ومواصفاتها.',
  general: 'أنت مساعد ذكي لخدمة العملاء. أجب بدقة واحترافية بناءً على المعلومات المتاحة.',
  custom: '',
};

async function searchKnowledge(chatbotId, query) {
  try {
    // Try full-text search first
    const { rows } = await pool.query(
      `SELECT chunk_text, source_name, metadata
       FROM chatbot_knowledge
       WHERE chatbot_id = $1
         AND to_tsvector('simple', chunk_text) @@ plainto_tsquery('simple', $2)
       ORDER BY ts_rank(to_tsvector('simple', chunk_text), plainto_tsquery('simple', $2)) DESC
       LIMIT 8`,
      [chatbotId, query]
    );

    if (rows.length >= 3) return rows;

    // Fallback: ILIKE search
    const words = query.split(/\s+/).filter(w => w.length > 2);
    if (!words.length) return rows;

    const conditions = words.map((w, i) => `chunk_text ILIKE $${i + 3}`).join(' OR ');
    const { rows: likeRows } = await pool.query(
      `SELECT chunk_text, source_name, metadata
       FROM chatbot_knowledge
       WHERE chatbot_id = $1
         AND (${conditions})
       LIMIT 8`,
      [chatbotId, query, ...words.map(w => `%${w}%`)]
    );

    const combined = [...rows, ...likeRows];
    const unique = combined.filter((r, i, arr) => arr.findIndex(x => x.chunk_text === r.chunk_text) === i);
    return unique.slice(0, 8);
  } catch {
    const { rows } = await pool.query(
      `SELECT chunk_text, source_name FROM chatbot_knowledge WHERE chatbot_id=$1 LIMIT 6`,
      [chatbotId]
    );
    return rows;
  }
}

async function chat(chatbotId, conversationId, userMessage) {
  const client = await pool.connect();
  try {
    const [botRes, historyRes] = await Promise.all([
      client.query('SELECT * FROM chatbots WHERE id=$1', [chatbotId]),
      client.query(
        'SELECT role, content FROM chatbot_messages WHERE conversation_id=$1 ORDER BY created_at DESC LIMIT 10',
        [conversationId]
      ),
    ]);

    if (!botRes.rows.length) throw new Error('Bot not found');
    const bot = botRes.rows[0];

    // Save user message
    await client.query(
      'INSERT INTO chatbot_messages (conversation_id, role, content) VALUES ($1,$2,$3)',
      [conversationId, 'user', userMessage]
    );

    // Search relevant knowledge
    const knowledge = await searchKnowledge(chatbotId, userMessage);
    const context = knowledge.length
      ? `\n\n📚 البيانات المتاحة:\n${knowledge.map(k => k.chunk_text).join('\n---\n')}`
      : '';

    const basePrompt = BUSINESS_PROMPTS[bot.business_type] || BUSINESS_PROMPTS.general;
    const systemPrompt = `${basePrompt}
${bot.personality ? `\nأسلوبك: ${bot.personality}` : ''}
${bot.allow_appointments ? '\nيمكنك مساعدة العميل في حجز مواعيد.' : ''}
${context}

مهم: أجب فقط بناءً على البيانات المتاحة. إذا لم تجد المعلومة قل بوضوح أنها غير متوفرة.
أجب باللغة التي يتحدث بها العميل.`;

    // Build messages history
    const history = historyRes.rows.reverse().map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: userMessage });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: history,
    });

    const reply = response.content[0].text;

    // Save assistant reply
    await client.query(
      'INSERT INTO chatbot_messages (conversation_id, role, content) VALUES ($1,$2,$3)',
      [conversationId, 'assistant', reply]
    );

    // Update counters
    await Promise.all([
      client.query('UPDATE chatbot_conversations SET message_count=message_count+2, updated_at=NOW() WHERE id=$1', [conversationId]),
      client.query('UPDATE chatbots SET message_count=message_count+1 WHERE id=$1', [chatbotId]),
    ]);

    return { reply, sources: knowledge.map(k => k.source_name).filter((v, i, a) => a.indexOf(v) === i) };
  } finally {
    client.release();
  }
}

module.exports = { chat, searchKnowledge };
