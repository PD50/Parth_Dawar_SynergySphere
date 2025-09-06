import { describe, it, expect } from 'vitest';
import { composeStandup } from '../services/composition.js';
import { AggregationPayload } from '../types/index.js';

describe('Composition Service', () => {
  const mockPayload: AggregationPayload = {
    project: 'Test Project',
    project_id: 'test-project-id',
    window_hours: 24,
    window_start: '2024-01-01T00:00:00Z',
    window_end: '2024-01-02T00:00:00Z',
    status_model: 'canonical_v1',
    moved_done: {
      count: 2,
      examples: ['Implement user auth', 'Fix login bug']
    },
    at_risk: {
      overdue: [{
        id: 'task1',
        title: 'Critical database migration',
        assignee: 'Alice',
        priority: 3
      }],
      due_soon: [{
        id: 'task2',
        title: 'Review PR for new feature',
        assignee: 'Bob',
        priority: 2,
        due_in_hours: 8
      }]
    },
    open_counts: { open: 15, overdue: 3 },
    suggested_owners: [
      { task_id: 'task1', suggested_owner: 'Alice', reason: 'Currently assigned' },
      { task_id: 'task2', suggested_owner: 'Bob', reason: 'Recent activity' }
    ],
    business_calendar: { skip_post_today: false },
    mention_policy: 'names_bold',
    max_items: 3,
    allowed_task_ids: ['task1', 'task2'],
    sanitization: {
      markdown_escaped: true,
      mentions_stripped: true,
      secrets_redacted: true
    },
    payload_hash: 'abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab'
  };

  it('should compose standup with fallback template', async () => {
    process.env.LLM_DISABLED = 'true';
    
    const result = await composeStandup(mockPayload);

    expect(result.post_text).toBeDefined();
    expect(result.post_text.split('\n')).toHaveLength.lessThanOrEqual(8);
    expect(result.post_text).toContain('**Yesterday:**');
    expect(result.post_text).toContain('**At risk:**');
    expect(result.post_text).toContain('**Next:**');
    expect(result.post_text).not.toContain('@');

    expect(result.included_task_ids).toContain('task1');
    expect(result.included_task_ids).toContain('task2');

    expect(result.metrics.composition_method).toBe('fallback');
    expect(result.metrics.line_count).toBeLessThanOrEqual(8);
    expect(result.metrics.bullet_count).toBeLessThanOrEqual(3);
    expect(result.metrics.char_count).toBe(result.post_text.length);

    expect(result.policy_flags.mention_policy).toBe('names_bold');
    expect(result.policy_flags.max_lines).toBe(8);
    expect(result.policy_flags.max_bullets).toBe(3);
  });

  it('should handle empty payload gracefully', async () => {
    process.env.LLM_DISABLED = 'true';
    
    const emptyPayload: AggregationPayload = {
      ...mockPayload,
      moved_done: { count: 0, examples: [] },
      at_risk: { overdue: [], due_soon: [] },
      suggested_owners: [],
      allowed_task_ids: []
    };

    const result = await composeStandup(emptyPayload);

    expect(result.post_text).toContain('No completed tasks');
    expect(result.post_text).toContain('None');
    expect(result.included_task_ids).toHaveLength(0);
    expect(result.metrics.composition_method).toBe('fallback');
  });

  it('should respect mention policy', async () => {
    process.env.LLM_DISABLED = 'true';
    
    const noMentionsPayload: AggregationPayload = {
      ...mockPayload,
      mention_policy: 'no_mentions'
    };

    const result = await composeStandup(noMentionsPayload);

    expect(result.post_text).not.toContain('**Alice**');
    expect(result.post_text).not.toContain('**Bob**');
    expect(result.post_text).toContain('Alice');
    expect(result.post_text).toContain('Bob');
    expect(result.policy_flags.mention_policy).toBe('no_mentions');
  });

  it('should limit items correctly', async () => {
    process.env.LLM_DISABLED = 'true';
    
    const manyTasksPayload: AggregationPayload = {
      ...mockPayload,
      at_risk: {
        overdue: Array.from({ length: 5 }, (_, i) => ({
          id: `overdue-${i}`,
          title: `Overdue task ${i}`,
          assignee: 'User',
          priority: 1
        })),
        due_soon: Array.from({ length: 5 }, (_, i) => ({
          id: `due-${i}`,
          title: `Due soon task ${i}`,
          assignee: 'User',
          priority: 1,
          due_in_hours: 12
        }))
      },
      allowed_task_ids: Array.from({ length: 10 }, (_, i) => `task-${i}`)
    };

    const result = await composeStandup(manyTasksPayload);

    const bulletCount = (result.post_text.match(/^•/gm) || []).length;
    expect(bulletCount).toBeLessThanOrEqual(3);
    
    const lineCount = result.post_text.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(8);
  });
});