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

---

## 🏗️ Integration Setup Guide

### Step 1: Setup on Separate Laptop

#### 1.1 Prerequisites
```bash
# Ensure you have Node.js 20+
node --version

# Clone the project to your laptop
git clone <your-repo> standup-bot
cd standup-bot
```

#### 1.2 Install Dependencies
```bash
npm install
```

#### 1.3 Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

**Key Configuration (.env):**
```env
DATABASE_URL="file:./standup.db"
PORT=3001
API_KEY=your-super-secret-api-key-change-this
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
ENABLE_SCHEDULER=true
LLM_DISABLED=true
```

#### 1.4 Initialize Database
```bash
# Run database migrations
npm run prisma:migrate

# Seed with sample data (optional)
npm run prisma:seed
```

#### 1.5 Start the Service
```bash
# Development mode
npm run dev

# Or production mode
npm run build && npm start
```

**✅ Service will be running on `http://laptop-ip:3001`**

---

### Step 2: Web App Integration

#### 2.1 API Base Configuration

In your web app, create an API service:

```javascript
// standup-api.js
const STANDUP_API_BASE = 'http://your-laptop-ip:3001';
const API_KEY = 'your-super-secret-api-key-change-this';

const api = {
  baseURL: STANDUP_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  }
};
```

#### 2.2 Essential Integration Endpoints

##### **Health Check**
```javascript
// Check if standup service is running
async function checkStandupService() {
  const response = await fetch(`${STANDUP_API_BASE}/healthz`);
  return response.json(); // { ok: true, ts: "2024-..." }
}
```

##### **Create/Sync Projects**
```javascript
// Create a project in standup service
async function createProject(projectData) {
  const response = await fetch(`${STANDUP_API_BASE}/api/integration/projects`, {
    method: 'POST',
    headers: api.headers,
    body: JSON.stringify({
      id: projectData.id,
      name: projectData.name,
      timezone: 'Asia/Kolkata',
      business_days_only: true
    })
  });
  return response.json();
}
```

##### **Sync Users**
```javascript
// Sync users from your app to standup service
async function syncUsers(users) {
  const response = await fetch(`${STANDUP_API_BASE}/api/integration/users`, {
    method: 'POST',
    headers: api.headers,
    body: JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      active: true,
      capacity_score: 0.8
    })
  });
  return response.json();
}
```

##### **Sync Tasks (Most Important)**
```javascript
// Sync your app's tasks to standup service
async function syncTasks(projectId, tasks) {
  const taskData = tasks.map(task => ({
    id: task.id,
    project_id: projectId,
    title: task.title,
    status: task.status,
    status_category: mapToStandardStatus(task.status), // 'todo'|'doing'|'blocked'|'done'
    priority: task.priority || 1,
    assignee_id: task.assignee?.id || null,
    due_at: task.due_date ? new Date(task.due_date).toISOString() : null
  }));

  const response = await fetch(`${STANDUP_API_BASE}/api/integration/tasks`, {
    method: 'POST',
    headers: api.headers,
    body: JSON.stringify(taskData)
  });
  return response.json();
}

// Helper function to map your status to standard categories
function mapToStandardStatus(status) {
  const mapping = {
    'backlog': 'todo',
    'to do': 'todo',
    'in progress': 'doing',
    'development': 'doing',
    'stuck': 'blocked',
    'waiting': 'blocked',
    'completed': 'done',
    'closed': 'done'
  };
  return mapping[status.toLowerCase()] || 'todo';
}
```

##### **Generate Stand-up**
```javascript
// Generate standup for a project
async function generateStandup(projectId, options = {}) {
  const response = await fetch(`${STANDUP_API_BASE}/api/integration/standup/generate`, {
    method: 'POST',
    headers: api.headers,
    body: JSON.stringify({
      project_id: projectId,
      hours: options.hours || 24,
      include_slack_post: options.postToSlack || false
    })
  });
  return response.json();
}

// Example usage
const standup = await generateStandup('project-123');
console.log(standup.data.standup_text);
```

##### **Get Project Health**
```javascript
// Get project health summary
async function getProjectHealth(projectId) {
  const response = await fetch(
    `${STANDUP_API_BASE}/api/integration/projects/${projectId}/health`,
    { headers: { 'X-API-Key': API_KEY } }
  );
  return response.json();
}
```

#### 2.3 Frontend Integration Example

```javascript
// React component example
function StandupPanel({ projectId }) {
  const [standup, setStandup] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateDaily = async () => {
    setLoading(true);
    try {
      // Sync latest tasks first
      await syncTasks(projectId, getCurrentProjectTasks());
      
      // Generate standup
      const result = await generateStandup(projectId);
      setStandup(result.data);
      
      // Get health summary
      const healthData = await getProjectHealth(projectId);
      setHealth(healthData.data);
    } catch (error) {
      console.error('Failed to generate standup:', error);
    }
    setLoading(false);
  };

  return (
    <div className="standup-panel">
      <h3>Daily Stand-up</h3>
      
      {health && (
        <div className="health-summary">
          <span>✅ {health.health_summary.tasks_completed_recently} completed</span>
          <span>⚠️ {health.health_summary.overdue_tasks} overdue</span>
          <span>📅 {health.health_summary.due_soon_tasks} due soon</span>
        </div>
      )}
      
      <button onClick={generateDaily} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Stand-up'}
      </button>
      
      {standup && (
        <div className="standup-content">
          <pre>{standup.standup_text}</pre>
          <small>Generated at {standup.generated_at}</small>
        </div>
      )}
    </div>
  );
}
```

---

### Step 3: Data Synchronization Strategy

#### 3.1 Real-time Sync (Recommended)

Hook into your app's task management events:

```javascript
// When tasks are created/updated in your app
async function onTaskUpdate(task) {
  try {
    await syncTasks(task.project_id, [task]);
  } catch (error) {
    console.warn('Failed to sync task to standup service:', error);
    // Handle gracefully - your app continues working
  }
}

// When projects are created
async function onProjectCreate(project) {
  await createProject(project);
  await syncUsers(project.members);
}
```

#### 3.2 Periodic Sync (Backup Strategy)

```javascript
// Sync all data every few hours as backup
setInterval(async () => {
  const projects = await getAllActiveProjects();
  
  for (const project of projects) {
    await createProject(project);
    await syncUsers(project.members);
    await syncTasks(project.id, project.tasks);
  }
}, 6 * 60 * 60 * 1000); // Every 6 hours
```

---

### Step 4: Advanced Integration Features

#### 4.1 Automated Daily Stand-ups

Enable automatic generation in your web app:

```javascript
// Add to your app's dashboard
function AutoStandupSettings({ projectId }) {
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState('');

  const enableAutoStandups = async () => {
    // Update project settings
    await fetch(`${STANDUP_API_BASE}/api/integration/projects`, {
      method: 'POST',
      headers: api.headers,
      body: JSON.stringify({
        id: projectId,
        slack_webhook_url: slackWebhook,
        business_days_only: true
      })
    });
    
    setAutoEnabled(true);
  };

  return (
    <div>
      <h4>Automated Stand-ups</h4>
      <input 
        placeholder="Slack Webhook URL" 
        value={slackWebhook}
        onChange={(e) => setSlackWebhook(e.target.value)}
      />
      <button onClick={enableAutoStandups}>
        Enable Daily Auto-Generation
      </button>
    </div>
  );
}
```

#### 4.2 Custom Stand-up Templates

```javascript
// Get raw data and create custom formats
async function getCustomStandup(projectId) {
  const health = await getProjectHealth(projectId);
  const tasks = await fetch(`${STANDUP_API_BASE}/api/integration/projects/${projectId}/tasks`, {
    headers: { 'X-API-Key': API_KEY }
  }).then(r => r.json());

  // Create your own format
  return `
    🎯 Project: ${health.data.project_name}
    
    ✅ Completed: ${health.data.health_summary.tasks_completed_recently} tasks
    🔴 Overdue: ${health.data.health_summary.overdue_tasks} tasks  
    🟡 Due Soon: ${health.data.health_summary.due_soon_tasks} tasks
    
    📋 Next Actions:
    ${tasks.data.filter(t => t.status_category === 'todo').slice(0, 3)
      .map(t => `• ${t.title} (${t.assignee?.name || 'Unassigned'})`)
      .join('\n')}
  `;
}
```

---

### Step 5: Deployment & Production

#### 5.1 Production Deployment

```bash
# On your laptop/server
npm run build
npm start

# Or using PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name standup-bot
pm2 save
pm2 startup
```

#### 5.2 Environment Variables for Production

```env
DATABASE_URL="file:./production.db"
PORT=3001
API_KEY=super-secure-production-key-change-this
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
ENABLE_SCHEDULER=true
LLM_DISABLED=false
OPENAI_API_KEY=your-openai-key-for-ai-features
SLACK_WEBHOOK_URL=your-slack-webhook
LOG_LEVEL=warn
```

#### 5.3 Monitoring & Health Checks

```javascript
// Add to your web app's admin panel
async function checkStandupServiceHealth() {
  try {
    const response = await fetch(`${STANDUP_API_BASE}/healthz`);
    const health = await response.json();
    return {
      status: 'healthy',
      uptime: health.ts,
      response_time: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}
```

---

## 🔧 API Reference

### Authentication
All API endpoints (except `/healthz`) require the `X-API-Key` header.

### Integration Endpoints

| Endpoint | Method | Purpose | Body |
|----------|--------|---------|------|
| `/healthz` | GET | Health check | None |
| `/api/integration/projects` | GET | List projects | None |
| `/api/integration/projects` | POST | Create/update project | Project object |
| `/api/integration/users` | POST | Create/update user | User object |
| `/api/integration/tasks` | POST | Sync tasks (bulk) | Task array |
| `/api/integration/projects/:id/tasks` | GET | Get project tasks | None |
| `/api/integration/projects/:id/health` | GET | Project health summary | None |
| `/api/integration/standup/generate` | POST | Generate standup | Generation options |

### Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "error": "Error message if failed"
}
```

---

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Add your web app domain to `ALLOWED_ORIGINS` in .env
2. **API Key Invalid**: Ensure `X-API-Key` header matches `.env` file
3. **Database Locked**: Stop all running instances and restart
4. **Tasks Not Syncing**: Check task status mapping function
5. **Service Unreachable**: Verify firewall and network connectivity

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

### Database Issues

```bash
# Reset database
rm standup.db
npm run prisma:migrate
npm run prisma:seed
```

---

## 📈 Next Steps

1. **Set up the service** on your separate laptop
2. **Test integration** with a single project
3. **Implement data sync** in your web app
4. **Add UI components** for stand-up generation
5. **Configure Slack** for automated posting
6. **Monitor and optimize** based on usage

The standup bot is now ready for seamless integration with your web application! 🎉