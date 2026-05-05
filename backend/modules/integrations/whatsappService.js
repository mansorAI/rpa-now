const axios = require('axios');

const WA_API_URL = 'https://graph.facebook.com/v18.0';

const sendMessage = async (to, message) => {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneId || !token) throw new Error('بيانات WhatsApp غير مكتملة');

  const response = await axios.post(
    `${WA_API_URL}/${phoneId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/[^0-9]/g, ''),
      type: 'text',
      text: { preview_url: false, body: message },
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return { id: response.data.messages[0].id };
};

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
};

const handleWebhook = async (req, res) => {
  const body = req.body;
  const { query } = require('../../config/database');
  const automationEngine = require('../automation/automationEngine');

  if (body.object === 'whatsapp_business_account') {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages || [];
        for (const msg of messages) {
          const text = msg.text?.body || '';
          const from = msg.from;

          const { rows: automations } = await query(
            `SELECT * FROM automations WHERE trigger_type = 'whatsapp' AND is_active = true`
          );

          for (const automation of automations) {
            automationEngine.execute(automation, { message: text, from, type: 'whatsapp' }).catch(console.error);
          }
        }
      }
    }
  }

  res.sendStatus(200);
};

module.exports = { sendMessage, verifyWebhook, handleWebhook };
