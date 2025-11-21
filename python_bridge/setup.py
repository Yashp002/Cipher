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
    
    # Determine python path - check both locations
    if os.name == 'nt':  # Windows
        # Try both Scripts and bin directories
        scripts_python = venv_dir / 'Scripts' / 'python.exe'
        bin_python = venv_dir / 'bin' / 'python.exe'
        bin_python_noext = venv_dir / 'bin' / 'python'
        
        if scripts_python.exists():
            python_path = scripts_python
        elif bin_python.exists():
            python_path = bin_python
        elif bin_python_noext.exists():
            python_path = bin_python_noext
        else:
            python_path = scripts_python  # Default fallback
    else:  # Unix-like
        python_path = venv_dir / 'bin' / 'python'
    
    # Upgrade pip
    print("⬆️  Upgrading pip...")
    try:
        subprocess.check_call([str(python_path), '-m', 'pip', 'install', '--upgrade', 'pip'], 
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except:
        print("⚠️  Pip upgrade skipped")
    
    # Install requirements
    if requirements_file.exists():
        print("📚 Installing dependencies...")
        subprocess.check_call([str(python_path), '-m', 'pip', 'install', '-r', str(requirements_file)])
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
