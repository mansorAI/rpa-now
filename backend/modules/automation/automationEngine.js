const { query } = require('../../config/database');
const aiService = require('../ai/aiService');
const twilioService = require('../integrations/twilioService');
const whatsappService = require('../integrations/whatsappService');
const gmailService = require('../integrations/gmailService');
const notificationService = require('../notifications/notificationService');

class AutomationEngine {
  async execute(automation, triggerData) {
    const startTime = Date.now();
    let status = 'success';
    let aiAnalysis = {};
    const actionsExecuted = [];
    let errorMessage = null;

    try {
      // Step 1: AI Analysis if enabled
      if (automation.ai_enabled && automation.ai_prompt) {
        aiAnalysis = await aiService.analyzeMessage(
          triggerData.message || JSON.stringify(triggerData),
          automation.ai_prompt
        );
        triggerData = { ...triggerData, ai: aiAnalysis };
      }

      // Step 2: Evaluate conditions
      const conditionsMet = this.evaluateConditions(automation.conditions, triggerData);
      if (!conditionsMet) {
        return { status: 'skipped', reason: 'الشروط لم تتحقق' };
      }

      // Step 3: Execute actions
      for (const action of automation.actions) {
        const result = await this.executeAction(action, triggerData, automation.workspace_id);
        actionsExecuted.push({ type: action.type, result, timestamp: new Date() });
      }

      // Step 4: Update run count
      await query(
        'UPDATE automations SET run_count = run_count + 1, last_run_at = NOW() WHERE id = $1',
        [automation.id]
      );

    } catch (err) {
      status = 'failed';
      errorMessage = err.message;
      console.error(`[Engine] Automation ${automation.id} failed:`, err);
    }

    const executionTime = Date.now() - startTime;

    // Log execution
    await query(
      `INSERT INTO logs (automation_id, workspace_id, status, trigger_data, ai_analysis, actions_executed, error_message, execution_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        automation.id,
        automation.workspace_id,
        status,
        JSON.stringify(triggerData),
        JSON.stringify(aiAnalysis),
        JSON.stringify(actionsExecuted),
        errorMessage,
        executionTime,
      ]
    );

    return { status, actionsExecuted, aiAnalysis, executionTime };
  }

  evaluateConditions(conditions, data) {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every((condition) => {
      const value = this.getNestedValue(data, condition.field);
      switch (condition.operator) {
        case 'equals':        return String(value) === String(condition.value);
        case 'not_equals':    return String(value) !== String(condition.value);
        case 'contains':      return String(value).includes(condition.value);
        case 'not_contains':  return !String(value).includes(condition.value);
        case 'greater_than':  return Number(value) > Number(condition.value);
        case 'less_than':     return Number(value) < Number(condition.value);
        case 'starts_with':   return String(value).startsWith(condition.value);
        case 'exists':        return value !== undefined && value !== null;
        default:              return true;
      }
    });
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  async executeAction(action, data, workspaceId) {
    switch (action.type) {
      case 'send_sms':
        return twilioService.sendSMS(
          this.interpolate(action.config.to, data),
          this.interpolate(action.config.message, data)
        );

      case 'send_whatsapp':
        return whatsappService.sendMessage(
          this.interpolate(action.config.to, data),
          this.interpolate(action.config.message, data)
        );

      case 'send_email':
        return gmailService.sendEmail({
          to: this.interpolate(action.config.to, data),
          subject: this.interpolate(action.config.subject, data),
          body: this.interpolate(action.config.body, data),
          workspaceId,
        });

      case 'store_transaction':
        return this.storeTransaction(action.config, data, workspaceId);

      case 'send_notification':
        return notificationService.createNotification({
          workspaceId,
          type: 'automation',
          title: this.interpolate(action.config.title, data),
          message: this.interpolate(action.config.message, data),
          data,
        });

      case 'webhook':
        return this.callWebhook(action.config.url, data);

      default:
        throw new Error(`نوع الإجراء غير معروف: ${action.type}`);
    }
  }

  interpolate(template, data) {
    if (!template) return '';
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      return this.getNestedValue(data, path.trim()) ?? '';
    });
  }

  async storeTransaction(config, data, workspaceId) {
    const amount = data.ai?.amount || config.amount || 0;
    await query(
      `INSERT INTO transactions (workspace_id, amount, description, metadata)
       VALUES ($1, $2, $3, $4)`,
      [workspaceId, amount, config.description || 'أتمتة', JSON.stringify(data)]
    );
    return { stored: true, amount };
  }

  async callWebhook(url, data) {
    const axios = require('axios');
    const response = await axios.post(url, data, { timeout: 10000 });
    return { status: response.status };
  }
}

module.exports = new AutomationEngine();
