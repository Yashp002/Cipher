import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pythonProcess: ChildProcess | null = null;

async function ensureSetup(pythonBridgePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('🔧 Checking Python Bridge setup...');
    
    const setupScript = path.join(pythonBridgePath, 'setup.py');
    const venvPath = path.join(pythonBridgePath, 'venv');
    
    // If venv exists, skip setup
    if (require('fs').existsSync(venvPath)) {
      console.log('✅ Python Bridge already set up');
      resolve();
      return;
    }
    
    console.log('📦 Running first-time setup (this may take a few minutes)...');
    
    const setupProcess = spawn('python', [setupScript], {
      cwd: pythonBridgePath,
      stdio: 'inherit',
    });
    
    setupProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Setup failed with code ${code}`));
      }
    });
    
    setupProcess.on('error', (error) => {
      reject(error);
    });
  });
}

export async function startPythonBridge(): Promise<void> {
  const pythonBridgePath = path.join(__dirname, '../python_bridge');
  const isWindows = process.platform === 'win32';
  
  try {
    // Ensure setup is complete
    await ensureSetup(pythonBridgePath);
    
    console.log('🐍 Starting Python Bridge...');

    // Check if virtual environment exists
    const venvPath = path.join(pythonBridgePath, 'venv');
    const pythonExecutable = isWindows 
      ? path.join(venvPath, 'Scripts', 'python.exe')
      : path.join(venvPath, 'bin', 'python');

    // Python script path
    const serverScript = path.join(pythonBridgePath, 'server.py');

    // Start Python process
    return new Promise((resolve, reject) => {
      pythonProcess = spawn(pythonExecutable, [serverScript], {
        cwd: pythonBridgePath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: isWindows,
      });

      let startupTimeout: NodeJS.Timeout;
      let resolved = false;

      pythonProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`[Python Bridge] ${output.trim()}`);
        
        // Check if server is ready
        if (output.includes('Running on') || output.includes('http://127.0.0.1:5000')) {
          if (!resolved) {
            resolved = true;
            clearTimeout(startupTimeout);
            console.log('✅ Python Bridge is ready on port 5000');
            resolve();
          }
        }
      });

      pythonProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        console.error(`[Python Bridge Error] ${error.trim()}`);
      });

      pythonProcess.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(startupTimeout);
          console.error('❌ Failed to start Python Bridge:', error.message);
          reject(new Error(`Python Bridge failed: ${error.message}`));
        }
      });

      pythonProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`❌ Python Bridge exited with code ${code}`);
          if (!resolved) {
            resolved = true;
            clearTimeout(startupTimeout);
            reject(new Error(`Python Bridge exited with code ${code}`));
          }
        }
      });

      // Timeout after 30 seconds
      startupTimeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.error('❌ Python Bridge startup timeout (30s)');
          reject(new Error('Python Bridge startup timeout'));
        }
      }, 30000);
    });
  } catch (error) {
    throw error;
  }
}

export function stopPythonBridge(): void {
  if (pythonProcess) {
    console.log('🛑 Stopping Python Bridge...');
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  stopPythonBridge();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopPythonBridge();
  process.exit(0);
});
