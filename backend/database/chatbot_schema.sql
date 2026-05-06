-- Chatbot Module Schema

CREATE TABLE IF NOT EXISTS chatbots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100), -- spare_parts | clinic | restaurant | real_estate | general | custom
  description TEXT,
  greeting TEXT DEFAULT 'مرحباً! كيف يمكنني مساعدتك؟',
  personality TEXT DEFAULT 'مساعد ذكي ومهذب يجيب بدقة بناءً على المعلومات المتاحة',
  language VARCHAR(10) DEFAULT 'ar',
  is_active BOOLEAN DEFAULT true,
  allow_appointments BOOLEAN DEFAULT false,
  appointment_config JSONB DEFAULT '{}',
  message_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge base (chunks from uploaded files)
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  source_name VARCHAR(255),
  source_type VARCHAR(50), -- excel | csv | pdf | text | manual
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  channel VARCHAR(50) DEFAULT 'web', -- web | whatsapp | api
  status VARCHAR(50) DEFAULT 'active',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- user | assistant
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_bot ON chatbot_knowledge(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_convs_bot ON chatbot_conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conv ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_workspace ON chatbots(workspace_id);

-- Full text search on knowledge
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_text ON chatbot_knowledge USING gin(to_tsvector('arabic', chunk_text));
