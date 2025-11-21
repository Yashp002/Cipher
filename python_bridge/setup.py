"""
Setup script to ensure Python Bridge dependencies are installed
This runs automatically when you start the server
"""
import subprocess
import sys
import os
from pathlib import Path

def setup_python_bridge():
    """Setup Python virtual environment and install dependencies"""
    
    print("=" * 60)
    print("  Setting up Python Bridge")
    print("=" * 60)
    
    # Get the directory containing this script
    script_dir = Path(__file__).parent
    venv_dir = script_dir / 'venv'
    requirements_file = script_dir / 'requirements.txt'
    
    # Check if venv exists
    if not venv_dir.exists():
        print("📦 Creating virtual environment...")
        subprocess.check_call([sys.executable, '-m', 'venv', str(venv_dir)])
        print("✅ Virtual environment created")
    
    # Determine pip path
    if os.name == 'nt':  # Windows
        pip_path = venv_dir / 'Scripts' / 'pip.exe'
        python_path = venv_dir / 'Scripts' / 'python.exe'
    else:  # Unix-like
        pip_path = venv_dir / 'bin' / 'pip'
        python_path = venv_dir / 'bin' / 'python'
    
    # Upgrade pip
    print("⬆️  Upgrading pip...")
    subprocess.check_call([str(python_path), '-m', 'pip', 'install', '--upgrade', 'pip'], 
                         stdout=subprocess.DEVNULL)
    
    # Install requirements
    if requirements_file.exists():
        print("📚 Installing dependencies...")
        subprocess.check_call([str(pip_path), 'install', '-r', str(requirements_file)],
                            stdout=subprocess.DEVNULL)
        print("✅ Dependencies installed")
    
    print("=" * 60)
    print("  Python Bridge Setup Complete!")
    print("=" * 60)

if __name__ == '__main__':
    try:
        setup_python_bridge()
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        sys.exit(1)
