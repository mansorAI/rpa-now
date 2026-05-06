const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BUSINESS_LABELS = {
  spare_parts: 'محل قطع غيار',
  clinic: 'عيادة طبية',
  restaurant: 'مطعم أو مقهى',
  real_estate: 'مكتب عقاري',
  warehouse: 'مستودع أو توزيع',
  retail: 'محل تجاري',
  services: 'مكتب خدمات',
  general: 'عمل تجاري عام',
};

async function generateBusinessSetup(answers) {
  const businessLabel = BUSINESS_LABELS[answers.business_type] || answers.business_type;

  const prompt = `أنت خبير متخصص في بناء أنظمة الأتمتة الذكية للأعمال التجارية العربية.

معلومات العمل:
- الاسم: ${answers.business_name}
- النوع: ${businessLabel}
- الوصف: ${answers.description || 'غير محدد'}
- عدد الموظفين: ${answers.team_size}
- قنوات التواصل مع العملاء: ${(answers.customer_channels || []).join('، ')}
- عدد العملاء اليومي: ${answers.daily_customers || 'غير محدد'}
- الأسئلة الشائعة من العملاء: ${answers.common_questions || 'غير محدد'}
- أكبر التحديات: ${(answers.challenges || []).join('، ')}
- أول هدف للأتمتة: ${answers.first_goal || 'غير محدد'}

المطلوب: أنشئ JSON فقط (بدون أي نص خارجه) بهذا الهيكل:
{
  "summary": "ملخص ذكي 2-3 جمل يشرح كيف سيتحول هذا العمل بالأتمتة",
  "chatbot_config": {
    "name": "اسم البوت المناسب (مثال: مساعد صيدلية الشفاء)",
    "personality": "وصف شخصية البوت بجملة واحدة",
    "greeting": "رسالة ترحيب احترافية ودافئة للعميل",
    "suggested_faqs": [
      {"question": "سؤال شائع يسأله العملاء", "answer": "الجواب المناسب"}
    ],
    "knowledge_categories": ["فئة1", "فئة2", "فئة3"]
  },
  "whatsapp_config": {
    "active_hours": "مثال: 8 صباحاً - 10 مساءً",
    "away_message": "رسالة خارج أوقات العمل",
    "welcome_message": "رسالة استقبال العميل لأول مرة",
    "escalation_keywords": ["كلمة1", "كلمة2"],
    "quick_replies": [
      {"title": "زر سريع", "content": "محتوى الزر"}
    ]
  },
  "team_structure": {
    "roles": [
      {"name": "اسم الدور", "key": "manager", "description": "مسؤولياته"},
      {"name": "اسم الدور", "key": "employee", "description": "مسؤولياته"}
    ]
  },
  "automations": [
    {
      "name": "اسم الأتمتة",
      "description": "ما الذي تفعله بدقة",
      "trigger": "ما الذي يطلقها",
      "actions": ["الإجراء الأول", "الإجراء الثاني"],
      "priority": "high",
      "impact": "التأثير المتوقع على العمل"
    }
  ],
  "dashboard_metrics": [
    {"label": "اسم المقياس", "key": "metric_key", "color": "blue", "icon": "Users"}
  ],
  "quick_wins": [
    {"title": "الإنجاز السريع", "description": "كيفية تطبيقه", "time": "5 دقائق", "impact": "high"}
  ],
  "knowledge_needed": [
    {"type": "excel", "description": "ما يجب رفعه", "example": "مثال على المحتوى"}
  ]
}

مهم: أنشئ 6-8 أتمتات مخصصة لهذا النوع من العمل تحديداً. كن عملياً وواقعياً.`;

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = res.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

module.exports = { generateBusinessSetup };
