# منصة الأتمتة الذكية — RPA Now

منصة SaaS عربية متكاملة لأتمتة الأعمال بالذكاء الاصطناعي، مع نظام جدولة محتوى مواقع التواصل الاجتماعي.

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
- رفع مقاطع وصور وجدولتها بتاريخ ووقت محدد
- دعم: YouTube · Instagram · Twitter/X · Facebook · TikTok · Snapchat
- إضافة وصف، هاشتاقات، بيانات المنشور
- نشر تلقائي كل دقيقة عبر Scheduler

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
│   │   └── migrate.js               # تشغيل الهجرة
│   └── modules/
│       ├── auth/                    # JWT + صلاحيات + multi-tenant
│       ├── automation/              # محرك الأتمتة + CRUD
│       ├── ai/                      # OpenAI: تحليل + بناء + NLP
│       ├── billing/                 # Stripe: اشتراكات + فوترة
│       ├── integrations/            # Twilio · WhatsApp · Gmail
│       ├── notifications/           # إشعارات داخلية
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
│       │   ├── Integrations.jsx     # ربط الخدمات
│       │   ├── Subscription.jsx     # خطط الاشتراك
│       │   └── Logs.jsx             # سجلات التشغيل
│       └── components/
│           ├── Sidebar.jsx
│           ├── Header.jsx
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

---

## التشغيل السريع

### المتطلبات
- Node.js 18+
- PostgreSQL 14+ أو حساب Supabase

### 1. إعداد البيئة
```bash
cp backend/.env.example backend/.env
# عدّل backend/.env وأضف:
# DATABASE_URL، OPENAI_API_KEY، وباقي المفاتيح
```

### 2. تثبيت التبعيات
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. تشغيل هجرة قاعدة البيانات
```bash
cd backend
npm run migrate
node -e "require('dotenv').config(); const fs=require('fs'); const {pool}=require('./config/database'); pool.query(fs.readFileSync('./database/social_schema.sql','utf8')).then(()=>{console.log('✅ Social tables created');pool.end();})"
```

### 4. تشغيل المشروع
```bash
# نافذة 1 — Backend
cd backend && npm run dev

# نافذة 2 — Frontend
cd frontend && npm run dev
```

### أو بـ Docker
```bash
docker-compose up --build
```

---

## الروابط

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
| `OPENAI_API_KEY` | مفتاح OpenAI |
| `TWILIO_*` | بيانات Twilio SMS |
| `WHATSAPP_*` | بيانات WhatsApp Cloud API |
| `STRIPE_*` | بيانات Stripe |
| `YOUTUBE_*` | بيانات YouTube Data API |
| `TWITTER_*` | بيانات Twitter API v2 |
| `FACEBOOK_*` | بيانات Meta Graph API |
| `TIKTOK_*` | بيانات TikTok API |

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

### Social Media
```
GET    /api/social/accounts
POST   /api/social/accounts
DELETE /api/social/accounts/:id
GET    /api/social/posts
POST   /api/social/posts
POST   /api/social/posts/bulk
PUT    /api/social/posts/:id
DELETE /api/social/posts/:id
POST   /api/social/upload
GET    /api/social/stats
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

**Backend:** Node.js · Express · PostgreSQL · JWT · OpenAI · Stripe · Twilio · node-cron · multer

**Frontend:** React 18 · Vite · Tailwind CSS · React Router · Recharts · Lucide Icons

**Infrastructure:** Docker · Nginx · Supabase
