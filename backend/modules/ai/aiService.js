const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const analyzeMessage = async (message, customPrompt = '') => {
  const systemPrompt = `أنت محلل ذكي للرسائل العربية والإنجليزية. استخرج المعلومات المالية والمهمة من الرسائل.

قم دائماً بإرجاع JSON فقط بهذا الهيكل:
{
  "amount": null أو رقم المبلغ,
  "currency": "SAR" أو "USD" أو غيرها,
  "category": "فاتورة" أو "دفعة" أو "تحويل" أو "مصروف" أو "دخل" أو "أخرى",
  "sender": اسم المرسل أو الجهة,
  "intent": وصف مختصر للرسالة,
  "is_financial": true/false,
  "urgency": "عالية" أو "متوسطة" أو "منخفضة",
  "keywords": []
}

${customPrompt ? `تعليمات إضافية: ${customPrompt}` : ''}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content);
};

const buildAutomationFromText = async (arabicPrompt) => {
  const systemPrompt = `أنت مساعد لبناء أتمتة الأعمال. حول الوصف العربي إلى هيكل JSON للأتمتة.

أنواع المشغلات (trigger_type): sms | whatsapp | email | schedule | webhook
أنواع الإجراءات (action.type): send_sms | send_whatsapp | send_email | store_transaction | send_notification | webhook
عوامل الشروط (operator): equals | greater_than | less_than | contains | exists

أرجع JSON فقط بهذا الهيكل:
{
  "name": "اسم الأتمتة",
  "description": "وصف مختصر",
  "trigger_type": "...",
  "trigger_config": {},
  "conditions": [{"field": "...", "operator": "...", "value": "..."}],
  "actions": [{"type": "...", "config": {}}]
}

مثال على شروط المبلغ: field = "ai.amount", operator = "greater_than", value = "300"
مثال على إجراء التخزين: type = "store_transaction", config = {"description": "مصروف"}
مثال على إرسال إشعار: type = "send_notification", config = {"title": "تنبيه", "message": "{{ai.intent}}"}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: arabicPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content);
};

const suggestAutomations = async (workspaceContext) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'أنت مستشار أتمتة أعمال. اقترح 5 أتمتات مفيدة بالعربية بناءً على السياق المعطى.',
      },
      {
        role: 'user',
        content: `اقترح أتمتات مناسبة لهذا السياق: ${JSON.stringify(workspaceContext)}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });

  return response.choices[0].message.content;
};

const processNLP = async (text) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'حلل النص وأرجع: الكيانات المسماة، المشاعر، الكلمات المفتاحية، ملخص. JSON فقط.',
      },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = { analyzeMessage, buildAutomationFromText, suggestAutomations, processNLP };
