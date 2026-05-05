const twilio = require('twilio');

const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('بيانات Twilio غير مكتملة');
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const sendSMS = async (to, message) => {
  const client = getClient();
  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
  return { sid: result.sid, status: result.status };
};

const handleIncomingSMS = async (req, res) => {
  const { Body: message, From: from, To: to } = req.body;
  const { query } = require('../../config/database');
  const automationEngine = require('../automation/automationEngine');

  const { rows: automations } = await query(
    `SELECT * FROM automations
     WHERE trigger_type = 'sms' AND is_active = true
     AND trigger_config->>'phone' = $1 OR trigger_config->>'phone' IS NULL`,
    [to]
  );

  for (const automation of automations) {
    automationEngine.execute(automation, { message, from, to, type: 'sms' }).catch(console.error);
  }

  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');
};

module.exports = { sendSMS, handleIncomingSMS };
