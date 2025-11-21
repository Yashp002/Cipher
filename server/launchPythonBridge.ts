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
  
  console.log('🔧 Checking Python Bridge setup...');
  console.log(`📁 Path: ${pythonBridgePath}`);
  
  // Check if venv exists
  const venvPath = path.join(pythonBridgePath, 'venv');
  
  if (!fs.existsSync(venvPath)) {
    console.log('📦 First-time setup required. Installing Python dependencies...');
    console.log('⏳ This will take 2-5 minutes. Please wait...');
    
    const setupScript = path.join(pythonBridgePath, 'setup.py');
    
    await new Promise<void>((resolve, reject) => {
      const setupProcess = spawn('python', [setupScript], {
        cwd: pythonBridgePath,
        stdio: 'inherit',
      });
      
      setupProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('✅ Python Bridge setup complete!');
          resolve();
        } else {
          reject(new Error(`Setup failed with exit code ${code}`));
        }
      });
      
      setupProcess.on('error', (error) => {
        reject(new Error(`Setup failed: ${error.message}`));
      });
    });
  } else {
    console.log('✅ Python Bridge already set up');
  }
  
  console.log('🐍 Starting Python Bridge...');
  
  // Determine Python executable path - check both Windows and Unix-style paths
  let pythonExecutable: string;
  
  if (isWindows) {
    // Try Scripts first (standard Windows), then bin (Unix-style on Windows)
    const scriptsPath = path.join(venvPath, 'Scripts', 'python.exe');
    const binPath = path.join(venvPath, 'bin', 'python.exe');
    const binPython = path.join(venvPath, 'bin', 'python');
    
    if (fs.existsSync(scriptsPath)) {
      pythonExecutable = scriptsPath;
    } else if (fs.existsSync(binPath)) {
      pythonExecutable = binPath;
    } else if (fs.existsSync(binPython)) {
      pythonExecutable = binPython;
    } else {
      throw new Error(`Python executable not found. Tried:\n- ${scriptsPath}\n- ${binPath}\n- ${binPython}`);
    }
  } else {
    pythonExecutable = path.join(venvPath, 'bin', 'python');
    if (!fs.existsSync(pythonExecutable)) {
      throw new Error(`Python executable not found at: ${pythonExecutable}`);
    }
  }
  
  console.log(`📍 Using Python: ${pythonExecutable}`);
  
  const serverScript = path.join(pythonBridgePath, 'server.py');
  
  // Check if server script exists
  if (!fs.existsSync(serverScript)) {
    throw new Error(`Server script not found at: ${serverScript}`);
  }
  
  return new Promise((resolve, reject) => {
    // Spawn Python process WITHOUT shell option for security
    pythonProcess = spawn(pythonExecutable, [serverScript], {
      cwd: pythonBridgePath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1', // Ensure unbuffered output
      },
    });

    let startupTimeout: NodeJS.Timeout;
    let resolved = false;

    pythonProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      // Only show important messages
      if (output.includes('PythonBridge') || 
          output.includes('Running on') || 
          output.includes('initialized') ||
          output.includes('Error')) {
        console.log(`[Python Bridge] ${output.trim()}`);
      }
      
      // Check if server is ready
      if (output.includes('Running on') || output.includes('http://127.0.0.1:5000')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(startupTimeout);
          console.log('✅ Python Bridge ready on http://localhost:5000');
          resolve();
        }
      }
    });

    pythonProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      // Only show actual errors, not warnings
      if (error.includes('Error') || error.includes('Failed') || error.includes('Exception')) {
        console.error(`[Python Bridge Error] ${error.trim()}`);
      }
    });

    pythonProcess.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(startupTimeout);
        console.error('❌ Failed to start Python Bridge:', error.message);
        reject(new Error(`Python Bridge failed to start: ${error.message}`));
      }
    });

    pythonProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null && !resolved) {
        resolved = true;
        clearTimeout(startupTimeout);
        console.error(`❌ Python Bridge exited with code ${code}`);
        reject(new Error(`Python Bridge exited with code ${code}`));
      }
    });

    // Timeout after 30 seconds
    startupTimeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.error('❌ Python Bridge startup timeout (30s)');
        if (pythonProcess) {
          pythonProcess.kill();
        }
        reject(new Error('Python Bridge startup timeout. Check if port 5000 is already in use.'));
      }
    }, 30000);
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
