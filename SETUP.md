# دليل الإعداد السريع

## المتطلبات
- Node.js 18+
- PostgreSQL 14+
- مفتاح OpenAI API

## خطوات التشغيل

### 1. إعداد قاعدة البيانات
```sql
CREATE DATABASE arabic_automation;
```

### 2. إعداد المتغيرات
```bash
cp backend/.env.example backend/.env
# عدّل backend/.env وأضف مفاتيح API
```

### 3. تثبيت التبعيات
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. تشغيل الهجرة
```bash
cd backend && npm run migrate
```

### 5. تشغيل المشروع
```bash
# نافذة 1
cd backend && npm run dev

# نافذة 2
cd frontend && npm run dev
```

### أو بـ Docker
```bash
docker-compose up --build
```

## الروابط
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## Webhook URLs للإعداد في Twilio/WhatsApp
- Twilio SMS: `https://yourdomain.com/api/integrations/twilio/sms`
- WhatsApp:   `https://yourdomain.com/api/integrations/whatsapp/webhook`
