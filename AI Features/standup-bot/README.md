# Stand-up Bot - Web App Integration Guide

A production-ready service that generates intelligent stand-up posts for projects. **Optimized for SQLite and web app integration.**

## 🚀 Features

- **🤖 AI-Powered Stand-ups**: LLM-powered with deterministic fallback
- **📊 Smart Aggregation**: Tracks task transitions, identifies at-risk items
- **🔗 Web Integration**: RESTful APIs with CORS support for seamless integration
- **💾 SQLite Database**: Lightweight, zero-configuration database
- **📈 Real-time Metrics**: Project health monitoring and reporting
- **⏰ Automated Scheduling**: Optional cron-based daily generation
- **🔒 Secure**: API key authentication and input validation

## 🎯 Perfect for Web App Integration

This service is designed to run as a **standalone microservice** alongside your main web application, providing stand-up automation features through clean REST APIs.

## 📋 Prerequisites

- Node.js 20+
- Your existing web application
- SQLite (bundled with Node.js)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd standup-bot
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start database (using Docker):**
   ```bash
   docker-compose up postgres -d
   ```

4. **Initialize database:**
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Start the service:**
   ```bash
   npm run dev
   ```

The service will be running on `http://localhost:3000`

### Using Docker Compose

For a complete setup including PostgreSQL:

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL on port 5432
- Run migrations and seed data
- Start the app on port 3000

## API Endpoints

### Health Check
```bash
GET /healthz
```

### Generate Stand-up
```bash
POST /api/standup/generate
Content-Type: application/json
X-API-Key: <your-api-key>

{
  "projectId": "project-id",
  "hours": 24,
  "force": false
}
```

### Preview Stand-up
```bash
GET /api/standup/preview?projectId=<id>&hours=24
X-API-Key: <your-api-key>
```

### Get Last Stand-up
```bash
GET /api/standup/last?projectId=<id>
X-API-Key: <your-api-key>
```

### Metrics
```bash
GET /metrics
X-API-Key: <your-api-key>
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | HTTP server port | `3000` |
| `API_KEY` | API authentication key | `dev-local-key` |
| `DEFAULT_MENTION_POLICY` | Mention style: `no_mentions` or `names_bold` | `names_bold` |
| `DEFAULT_BUSINESS_DAYS_ONLY` | Skip weekends | `true` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | - |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) | - |
| `LLM_DISABLED` | Force fallback template | `true` |
| `SLACK_MODE` | Default Slack mode: `webhook` or `bot` | `webhook` |

### LLM Configuration

The service supports two LLM providers:
- **OpenAI**: Set `OPENAI_API_KEY` for GPT-4
- **Anthropic**: Set `ANTHROPIC_API_KEY` for Claude

If both are set, OpenAI takes precedence. Set `LLM_DISABLED=true` to use only the deterministic fallback template.

### Slack Integration

#### Webhook Mode
Set project's `slack_mode` to `webhook` and provide `slack_webhook_url`:
```sql
UPDATE projects SET 
  slack_mode = 'webhook',
  slack_webhook_url = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
WHERE id = 'your-project-id';
```

#### Bot Token Mode
Set project's `slack_mode` to `bot` and provide `slack_bot_token` + `slack_channel_id`:
```sql
UPDATE projects SET 
  slack_mode = 'bot',
  slack_bot_token = 'xoxb-your-bot-token',
  slack_channel_id = 'C1234567890'
WHERE id = 'your-project-id';
```

## Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Production
```bash
docker build -t standup-bot .
docker run -p 3000:3000 --env-file .env standup-bot
```

### Health Checks
The service exposes `/healthz` for load balancer health checks and `/metrics` for Prometheus monitoring.

## Architecture

### Core Components

1. **Aggregation Service** (`src/services/aggregation.ts`)
   - Analyzes task transitions in time windows
   - Identifies at-risk tasks (overdue/due soon)
   - Suggests task owners based on activity/domain/capacity

2. **Composition Service** (`src/services/composition.ts`)
   - Primary: LLM-powered composition with strict validation
   - Fallback: Deterministic template with same format constraints

3. **Posting Service** (`src/services/poster/slack.ts`)
   - Supports Slack webhook and bot token modes
   - Rate limiting with exponential backoff
   - Thread-aware posting

4. **Scheduler** (`src/cron/scheduler.ts`)
   - Business-day aware cron scheduling
   - PostgreSQL advisory locks prevent duplicate runs
   - Per-project timezone conversion

### Data Model

- **Projects**: Configuration and Slack settings
- **Users**: Team members with capacity scoring
- **Tasks**: Work items with status tracking and due dates
- **TaskActivity**: Transition history for aggregation
- **Components**: Code/domain areas with default owners
- **StandupPost**: Generated posts with idempotency

### Security Features

- HMAC-based API key authentication
- Input sanitization (mentions, URLs, secrets)
- SQL injection protection via Prisma
- Rate limiting and retry logic

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

## License

MIT