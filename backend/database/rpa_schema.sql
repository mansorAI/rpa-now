-- RPA Business Module Schema

-- Workflow definitions
CREATE TABLE IF NOT EXISTS rpa_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft | active | paused | archived
  trigger_type VARCHAR(100), -- manual | schedule | webhook | event
  trigger_config JSONB DEFAULT '{}',
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  ai_generated BOOLEAN DEFAULT false,
  ai_optimized BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Execution instances
CREATE TABLE IF NOT EXISTS rpa_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES rpa_workflows(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'running', -- running | completed | failed | cancelled
  triggered_by VARCHAR(100), -- manual | schedule | webhook | ai
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  ai_diagnosis TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER
);

-- Individual step executions
CREATE TABLE IF NOT EXISTS rpa_execution_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID REFERENCES rpa_executions(id) ON DELETE CASCADE,
  node_id VARCHAR(255) NOT NULL,
  node_type VARCHAR(100) NOT NULL,
  node_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending | running | completed | failed | skipped
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  actor VARCHAR(100), -- ai | user | system
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  step_order INTEGER DEFAULT 0
);

-- Workflow templates
CREATE TABLE IF NOT EXISTS rpa_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- hr | finance | operations | reporting | custom
  tags TEXT[] DEFAULT '{}',
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  trigger_type VARCHAR(100),
  trigger_config JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI suggestions
CREATE TABLE IF NOT EXISTS rpa_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  type VARCHAR(100), -- new_automation | optimization | error_fix
  title VARCHAR(255),
  description TEXT,
  workflow_id UUID REFERENCES rpa_workflows(id) ON DELETE SET NULL,
  suggested_config JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending', -- pending | accepted | dismissed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rpa_workflows_workspace ON rpa_workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_rpa_executions_workflow ON rpa_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_rpa_executions_workspace ON rpa_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_rpa_execution_steps_execution ON rpa_execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_rpa_suggestions_workspace ON rpa_ai_suggestions(workspace_id);
