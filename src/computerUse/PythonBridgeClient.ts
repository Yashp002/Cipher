/**
 * PythonBridge Client - TypeScript interface for Python desktop automation
 * Calls Python Flask server on localhost:5000
 */

const PYTHON_BRIDGE_URL = 'http://localhost:5000';

export interface MouseMoveParams {
  x: number;
  y: number;
  duration?: number;
}

export interface MouseClickParams {
  button?: 'left' | 'right' | 'middle';
  clicks?: number;
  interval?: number;
}

export interface MouseDragParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  duration?: number;
  button?: 'left' | 'right';
}

export interface MouseScrollParams {
  amount?: number;
  direction?: 'up' | 'down';
}

export interface KeyboardTypeParams {
  text: string;
  interval?: number;
}

export interface KeyboardPressParams {
  keys: string | string[];
  presses?: number;
  interval?: number;
}

export interface KeyboardHotkeyParams {
  keys: string[];
}

export interface ScreenshotParams {
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LocateImageParams {
  template_image: string; // base64
  confidence?: number;
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LocateTextParams {
  text: string;
}

export class PythonBridgeClient {
  private baseUrl: string;

  constructor(baseUrl: string = PYTHON_BRIDGE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`PythonBridge error: ${error.message}`);
      }
      throw error;
    }
  }

  // ============================================================================
  // MOUSE ACTIONS
  // ============================================================================

  async mouseMove(params: MouseMoveParams) {
    return this.request('/mouse/move', 'POST', params);
  }

  async mouseClick(params: MouseClickParams = {}) {
    return this.request('/mouse/click', 'POST', params);
  }

  async mouseDrag(params: MouseDragParams) {
    return this.request('/mouse/drag', 'POST', params);
  }

  async mouseScroll(params: MouseScrollParams = {}) {
    return this.request('/mouse/scroll', 'POST', params);
  }

  async getMousePosition() {
    return this.request('/mouse/position', 'GET');
  }

  // ============================================================================
  // KEYBOARD ACTIONS
  // ============================================================================

  async keyboardType(params: KeyboardTypeParams) {
    return this.request('/keyboard/type', 'POST', params);
  }

  async keyboardPress(params: KeyboardPressParams) {
    return this.request('/keyboard/press', 'POST', params);
  }

  async keyboardHotkey(params: KeyboardHotkeyParams) {
    return this.request('/keyboard/hotkey', 'POST', params);
  }

  // ============================================================================
  // SCREEN ACTIONS
  // ============================================================================

  async screenshot(params: ScreenshotParams = {}) {
    return this.request('/screenshot', 'POST', params);
  }

  async getScreenSize() {
    return this.request('/screen/size', 'GET');
  }

  // ============================================================================
  // IMAGE RECOGNITION
  // ============================================================================

  async locateImage(params: LocateImageParams) {
    return this.request('/locate/image', 'POST', params);
  }

  async locateText(params: LocateTextParams) {
    return this.request('/locate/text', 'POST', params);
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  async wait(duration: number) {
    return this.request('/wait', 'POST', { duration });
  }

  async abort() {
    return this.request('/abort', 'POST');
  }

  async healthCheck() {
    return this.request('/health', 'GET');
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if Python bridge is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute a sequence of actions
   */
  async executeSequence(actions: Array<() => Promise<any>>) {
    const results = [];
    for (const action of actions) {
      const result = await action();
      results.push(result);
    }
    return results;
  }

  /**
   * Move mouse and click in one action
   */
  async moveAndClick(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left') {
    await this.mouseMove({ x, y, duration: 0.5 });
    await this.wait(0.2);
    await this.mouseClick({ button });
  }

  /**
   * Type text and press Enter
   */
  async typeAndSubmit(text: string) {
    await this.keyboardType({ text });
    await this.wait(0.1);
    await this.keyboardPress({ keys: 'enter' });
  }

  /**
   * Find image and click it
   */
  async findAndClick(templateImage: string, confidence: number = 0.8) {
    const result = await this.locateImage({
      template_image: templateImage,
      confidence,
    });

    if (result.found) {
      await this.moveAndClick(result.x, result.y);
      return { success: true, position: { x: result.x, y: result.y } };
    }

    return { success: false, message: 'Image not found' };
  }
}

// Export singleton instance
export const pythonBridge = new PythonBridgeClient();
