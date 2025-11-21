import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pythonProcess: ChildProcess | null = null;

export async function startPythonBridge(): Promise<void> {
  const pythonBridgePath = path.resolve(__dirname, '../python_bridge');
  const isWindows = process.platform === 'win32';
  
  console.log('🐍 Starting Python Bridge Server...');
  
  // Use system Python - much simpler and more reliable!
  const pythonExecutable = isWindows ? 'python' : 'python3';
  const serverScript = path.join(pythonBridgePath, 'server.py');
  
  // Check if server script exists
  if (!fs.existsSync(serverScript)) {
    throw new Error(`Server script not found at: ${serverScript}`);
  }
  
  return new Promise((resolve, reject) => {
    // Spawn Python process using system Python
    pythonProcess = spawn(pythonExecutable, [serverScript], {
      cwd: pythonBridgePath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
    });

    let startupTimeout: NodeJS.Timeout;
    let resolved = false;

    pythonProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      
      // Check if server is ready
      if (output.includes('Running on') || output.includes('http://127.0.0.1:5000') || output.includes('http://localhost:5000')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(startupTimeout);
          console.log('✅ Python Bridge ready on http://localhost:5000\n');
          resolve();
        }
      }
      
      // Show important startup messages
      if (output.includes('PyAutoGUI') || output.includes('FAILSAFE') || output.includes('Screen Size')) {
        console.log(`  ${output.trim()}`);
      }
    });

    pythonProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      
      // Check for missing dependencies
      if (error.includes('ModuleNotFoundError') || error.includes('No module named')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(startupTimeout);
          console.error('\n❌ Python dependencies not installed!');
          console.error('\nPlease run ONE of these commands:');
          console.error('  Windows: cd python_bridge && pip install -r requirements.txt');
          console.error('  Or run:  cd python_bridge && simple_install.bat\n');
          reject(new Error('Python dependencies missing. Run: pip install -r python_bridge/requirements.txt'));
        }
        return;
      }
      
      // Show other critical errors
      if (error.includes('SyntaxError') || error.includes('Exception:')) {
        console.error(`❌ Python Error: ${error.trim()}`);
      }
    });

    pythonProcess.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(startupTimeout);
        
        if (error.message.includes('ENOENT')) {
          console.error('\n❌ Python not found!');
          console.error('Please install Python 3.8+ from: https://www.python.org/downloads/\n');
          reject(new Error('Python not installed. Install from: https://www.python.org'));
        } else {
          console.error('❌ Failed to start Python Bridge:', error.message);
          reject(new Error(`Python Bridge failed to start: ${error.message}`));
        }
      }
    });

    pythonProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null && !resolved) {
        resolved = true;
        clearTimeout(startupTimeout);
        console.error(`❌ Python Bridge exited with code ${code}`);
        console.error('Check if dependencies are installed: pip install -r python_bridge/requirements.txt');
        reject(new Error(`Python Bridge exited with code ${code}`));
      }
    });

    // Timeout after 15 seconds
    startupTimeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.error('\n❌ Python Bridge startup timeout (15s)');
        console.error('Possible issues:');
        console.error('  1. Port 5000 is already in use');
        console.error('  2. Python dependencies not installed');
        console.error('  3. Firewall blocking Python\n');
        
        if (pythonProcess) {
          pythonProcess.kill();
        }
        reject(new Error('Python Bridge startup timeout'));
      }
    }, 15000);
  });
}

export function stopPythonBridge(): void {
  if (pythonProcess) {
    console.log('🛑 Stopping Python Bridge...');
    pythonProcess.kill('SIGTERM');
    pythonProcess = null;
  }
}

// Graceful shutdown handlers
process.on('SIGINT', () => {
  stopPythonBridge();
});

process.on('SIGTERM', () => {
  stopPythonBridge();
});

process.on('exit', () => {
  stopPythonBridge();
});
