import fetch from 'node-fetch';
import { ComposedStandup } from '../../types/index.js';

export interface SlackConfig {
  mode: 'webhook' | 'bot';
  webhook_url?: string;
  bot_token?: string;
  channel_id?: string;
  thread_ts?: string;
}

export async function postToSlack(standup: ComposedStandup, config: SlackConfig): Promise<{ success: boolean; error?: string; ts?: string }> {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (config.mode === 'webhook') {
        return await postViaWebhook(standup, config);
      } else if (config.mode === 'bot') {
        return await postViaBotToken(standup, config);
      } else {
        throw new Error(`Unsupported Slack mode: ${config.mode}`);
      }
    } catch (error: any) {
      if (error.status === 429) {
        const retryAfter = error.headers?.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        
        if (attempt < maxRetries) {
          console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await sleep(delay);
          continue;
        }
      }
      
      if (attempt === maxRetries) {
        console.error(`Failed to post to Slack after ${maxRetries} attempts:`, error);
        return { success: false, error: error.message };
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

async function postViaWebhook(standup: ComposedStandup, config: SlackConfig): Promise<{ success: boolean; error?: string; ts?: string }> {
  if (!config.webhook_url) {
    throw new Error('Webhook URL is required for webhook mode');
  }

  const payload = {
    text: standup.post_text,
    ...(config.thread_ts && { thread_ts: config.thread_ts })
  };

  const response = await fetch(config.webhook_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw { status: response.status, headers: response.headers, message: `Webhook failed: ${response.status} ${errorText}` };
  }

  return { success: true };
}

async function postViaBotToken(standup: ComposedStandup, config: SlackConfig): Promise<{ success: boolean; error?: string; ts?: string }> {
  if (!config.bot_token || !config.channel_id) {
    throw new Error('Bot token and channel ID are required for bot mode');
  }

  const payload = {
    channel: config.channel_id,
    text: standup.post_text,
    ...(config.thread_ts && { thread_ts: config.thread_ts })
  };

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.bot_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw { status: response.status, headers: response.headers, message: `Bot API failed: ${response.status}` };
  }

  const result: any = await response.json();
  
  if (!result.ok) {
    if (result.error === 'rate_limited') {
      throw { status: 429, headers: response.headers, message: 'Rate limited' };
    }
    throw new Error(`Slack API error: ${result.error}`);
  }

  return { success: true, ts: result.ts };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}