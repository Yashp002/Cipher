import screenshot from 'screenshot-desktop';
import { mouse, keyboard, Button, Key, screen } from '@nut-tree-fork/nut-js';
import sharp from 'sharp';

export interface ComputerUseAction {
  type: string;
  x?: number;
  y?: number;
  button?: 'left' | 'right' | 'middle';
  text?: string;
  key?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
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

export class ComputerUseAgent {
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
    
    // Configure nut.js for smooth operation
    mouse.config.autoDelayMs = 100;
    mouse.config.mouseSpeed = 1000;
  }

  async startTask(taskId: string, goal: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running a task');
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
        // 1. Capture screenshot
        const screenshotBuffer = await this.captureScreenshot();
        const screenshotBase64 = screenshotBuffer.toString('base64');

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

        // 3. Execute action
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

  private async captureScreenshot(): Promise<Buffer> {
    try {
      const img = await screenshot({ format: 'png' });
      
      // Compress image to reduce size for API
      const compressed = await sharp(img)
        .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
        .png({ quality: 80, compressionLevel: 9 })
        .toBuffer();
      
      return compressed;
    } catch (error) {
      console.error('Screenshot capture error:', error);
      throw new Error('Failed to capture screenshot');
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
          await mouse.setPosition({ x: action.x, y: action.y });
          return `Moved mouse to (${action.x}, ${action.y})`;

        case 'click':
          const clickButton = this.mapButton(action.button || 'left');
          await mouse.click(clickButton);
          return `Clicked ${action.button || 'left'} mouse button`;

        case 'double_click':
          const doubleClickButton = this.mapButton(action.button || 'left');
          await mouse.doubleClick(doubleClickButton);
          return `Double-clicked ${action.button || 'left'} mouse button`;

        case 'type':
          if (!action.text) {
            throw new Error('type requires text');
          }
          await keyboard.type(action.text);
          return `Typed: "${action.text}"`;

        case 'key_press':
          if (!action.key) {
            throw new Error('key_press requires key');
          }
          const key = this.mapKey(action.key);
          await keyboard.type(key);
          return `Pressed key: ${action.key}`;

        case 'scroll':
          if (!action.direction || action.amount === undefined) {
            throw new Error('scroll requires direction and amount');
          }
          await this.performScroll(action.direction, action.amount);
          return `Scrolled ${action.direction} by ${action.amount}`;

        case 'wait':
          const duration = action.duration || 1000;
          await this.sleep(duration);
          return `Waited ${duration}ms`;

        case 'task_complete':
        case 'task_failed':
          return action.reason || 'Task ended';

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Action execution error:', errorMsg);
      return `Error: ${errorMsg}`;
    }
  }

  private mapButton(button: string): Button {
    switch (button.toLowerCase()) {
      case 'left':
        return Button.LEFT;
      case 'right':
        return Button.RIGHT;
      case 'middle':
        return Button.MIDDLE;
      default:
        return Button.LEFT;
    }
  }

  private mapKey(keyName: string): Key {
    const keyMap: Record<string, Key> = {
      'enter': Key.Enter,
      'return': Key.Enter,
      'backspace': Key.Backspace,
      'tab': Key.Tab,
      'escape': Key.Escape,
      'esc': Key.Escape,
      'space': Key.Space,
      'delete': Key.Delete,
      'del': Key.Delete,
      'home': Key.Home,
      'end': Key.End,
      'pageup': Key.PageUp,
      'pagedown': Key.PageDown,
      'arrowup': Key.Up,
      'up': Key.Up,
      'arrowdown': Key.Down,
      'down': Key.Down,
      'arrowleft': Key.Left,
      'left': Key.Left,
      'arrowright': Key.Right,
      'right': Key.Right,
      'f1': Key.F1,
      'f2': Key.F2,
      'f3': Key.F3,
      'f4': Key.F4,
      'f5': Key.F5,
      'f6': Key.F6,
      'f7': Key.F7,
      'f8': Key.F8,
      'f9': Key.F9,
      'f10': Key.F10,
      'f11': Key.F11,
      'f12': Key.F12,
    };

    const normalizedKey = keyName.toLowerCase().replace(/\s+/g, '');
    return keyMap[normalizedKey] || Key.Space;
  }

  private async performScroll(direction: string, amount: number): Promise<void> {
    const scrollAmount = amount * 100; // Multiply for more noticeable scrolling
    
    switch (direction.toLowerCase()) {
      case 'up':
        await mouse.scrollUp(scrollAmount);
        break;
      case 'down':
        await mouse.scrollDown(scrollAmount);
        break;
      case 'left':
        await mouse.scrollLeft(scrollAmount);
        break;
      case 'right':
        await mouse.scrollRight(scrollAmount);
        break;
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
