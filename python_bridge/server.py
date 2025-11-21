"""
PythonBridge Server - Desktop Automation Backend for Cipher AI Assistant
Uses PyAutoGUI for reliable cross-platform mouse/keyboard control
Runs on localhost:5000 with REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyautogui
import cv2
import numpy as np
from PIL import Image
import base64
import io
import time
import os
from typing import Tuple, Optional

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure PyAutoGUI
pyautogui.FAILSAFE = True  # Move mouse to top-left corner to abort
pyautogui.PAUSE = 0.1  # 100ms delay between actions for safety

# Get screen size at startup
SCREEN_WIDTH, SCREEN_HEIGHT = pyautogui.size()

print("=" * 60)
print("🐍 PythonBridge Server for Cipher AI Assistant")
print("=" * 60)
print(f"✅ PyAutoGUI initialized")
print(f"📺 Screen Size: {SCREEN_WIDTH}x{SCREEN_HEIGHT}")
print(f"🛡️  FAILSAFE enabled: Move mouse to top-left corner to abort")
print(f"🚀 Server starting on http://localhost:5000")
print("=" * 60)


# ============================================================================
# MOUSE ACTIONS
# ============================================================================

@app.route('/mouse/move', methods=['POST'])
def mouse_move():
    """
    Move mouse to specified coordinates
    Body: {x: int, y: int, duration: float}
    """
    try:
        data = request.json
        x = data.get('x')
        y = data.get('y')
        duration = data.get('duration', 0.5)  # Default 0.5 seconds
        
        if x is None or y is None:
            return jsonify({'error': 'Missing x or y coordinates'}), 400
        
        # Validate coordinates
        if not (0 <= x <= SCREEN_WIDTH and 0 <= y <= SCREEN_HEIGHT):
            return jsonify({
                'error': f'Coordinates out of bounds. Screen size: {SCREEN_WIDTH}x{SCREEN_HEIGHT}'
            }), 400
        
        pyautogui.moveTo(x, y, duration=duration)
        
        return jsonify({
            'success': True,
            'action': 'mouse_move',
            'x': x,
            'y': y,
            'duration': duration
        })
    
    except pyautogui.FailSafeException:
        return jsonify({'error': 'FAILSAFE triggered - action aborted'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/mouse/click', methods=['POST'])
def mouse_click():
    """
    Click mouse button
    Body: {button: 'left'|'right'|'middle', clicks: int, interval: float}
    """
    try:
        data = request.json
        button = data.get('button', 'left')
        clicks = data.get('clicks', 1)
        interval = data.get('interval', 0.1)
        
        # Validate button
        if button not in ['left', 'right', 'middle']:
            return jsonify({'error': 'Invalid button. Must be left, right, or middle'}), 400
        
        pyautogui.click(button=button, clicks=clicks, interval=interval)
        
        return jsonify({
            'success': True,
            'action': 'mouse_click',
            'button': button,
            'clicks': clicks
        })
    
    except pyautogui.FailSafeException:
        return jsonify({'error': 'FAILSAFE triggered - action aborted'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/mouse/drag', methods=['POST'])
def mouse_drag():
    """
    Drag mouse from one position to another
    Body: {x1: int, y1: int, x2: int, y2: int, duration: float, button: 'left'|'right'}
    """
    try:
        data = request.json
        x1 = data.get('x1')
        y1 = data.get('y1')
        x2 = data.get('x2')
        y2 = data.get('y2')
        duration = data.get('duration', 0.5)
        button = data.get('button', 'left')
        
        if any(coord is None for coord in [x1, y1, x2, y2]):
            return jsonify({'error': 'Missing coordinates'}), 400
        
        # Move to start position first
        pyautogui.moveTo(x1, y1, duration=0.2)
        time.sleep(0.1)
        
        # Perform drag
        pyautogui.drag(x2 - x1, y2 - y1, duration=duration, button=button)
        
        return jsonify({
            'success': True,
            'action': 'mouse_drag',
            'from': {'x': x1, 'y': y1},
            'to': {'x': x2, 'y': y2},
            'duration': duration
        })
    
    except pyautogui.FailSafeException:
        return jsonify({'error': 'FAILSAFE triggered - action aborted'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/mouse/scroll', methods=['POST'])
def mouse_scroll():
    """
    Scroll mouse wheel
    Body: {amount: int, direction: 'up'|'down'}
    """
    try:
        data = request.json
        amount = data.get('amount', 1)
        direction = data.get('direction', 'down')
        
        # Positive for up, negative for down
        scroll_amount = amount if direction == 'up' else -amount
        
        pyautogui.scroll(scroll_amount * 100)  # Multiply for more visible scrolling
        
        return jsonify({
            'success': True,
            'action': 'mouse_scroll',
            'direction': direction,
            'amount': amount
        })
    
    except pyautogui.FailSafeException:
        return jsonify({'error': 'FAILSAFE triggered - action aborted'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/mouse/position', methods=['GET'])
def mouse_position():
    """Get current mouse position"""
    try:
        x, y = pyautogui.position()
        return jsonify({
            'success': True,
            'x': x,
            'y': y
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# KEYBOARD ACTIONS
# ============================================================================

@app.route('/keyboard/type', methods=['POST'])
def keyboard_type():
    """
    Type text
    Body: {text: str, interval: float}
    """
    try:
        data = request.json
        text = data.get('text', '')
        interval = data.get('interval', 0.05)  # Default 50ms between keys
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        pyautogui.write(text, interval=interval)
        
        return jsonify({
            'success': True,
            'action': 'keyboard_type',
            'text': text,
            'length': len(text)
        })
    
    except pyautogui.FailSafeException:
        return jsonify({'error': 'FAILSAFE triggered - action aborted'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/keyboard/press', methods=['POST'])
def keyboard_press():
    """
    Press keyboard key(s)
    Body: {keys: str|list, presses: int, interval: float}
    Examples:
    - Single key: {keys: "enter"}
    - Key combo: {keys: ["ctrl", "c"]}
    - Multiple presses: {keys: "a", presses: 3}
    """
    try:
        data = request.json
        keys = data.get('keys')
        presses = data.get('presses', 1)
        interval = data.get('interval', 0.1)
        
        if not keys:
            return jsonify({'error': 'No keys provided'}), 400
        
        # Handle key combinations (list) vs single key (string)
        if isinstance(keys, list):
            # Key combination (e.g., Ctrl+C)
            for _ in range(presses):
                pyautogui.hotkey(*keys)
                if presses > 1:
                    time.sleep(interval)
        else:
            # Single key
            for _ in range(presses):
                pyautogui.press(keys)
                if presses > 1:
                    time.sleep(interval)
        
        return jsonify({
            'success': True,
            'action': 'keyboard_press',
            'keys': keys,
            'presses': presses
        })
    
    except pyautogui.FailSafeException:
        return jsonify({'error': 'FAILSAFE triggered - action aborted'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/keyboard/hotkey', methods=['POST'])
def keyboard_hotkey():
    """
    Press a keyboard shortcut
    Body: {keys: list} - e.g., ["ctrl", "shift", "s"]
    """
    try:
        data = request.json
        keys = data.get('keys', [])
        
        if not keys or not isinstance(keys, list):
            return jsonify({'error': 'Keys must be a non-empty list'}), 400
        
        pyautogui.hotkey(*keys)
        
        return jsonify({
            'success': True,
            'action': 'keyboard_hotkey',
            'keys': keys
        })
    
    except pyautogui.FailSafeException:
        return jsonify({'error': 'FAILSAFE triggered - action aborted'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# SCREEN ACTIONS
# ============================================================================

@app.route('/screenshot', methods=['POST', 'GET'])
def take_screenshot():
    """
    Take a screenshot and return as base64
    Body (optional): {region: {x: int, y: int, width: int, height: int}}
    """
    try:
        data = request.json if request.method == 'POST' else {}
        region = data.get('region') if data else None
        
        # Take screenshot
        if region:
            screenshot = pyautogui.screenshot(region=(
                region['x'],
                region['y'],
                region['width'],
                region['height']
            ))
        else:
            screenshot = pyautogui.screenshot()
        
        # Convert to base64
        buffer = io.BytesIO()
        screenshot.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return jsonify({
            'success': True,
            'image': img_base64,
            'format': 'png',
            'size': {
                'width': screenshot.width,
                'height': screenshot.height
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/screen/size', methods=['GET'])
def screen_size():
    """Get screen dimensions"""
    try:
        width, height = pyautogui.size()
        return jsonify({
            'success': True,
            'width': width,
            'height': height
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# IMAGE RECOGNITION (OpenCV)
# ============================================================================

@app.route('/locate/image', methods=['POST'])
def locate_image():
    """
    Find image on screen using OpenCV template matching
    Body: {template_image: base64, confidence: float, region: {x, y, width, height}}
    Returns: {found: bool, x: int, y: int, confidence: float}
    """
    try:
        data = request.json
        template_base64 = data.get('template_image')
        confidence_threshold = data.get('confidence', 0.8)
        region = data.get('region')
        
        if not template_base64:
            return jsonify({'error': 'No template image provided'}), 400
        
        # Decode template image
        template_data = base64.b64decode(template_base64)
        template_array = np.frombuffer(template_data, dtype=np.uint8)
        template = cv2.imdecode(template_array, cv2.IMREAD_COLOR)
        
        if template is None:
            return jsonify({'error': 'Invalid template image'}), 400
        
        # Take screenshot
        if region:
            screenshot_pil = pyautogui.screenshot(region=(
                region['x'], region['y'], region['width'], region['height']
            ))
            offset_x, offset_y = region['x'], region['y']
        else:
            screenshot_pil = pyautogui.screenshot()
            offset_x, offset_y = 0, 0
        
        # Convert PIL to OpenCV format
        screenshot = cv2.cvtColor(np.array(screenshot_pil), cv2.COLOR_RGB2BGR)
        
        # Perform template matching
        result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
        
        if max_val >= confidence_threshold:
            # Found! Calculate center position
            template_height, template_width = template.shape[:2]
            center_x = max_loc[0] + template_width // 2 + offset_x
            center_y = max_loc[1] + template_height // 2 + offset_y
            
            return jsonify({
                'success': True,
                'found': True,
                'x': center_x,
                'y': center_y,
                'confidence': float(max_val),
                'top_left': {
                    'x': max_loc[0] + offset_x,
                    'y': max_loc[1] + offset_y
                }
            })
        else:
            return jsonify({
                'success': True,
                'found': False,
                'best_confidence': float(max_val),
                'message': f'Image not found (best match: {max_val:.2f}, threshold: {confidence_threshold})'
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/locate/text', methods=['POST'])
def locate_text():
    """
    Find text on screen (requires pytesseract - optional)
    Body: {text: str}
    """
    try:
        # This requires pytesseract which may not be installed
        import pytesseract
        from PIL import Image
        
        data = request.json
        search_text = data.get('text', '').lower()
        
        if not search_text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Take screenshot
        screenshot = pyautogui.screenshot()
        
        # Perform OCR
        ocr_data = pytesseract.image_to_data(screenshot, output_type=pytesseract.Output.DICT)
        
        # Search for text
        for i, text in enumerate(ocr_data['text']):
            if search_text in text.lower():
                x = ocr_data['left'][i] + ocr_data['width'][i] // 2
                y = ocr_data['top'][i] + ocr_data['height'][i] // 2
                
                return jsonify({
                    'success': True,
                    'found': True,
                    'x': x,
                    'y': y,
                    'text': text,
                    'confidence': ocr_data['conf'][i]
                })
        
        return jsonify({
            'success': True,
            'found': False,
            'message': 'Text not found on screen'
        })
    
    except ImportError:
        return jsonify({
            'error': 'pytesseract not installed. Install with: pip install pytesseract'
        }), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'PythonBridge',
        'version': '1.0.0',
        'screen_size': {
            'width': SCREEN_WIDTH,
            'height': SCREEN_HEIGHT
        },
        'failsafe': pyautogui.FAILSAFE,
        'pause': pyautogui.PAUSE
    })


@app.route('/wait', methods=['POST'])
def wait():
    """
    Wait/sleep for specified duration
    Body: {duration: float} - duration in seconds
    """
    try:
        data = request.json
        duration = data.get('duration', 1.0)
        
        if duration < 0 or duration > 60:
            return jsonify({'error': 'Duration must be between 0 and 60 seconds'}), 400
        
        time.sleep(duration)
        
        return jsonify({
            'success': True,
            'action': 'wait',
            'duration': duration
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/abort', methods=['POST'])
def abort_all():
    """Emergency abort - stops all PyAutoGUI actions"""
    try:
        pyautogui.failSafeCheck()
        return jsonify({
            'success': True,
            'message': 'All actions aborted'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("\n🎯 API Endpoints Available:")
    print("   POST /mouse/move - Move mouse")
    print("   POST /mouse/click - Click mouse")
    print("   POST /mouse/drag - Drag mouse")
    print("   POST /mouse/scroll - Scroll wheel")
    print("   GET  /mouse/position - Get mouse position")
    print("   POST /keyboard/type - Type text")
    print("   POST /keyboard/press - Press key(s)")
    print("   POST /keyboard/hotkey - Press keyboard shortcut")
    print("   POST /screenshot - Take screenshot")
    print("   GET  /screen/size - Get screen dimensions")
    print("   POST /locate/image - Find image on screen")
    print("   POST /locate/text - Find text on screen (OCR)")
    print("   POST /wait - Wait/sleep")
    print("   POST /abort - Emergency abort")
    print("   GET  /health - Health check")
    print("\n💡 Tip: Move mouse to top-left corner to trigger FAILSAFE\n")
    
    app.run(host='127.0.0.1', port=5000, debug=False)
