-- Social Media Scheduler Tables

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,  -- youtube | instagram | twitter | facebook | tiktok | snapchat
  account_name VARCHAR(255),
  account_id VARCHAR(255),
  credentials JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  post_type VARCHAR(50) DEFAULT 'video',  -- video | image | text
  title VARCHAR(500),
  description TEXT,
  hashtags TEXT[],
  media_url TEXT,
  media_path TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  posted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'scheduled',  -- scheduled | posted | failed | cancelled
  platform_post_id VARCHAR(255),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  duration INTEGER,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_workspace ON social_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace ON social_accounts(workspace_id);
