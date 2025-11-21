import express from 'express';
import cors from 'cors';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { ComputerUseAgent } from '../src/computerUse/ComputerUseAgent';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Convex client
const convexUrl = process.env.VITE_CONVEX_URL || '';
const convex = new ConvexHttpClient(convexUrl);

// Agent instance
let agent: ComputerUseAgent | null = null;

// Initialize agent
function initializeAgent() {
  if (agent) return agent;

  agent = new ComputerUseAgent(
    // Analyze callback
    async (screenshotBase64, goal, stepNumber, previousSteps) => {
      const response: any = await convex.action(api.computerUse.analyzeScreenshot, {
        taskId: currentTaskId!,
        screenshotBase64,
        goal,
        stepNumber,
        previousSteps,
      });
      return response;
    },
    // Status update callback
    async (taskId, status, error) => {
      await convex.mutation(api.computerUse.updateTaskStatus, {
        taskId: taskId as any,
        status: status as any,
        error,
      });
    },
    // Step add callback
    async (taskId, step) => {
      await convex.mutation(api.computerUse.addTaskStep, {
        taskId: taskId as any,
        step,
      });
    }
  );

  return agent;
}

let currentTaskId: string | null = null;

// Start task endpoint
app.post('/api/computer-use/start', async (req, res) => {
  try {
    const { taskId, goal } = req.body;

    if (!taskId || !goal) {
      return res.status(400).json({ error: 'Missing taskId or goal' });
    }

    currentTaskId = taskId;
    const agentInstance = initializeAgent();

    // Start task in background
    agentInstance.startTask(taskId, goal).catch(error => {
      console.error('Task execution error:', error);
    });

    res.json({ success: true, message: 'Task started' });
  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({ 
      error: 'Failed to start task',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stop task endpoint
app.post('/api/computer-use/stop', async (req, res) => {
  try {
    if (agent) {
      agent.stopTask();
      res.json({ success: true, message: 'Task stopped' });
    } else {
      res.status(404).json({ error: 'No active task' });
    }
  } catch (error) {
    console.error('Stop task error:', error);
    res.status(500).json({ error: 'Failed to stop task' });
  }
});

// Get agent status
app.get('/api/computer-use/status', async (req, res) => {
  try {
    if (agent) {
      const status = agent.getStatus();
      res.json(status);
    } else {
      res.json({ isRunning: false, currentTask: null });
    }
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    agentRunning: agent?.getStatus().isRunning || false
  });
});

app.listen(PORT, () => {
  console.log(`🤖 Computer Use Agent server running on http://localhost:${PORT}`);
  console.log(`📡 Convex URL: ${convexUrl}`);
  console.log(`✅ Ready to receive tasks!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Computer Use Agent server...');
  if (agent) {
    agent.stopTask();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Computer Use Agent server...');
  if (agent) {
    agent.stopTask();
  }
  process.exit(0);
});
