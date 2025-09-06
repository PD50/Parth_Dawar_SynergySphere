export type AggregationPayload = {
  project: string;
  project_id: string;
  window_hours: 24 | 48;
  window_start: string;
  window_end: string;
  status_model: "canonical_v1";
  moved_done: { count: number; examples: string[] };
  at_risk: {
    overdue: { id: string; title: string; assignee: string | null; priority: number }[];
    due_soon: { id: string; title: string; assignee: string | null; priority: number; due_in_hours: number }[];
  };
  open_counts: { open: number; overdue: number };
  suggested_owners: { task_id: string; suggested_owner: string; reason: string }[];
  business_calendar: { skip_post_today: boolean };
  mention_policy: "no_mentions" | "names_bold";
  max_items: number;
  allowed_task_ids: string[];
  sanitization: { markdown_escaped: boolean; mentions_stripped: boolean; secrets_redacted: boolean };
  payload_hash: string;
};

export type ComposedStandup = {
  post_text: string;
  included_task_ids: string[];
  policy_flags: {
    mention_policy: "no_mentions" | "names_bold";
    max_lines: number;
    max_bullets: number;
  };
  metrics: {
    composition_method: "llm" | "fallback";
    char_count: number;
    line_count: number;
    bullet_count: number;
  };
};

export type OwnerCandidate = {
  user_id: string;
  name: string;
  score: number;
  reason: string;
};

export type TaskWithAssignee = {
  id: string;
  title: string;
  status: string;
  status_category: string;
  priority: number;
  assignee_id: string | null;
  due_at: Date | null;
  assignee?: { id: string; name: string; active: boolean; capacity_score: number } | null;
};