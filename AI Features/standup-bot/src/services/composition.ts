import { z } from 'zod';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AggregationPayload, ComposedStandup } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ComposedStandupSchema = z.object({
  post_text: z.string().max(2000),
  included_task_ids: z.array(z.string()),
  policy_flags: z.object({
    mention_policy: z.enum(['no_mentions', 'names_bold']),
    max_lines: z.number(),
    max_bullets: z.number()
  }),
  metrics: z.object({
    composition_method: z.enum(['llm', 'fallback']),
    char_count: z.number(),
    line_count: z.number(),
    bullet_count: z.number()
  })
});

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

export async function composeStandup(payload: AggregationPayload): Promise<ComposedStandup> {
  const llmDisabled = process.env.LLM_DISABLED === 'true';

  if (!llmDisabled && (openai || anthropic)) {
    try {
      const llmResult = await generateWithLLM(payload);
      if (llmResult) {
        return llmResult;
      }
    } catch (error) {
      console.warn('LLM generation failed, falling back to template:', error);
    }
  }

  return generateWithFallback(payload);
}

async function generateWithLLM(payload: AggregationPayload): Promise<ComposedStandup | null> {
  const systemPrompt = readFileSync(join(__dirname, '../prompts/standup_system_prompt.md'), 'utf-8');
  const userPrompt = `Generate a stand-up post for this project data:\n\n${JSON.stringify(payload, null, 2)}`;

  let response: string | null = null;

  if (openai) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    response = completion.choices[0]?.message?.content || null;
  } else if (anthropic) {
    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ]
    });
    response = completion.content[0]?.type === 'text' ? completion.content[0].text : null;
  }

  if (!response) return null;

  try {
    const jsonMatch = response.match(/```json\n(.*?)\n```/s) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const validated = ComposedStandupSchema.parse(parsedResponse);

    if (!validateTaskIds(validated.included_task_ids, payload.allowed_task_ids)) {
      throw new Error('Invalid task IDs in response');
    }

    if (validated.metrics.line_count > 8 || validated.metrics.bullet_count > 3) {
      throw new Error('Response exceeds limits');
    }

    if (validated.post_text.includes('@')) {
      throw new Error('Response contains mentions');
    }

    validated.metrics.char_count = validated.post_text.length;
    validated.metrics.line_count = validated.post_text.split('\n').length;
    validated.metrics.bullet_count = (validated.post_text.match(/^•/gm) || []).length;
    validated.metrics.composition_method = 'llm';

    return validated;
  } catch (error) {
    console.warn('LLM response validation failed:', error);
    return null;
  }
}

function generateWithFallback(payload: AggregationPayload): ComposedStandup {
  const lines: string[] = [];
  const includedTaskIds: string[] = [];

  const yesterdayLine = payload.moved_done.count > 0
    ? `**Yesterday:** Completed ${payload.moved_done.count} task${payload.moved_done.count === 1 ? '' : 's'}${payload.moved_done.examples.length > 0 ? ` (${payload.moved_done.examples.slice(0, 2).join(', ')})` : ''}`
    : '**Yesterday:** No completed tasks';
  lines.push(yesterdayLine);

  const atRiskItems: string[] = [];
  payload.at_risk.overdue.forEach(task => {
    const assigneeText = task.assignee 
      ? (payload.mention_policy === 'names_bold' ? `**${task.assignee}**` : task.assignee)
      : 'unassigned';
    atRiskItems.push(`${task.title} (overdue, ${assigneeText})`);
    includedTaskIds.push(task.id);
  });

  payload.at_risk.due_soon.forEach(task => {
    const assigneeText = task.assignee 
      ? (payload.mention_policy === 'names_bold' ? `**${task.assignee}**` : task.assignee)
      : 'unassigned';
    atRiskItems.push(`${task.title} (due in ${task.due_in_hours}h, ${assigneeText})`);
    includedTaskIds.push(task.id);
  });

  if (atRiskItems.length > 0) {
    lines.push(`**At risk:** ${atRiskItems.slice(0, 3).join(', ')}`);
  } else {
    lines.push('**At risk:** None');
  }

  lines.push('**Next:**');
  
  const nextActions = payload.suggested_owners.slice(0, 3);
  if (nextActions.length > 0) {
    nextActions.forEach(owner => {
      const ownerName = payload.mention_policy === 'names_bold' ? `**${owner.suggested_owner}**` : owner.suggested_owner;
      lines.push(`• ${ownerName}: ${owner.reason}`);
    });
  } else {
    lines.push('• Review open tasks and assign owners');
    lines.push('• Update task priorities and due dates');
  }

  const postText = lines.join('\n');
  const lineCount = lines.length;
  const bulletCount = (postText.match(/^•/gm) || []).length;

  return {
    post_text: postText,
    included_task_ids: includedTaskIds,
    policy_flags: {
      mention_policy: payload.mention_policy,
      max_lines: 8,
      max_bullets: 3
    },
    metrics: {
      composition_method: 'fallback',
      char_count: postText.length,
      line_count: lineCount,
      bullet_count: bulletCount
    }
  };
}

function validateTaskIds(includedIds: string[], allowedIds: string[]): boolean {
  return includedIds.every(id => allowedIds.includes(id));
}