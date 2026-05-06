# منصة الأتمتة الذكية — RPA Now

منصة SaaS عربية متكاملة لأتمتة الأعمال بالذكاء الاصطناعي، مع جدولة مواقع التواصل الاجتماعي وبوتات المحادثة الذكية.

## الروابط المباشرة

| الخدمة | الرابط |
|--------|--------|
| الواجهة (Vercel) | https://rpa-now.vercel.app |
| Backend API (Railway) | https://rpa-now-production.up.railway.app/api |
| GitHub | https://github.com/mansorAI/rpa-now |
| قاعدة البيانات | Supabase PostgreSQL |

---

## المميزات الرئيسية

### أتمتة الأعمال
- بناء أتمتات بالأزرار أو بالوصف العربي (AI)
- محرك أتمتة: Trigger → Condition → AI → Action
- دعم SMS، واتساب، بريد إلكتروني، Webhook، جدول زمني
- سجلات تفصيلية لكل تشغيل

### الذكاء الاصطناعي
- تحليل الرسائل العربية واستخراج البيانات المالية
- بناء أتمتة كاملة من جملة عربية واحدة
- مثال: *"إذا وصلتني رسالة SMS تحتوي مبلغاً أكثر من 300 ريال، سجّلها وأرسل إشعاراً"*

### جدولة مواقع التواصل
- ربط حسابات المنصات عبر OAuth (قراءة وكتابة لكل مستخدم)
- رفع مقاطع وصور وجدولتها بتاريخ ووقت محدد
- دعم: YouTube · Instagram · Twitter/X · Facebook · TikTok · Snapchat
- جدولة حتى 10 منشورات دفعة واحدة على عدة منصات
- تعديل وحذف المنشورات المجدولة
- نشر تلقائي كل دقيقة عبر Scheduler
- تصفية المنشورات حسب المنصة والحالة (مجدول / نُشر / فشل)

### بوت المحادثات (ChatBots)
- إنشاء بوتات ذكية لخدمة العملاء بالذكاء الاصطناعي (Claude)
- رفع ملفات قاعدة المعرفة: Excel · CSV · PDF · TXT
- بحث RAG: PostgreSQL full-text search + ILIKE fallback
- أنواع أعمال: قطع غيار · عيادة · مطعم · عقارات · عام
- محادثات متعددة مع تسجيل كامل للرسائل
- API عام بدون مصادقة لدمج البوت في أي موقع
- واجهة اختبار مباشر داخل لوحة التحكم

### التكاملات
- Twilio SMS
- WhatsApp Cloud API
- Gmail (OAuth2)
- Webhook مخصص

### الفوترة
- نظام اشتراكات Stripe
- ثلاث خطط: شخصية · أعمال · مؤسسات

---

## هيكل المشروع

```
RPA/
├── backend/
│   ├── server.js                    # نقطة الدخول
│   ├── config/
│   │   └── database.js              # اتصال PostgreSQL
│   ├── database/
│   │   ├── schema.sql               # جداول المشروع الأساسية
│   │   ├── social_schema.sql        # جداول مواقع التواصل
│   │   ├── rpa_schema.sql           # جداول RPA Business
│   │   ├── chatbot_schema.sql       # جداول بوت المحادثات
│   │   └── migrate.js               # تشغيل الهجرة
│   └── modules/
│       ├── auth/                    # JWT + صلاحيات + multi-tenant
│       ├── automation/              # محرك الأتمتة + CRUD
│       ├── ai/                      # Claude: تحليل + بناء + NLP
│       ├── billing/                 # Stripe: اشتراكات + فوترة
│       ├── integrations/            # Twilio · WhatsApp · Gmail
│       ├── notifications/           # إشعارات داخلية
│       ├── rpa/                     # RPA Business
│       │   ├── workflowEngine.js    # محرك تنفيذ سير العمل
│       │   ├── aiBuilder.js         # بناء أتمتة من نص عربي
│       │   ├── rpaController.js     # CRUD + analytics
│       │   └── rpaRoutes.js         # مسارات /api/rpa/*
│       ├── chatbot/                 # بوت المحادثات
│       │   ├── chatbotEngine.js     # RAG + Claude AI
│       │   ├── fileProcessor.js     # تحليل Excel/CSV/PDF/TXT
│       │   ├── chatbotController.js # CRUD + محادثات
│       │   └── chatbotRoutes.js     # مسارات /api/chatbots/*
│       └── social/
│           ├── platforms/           # YouTube · Twitter · Facebook · Instagram · TikTok · Snapchat
│           ├── scheduler.js         # جدولة تلقائية كل دقيقة
│           └── socialRoutes.js      # رفع ملفات حتى 500MB
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx        # لوحة التحكم + إحصائيات
│       │   ├── AutomationBuilder.jsx # بناء أتمتة بالأزرار أو AI
│       │   ├── Automations.jsx      # قائمة الأتمتات
│       │   ├── SocialScheduler.jsx  # جدولة مواقع التواصل
│       │   ├── RPABusiness.jsx      # RPA Business (7 تبويبات + بوت)
│       │   ├── Integrations.jsx     # ربط الخدمات
│       │   ├── Subscription.jsx     # خطط الاشتراك
│       │   └── Logs.jsx             # سجلات التشغيل
│       └── components/
│           ├── Sidebar.jsx
│           ├── Header.jsx
│           ├── ChatBotsTab.jsx      # واجهة بوت المحادثات
│           └── Layout.jsx
├── docker-compose.yml
└── start.ps1
```

---

## قاعدة البيانات

| الجدول | الوصف |
|--------|-------|
| `users` | المستخدمون |
| `workspaces` | مساحات العمل (multi-tenant) |
| `workspace_members` | أعضاء كل مساحة |
| `automations` | الأتمتات المحفوظة |
| `logs` | سجلات تشغيل الأتمتات |
| `subscriptions` | اشتراكات Stripe |
| `transactions` | سجل المدفوعات |
| `integrations` | بيانات التكاملات |
| `notifications` | الإشعارات الداخلية |
| `social_accounts` | حسابات مواقع التواصل |
| `social_posts` | المنشورات المجدولة |
| `social_media_files` | الملفات المرفوعة |
| `rpa_workflows` | سير عمل RPA Business |
| `rpa_executions` | سجلات تنفيذ سير العمل |
| `rpa_execution_steps` | خطوات كل تنفيذ |
| `rpa_templates` | قوالب جاهزة |
| `rpa_ai_suggestions` | اقتراحات الذكاء الاصطناعي |
| `chatbots` | بوتات المحادثة |
| `chatbot_knowledge` | قاعدة معرفة كل بوت (chunks) |
| `chatbot_conversations` | محادثات العملاء |
| `chatbot_messages` | رسائل كل محادثة |

---

## النشر (Production)

| الطبقة | المنصة | الرابط |
|--------|--------|--------|
| Frontend | Vercel | https://rpa-now.vercel.app |
| Backend | Railway | https://rpa-now-production.up.railway.app |
| Database | Supabase | PostgreSQL managed |

### متغيرات Vercel المطلوبة
```
VITE_API_URL=https://rpa-now-production.up.railway.app/api
```

---

## التشغيل المحلي

### المتطلبات
- Node.js 18+
- حساب Supabase (قاعدة البيانات)

### 1. إعداد البيئة
```bash
cp backend/.env.example backend/.env
# عدّل backend/.env وأضف DATABASE_URL وباقي المفاتيح
```

### 2. تثبيت التبعيات
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. تشغيل هجرة قاعدة البيانات
```bash
cd backend && npm run migrate
```

### 4. تشغيل المشروع
```bash
# نافذة 1 — Backend
cd backend && npm run dev

# نافذة 2 — Frontend
cd frontend && npm run dev
```

---

## الروابط المحلية (Development)

| الخدمة | الرابط |
|--------|--------|
| الواجهة الأمامية | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |

---

## متغيرات البيئة المطلوبة

| المتغير | الوصف |
|---------|-------|
| `DATABASE_URL` | رابط اتصال PostgreSQL |
| `JWT_SECRET` | مفتاح تشفير JWT |
| `ANTHROPIC_API_KEY` | مفتاح Claude AI (Anthropic) |
| `TWILIO_*` | بيانات Twilio SMS |
| `WHATSAPP_*` | بيانات WhatsApp Cloud API |
| `STRIPE_*` | بيانات Stripe |
| `YOUTUBE_*` | بيانات YouTube Data API |
| `TWITTER_*` | بيانات Twitter API v2 |
| `FACEBOOK_*` | بيانات Meta Graph API |
| `TIKTOK_CLIENT_KEY` | مفتاح TikTok API |
| `TIKTOK_CLIENT_SECRET` | سر TikTok API |
| `TIKTOK_REDIRECT_URI` | رابط callback لـ TikTok |

---

## Webhook URLs

| الخدمة | الرابط |
|--------|--------|
| Twilio SMS | `POST /api/integrations/twilio/sms` |
| WhatsApp Verify | `GET /api/integrations/whatsapp/webhook` |
| WhatsApp Messages | `POST /api/integrations/whatsapp/webhook` |
| Stripe Events | `POST /api/billing/webhook` |

---

## API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/change-password
```

### Automations
```
GET    /api/automations
POST   /api/automations
POST   /api/automations/natural-language
PUT    /api/automations/:id
DELETE /api/automations/:id
POST   /api/automations/:id/test
GET    /api/automations/logs
GET    /api/automations/stats
```

### AI
```
POST /api/ai/analyze
POST /api/ai/build-automation
POST /api/ai/suggest
POST /api/ai/nlp
```

### RPA Business
```
GET    /api/rpa/workflows
POST   /api/rpa/workflows
PUT    /api/rpa/workflows/:id
DELETE /api/rpa/workflows/:id
POST   /api/rpa/workflows/:id/run
GET    /api/rpa/executions
GET    /api/rpa/executions/:id
GET    /api/rpa/templates
POST   /api/rpa/templates/:id/use
GET    /api/rpa/ai/suggestions
PUT    /api/rpa/ai/suggestions/:id
POST   /api/rpa/ai/generate
GET    /api/rpa/analytics
```

### ChatBots (بوت المحادثات)
```
GET    /api/chatbots                         # قائمة البوتات
POST   /api/chatbots                         # إنشاء بوت
PUT    /api/chatbots/:id                     # تعديل بوت
DELETE /api/chatbots/:id                     # حذف بوت
GET    /api/chatbots/stats                   # إحصائيات

POST   /api/chatbots/knowledge/upload        # رفع ملف (Excel/CSV/PDF/TXT)
POST   /api/chatbots/knowledge/manual        # إضافة نص يدوي
GET    /api/chatbots/:id/knowledge           # قاعدة المعرفة
DELETE /api/chatbots/:id/knowledge           # حذف مصدر

GET    /api/chatbots/:id/conversations       # المحادثات
GET    /api/chatbots/conversations/:convId/messages  # رسائل محادثة

POST   /api/chatbots/conversations/start     # بدء محادثة
POST   /api/chatbots/conversations/:convId/message  # إرسال رسالة

POST   /api/chatbots/public/:botId           # ⚡ بدون مصادقة — للدمج الخارجي
```

### Social Media
```
GET    /api/social/accounts
GET    /api/social/accounts/:platform/auth-url   # OAuth URL للربط
DELETE /api/social/accounts/:id
GET    /api/social/posts
POST   /api/social/posts
POST   /api/social/posts/bulk
PUT    /api/social/posts/:id
DELETE /api/social/posts/:id
POST   /api/social/upload
GET    /api/social/stats

# OAuth Callbacks (بدون مصادقة)
GET    /api/social/auth/twitter/callback
GET    /api/social/auth/youtube/callback
GET    /api/social/auth/facebook/callback
GET    /api/social/auth/instagram/callback
GET    /api/social/auth/tiktok/callback
GET    /api/social/auth/snapchat/callback
```

### Billing
```
GET  /api/billing/plans
GET  /api/billing/subscription
POST /api/billing/checkout
POST /api/billing/portal
GET  /api/billing/transactions
```

---

## خطط الاشتراك

| الخطة | السعر | الأتمتات | التشغيلات | AI |
|-------|-------|----------|-----------|-----|
| شخصية | $29/شهر | 5 | 500 | ❌ |
| أعمال | $79/شهر | 50 | 10,000 | ✅ |
| مؤسسات | $199/شهر | ∞ | ∞ | ✅ |

---

## المنصات المدعومة للجدولة

| المنصة | فيديو | صورة | نص |
|--------|-------|------|-----|
| YouTube Shorts | ✅ | ❌ | ❌ |
| Instagram Reels | ✅ | ✅ | ❌ |
| Twitter/X | ✅ | ✅ | ✅ |
| Facebook | ✅ | ✅ | ✅ |
| TikTok | ✅ | ❌ | ❌ |
| Snapchat | ✅ | ✅ | ❌ |

---

## التقنيات المستخدمة

**Backend:** Node.js · Express · PostgreSQL · JWT · Anthropic (Claude) · Stripe · Twilio · node-cron · multer · xlsx · pdf-parse

**Frontend:** React 18 · Vite · Tailwind CSS · React Router · Recharts · Lucide Icons

**Infrastructure:** Docker · Nginx · Supabase · Vercel · Railway

---

## OAuth Redirect URIs (للضبط في كل منصة)

| المنصة | Redirect URI |
|--------|-------------|
| Twitter/X | `https://rpa-now-production.up.railway.app/api/social/auth/twitter/callback` |
| YouTube | `https://rpa-now-production.up.railway.app/api/social/accounts/youtube/callback` |
| Facebook | `https://rpa-now-production.up.railway.app/api/social/accounts/facebook/callback` |
| Instagram | `https://rpa-now-production.up.railway.app/api/social/accounts/instagram/callback` |
| TikTok | `https://rpa-now-production.up.railway.app/api/social/accounts/tiktok/callback` |
| Snapchat | `https://rpa-now-production.up.railway.app/api/social/accounts/snapchat/callback` |

---

## التغييرات الأخيرة

- **بوت المحادثات** — وحدة كاملة لبناء بوتات خدمة العملاء بالذكاء الاصطناعي (RAG + Claude)
- **RPA Business** — وحدة أتمتة متكاملة مع 8 تبويبات ومحرك تنفيذ + AI builder
- **Anthropic Claude** — استبدال OpenAI بـ Claude (Haiku) في جميع وظائف الذكاء الاصطناعي
- **TikTok API** — إنشاء تطبيق TikTok Developer وربط Login Kit + Content Posting API
- **صفحة Privacy Policy** — `https://rpa-now.vercel.app/privacy`
- **صفحة Terms of Service** — `https://rpa-now.vercel.app/terms`
- **روابط السياسات** — مضافة في صفحة تسجيل الدخول
- **TikTok App Review** — تم التقديم للمراجعة (قيد الانتظار)
- **OAuth كامل** لجميع المنصات الستة (قراءة + كتابة)
- **إصلاح Twitter 401** — fallback تلقائي من OAuth 2.0 إلى OAuth 1.0a

---

## TikTok Integration Status

| العنصر | الحالة |
|--------|--------|
| App Created | ✅ |
| Login Kit | ✅ مضاف |
| Content Posting API | ✅ مضاف |
| Redirect URI | ✅ `https://rpa-now-production.up.railway.app/api/social/accounts/tiktok/callback` |
| Domain Verified | ✅ `https://rpa-now.vercel.app/` |
| App Review | ⏳ قيد المراجعة |
| Client Key in Railway | ✅ |
