import { pythonBridge } from './PythonBridgeClient';

export interface ComputerUseAction {
  type: string;
  x?: number;
  y?: number;
  button?: 'left' | 'right' | 'middle';
  text?: string;
  keys?: string | string[];
  direction?: 'up' | 'down';
  amount?: number;
  duration?: number;
  reason?: string;
}

export interface AIAnalysis {
  observation: string;
  thinking: string;
  action: ComputerUseAction;
  confidence: number;
  estimated_progress: number;
}

export interface TaskState {
  taskId: string;
  goal: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: Array<{
    timestamp: number;
    analysis: string;
    action: ComputerUseAction;
    result?: string;
  }>;
  error?: string;
}

export class ComputerUseAgentPython {
  private isRunning: boolean = false;
  private currentTask: TaskState | null = null;
  private screenshotInterval: number = 3000; // 3 seconds
  private maxRetries: number = 3;
  private analyzeCallback: (screenshotBase64: string, goal: string, stepNumber: number, previousSteps: string[]) => Promise<AIAnalysis>;
  private statusUpdateCallback: (taskId: string, status: string, error?: string) => Promise<void>;
  private stepAddCallback: (taskId: string, step: any) => Promise<void>;

  constructor(
    analyzeCallback: (screenshotBase64: string, goal: string, stepNumber: number, previousSteps: string[]) => Promise<AIAnalysis>,
    statusUpdateCallback: (taskId: string, status: string, error?: string) => Promise<void>,
    stepAddCallback: (taskId: string, step: any) => Promise<void>
  ) {
    this.analyzeCallback = analyzeCallback;
    this.statusUpdateCallback = statusUpdateCallback;
    this.stepAddCallback = stepAddCallback;
  }

  async startTask(taskId: string, goal: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running a task');
    }

    // Check if Python bridge is available
    const isAvailable = await pythonBridge.isAvailable();
    if (!isAvailable) {
      throw new Error('Python bridge is not available. Make sure the Python server is running on port 5000.');
    }

    this.isRunning = true;
    this.currentTask = {
      taskId,
      goal,
      status: 'running',
      steps: [],
    };

    await this.statusUpdateCallback(taskId, 'running');

    try {
      await this.runTaskLoop();
    } catch (error) {
      console.error('Task loop error:', error);
      this.currentTask.status = 'failed';
      this.currentTask.error = error instanceof Error ? error.message : 'Unknown error';
      await this.statusUpdateCallback(
        taskId,
        'failed',
        this.currentTask.error
      );
    } finally {
      this.isRunning = false;
    }
  }

  stopTask(): void {
    if (this.currentTask) {
      this.currentTask.status = 'cancelled';
      this.statusUpdateCallback(this.currentTask.taskId, 'cancelled');
    }
    this.isRunning = false;
  }

  private async runTaskLoop(): Promise<void> {
    if (!this.currentTask) return;

    let stepNumber = 0;
    const maxSteps = 100; // Prevent infinite loops

    while (this.isRunning && this.currentTask.status === 'running' && stepNumber < maxSteps) {
      stepNumber++;
      console.log(`\n=== Step ${stepNumber} ===`);

      try {
        // 1. Capture screenshot using Python bridge
        const screenshotData = await pythonBridge.screenshot();
        const screenshotBase64 = screenshotData.image;

        // 2. Get AI analysis
        const previousSteps = this.currentTask.steps.map(
          step => `${step.action.type}: ${JSON.stringify(step.action)}`
        );

        const analysis = await this.analyzeCallback(
          screenshotBase64,
          this.currentTask.goal,
          stepNumber,
          previousSteps
        );

        console.log('AI Analysis:', analysis);

        // 3. Execute action using Python bridge
        const result = await this.executeAction(analysis.action);

        // 4. Record step
        const step = {
          timestamp: Date.now(),
          analysis: `${analysis.observation}\n\nThinking: ${analysis.thinking}`,
          action: {
            type: analysis.action.type,
            details: analysis.action,
          },
          result,
        };

        this.currentTask.steps.push(step);
        await this.stepAddCallback(this.currentTask.taskId, step);

        // 5. Check for task completion
        if (analysis.action.type === 'task_complete') {
          console.log('Task completed:', analysis.action.reason);
          this.currentTask.status = 'completed';
          await this.statusUpdateCallback(this.currentTask.taskId, 'completed');
          break;
        }

        if (analysis.action.type === 'task_failed') {
          console.log('Task failed:', analysis.action.reason);
          this.currentTask.status = 'failed';
          this.currentTask.error = analysis.action.reason;
          await this.statusUpdateCallback(
            this.currentTask.taskId,
            'failed',
            analysis.action.reason
          );
          break;
        }

        // 6. Wait before next screenshot
        await this.sleep(this.screenshotInterval);

      } catch (error) {
        console.error('Step error:', error);
        
        // Retry logic
        if (stepNumber <= this.maxRetries) {
          console.log(`Retrying step ${stepNumber}...`);
          await this.sleep(1000);
          stepNumber--; // Retry this step
          continue;
        } else {
          throw error;
        }
      }
    }

    if (stepNumber >= maxSteps) {
      this.currentTask.status = 'failed';
      this.currentTask.error = 'Maximum steps reached';
      await this.statusUpdateCallback(
        this.currentTask.taskId,
        'failed',
        'Maximum steps reached'
      );
    }
  }

  private async executeAction(action: ComputerUseAction): Promise<string> {
    console.log('Executing action:', action.type);

    try {
      switch (action.type) {
        case 'mouse_move':
          if (action.x === undefined || action.y === undefined) {
            throw new Error('mouse_move requires x and y coordinates');
          }
          await pythonBridge.mouseMove({
            x: action.x,
            y: action.y,
            duration: action.duration || 0.5
          });
          return `Moved mouse to (${action.x}, ${action.y})`;

        case 'click':
          await pythonBridge.mouseClick({
            button: action.button || 'left',
            clicks: 1
          });
          return `Clicked ${action.button || 'left'} mouse button`;

        case 'double_click':
          await pythonBridge.mouseClick({
            button: action.button || 'left',
            clicks: 2,
            interval: 0.1
          });
          return `Double-clicked ${action.button || 'left'} mouse button`;

        case 'type':
          if (!action.text) {
            throw new Error('type requires text');
          }
          await pythonBridge.keyboardType({
            text: action.text,
            interval: 0.05
          });
          return `Typed: "${action.text}"`;

        case 'key_press':
          if (!action.keys) {
            throw new Error('key_press requires keys');
          }
          await pythonBridge.keyboardPress({
            keys: action.keys
          });
          return `Pressed key: ${action.keys}`;

        case 'hotkey':
          if (!action.keys || !Array.isArray(action.keys)) {
            throw new Error('hotkey requires keys array');
          }
          await pythonBridge.keyboardHotkey({
            keys: action.keys
          });
          return `Pressed hotkey: ${action.keys.join('+')}`;

        case 'scroll':
          if (!action.direction || action.amount === undefined) {
            throw new Error('scroll requires direction and amount');
          }
          await pythonBridge.mouseScroll({
            direction: action.direction,
            amount: action.amount
          });
          return `Scrolled ${action.direction} by ${action.amount}`;

        case 'wait':
          const duration = (action.duration || 1000) / 1000; // Convert ms to seconds
          await pythonBridge.wait(duration);
          return `Waited ${duration}s`;

        case 'task_complete':
        case 'task_failed':
          return action.reason || 'Task ended';

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Action execution error:', errorMsg);
      
      // Check for FAILSAFE
      if (errorMsg.includes('FAILSAFE')) {
        throw new Error('FAILSAFE triggered - emergency stop activated!');
      }
      
      return `Error: ${errorMsg}`;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus(): { isRunning: boolean; currentTask: TaskState | null } {
    return {
      isRunning: this.isRunning,
      currentTask: this.currentTask,
    };
  }
}
