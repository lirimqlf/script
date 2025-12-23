from flask import Flask, jsonify, request
import os
import requests
from datetime import datetime

app = Flask(__name__)

BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
RESULTS_GROUP_ID = os.getenv('TELEGRAM_GROUP_ID')

def format_duration(seconds):
    minutes = seconds // 60
    secs = seconds % 60
    return f"{minutes}:{secs:02d}"

def send_telegram_message(chat_id, text):
    if not BOT_TOKEN:
        return False
        
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def post_call_result_to_telegram(call_data):
    if not RESULTS_GROUP_ID:
        return False
        
    outcome = call_data.get('outcome', 'unknown')
    
    outcome_emoji = {
        'won': '🎉',
        'lost': '❌',
        'follow-up': '📝'
    }
    emoji = outcome_emoji.get(outcome, '📞')
    
    profile = call_data.get('profile', {})
    stats = call_data.get('stats', {})
    duration = call_data.get('duration', 0)
    
    result_message = f"""
{emoji} **Call Result: {outcome.upper()}**

**Contact:**
- Name: {profile.get('firstName', 'N/A')} {profile.get('lastName', 'N/A')}
- Company: {profile.get('company', 'N/A')}
- Phone: {profile.get('phoneNumber', 'N/A')}

**Call Details:**
- Script: {call_data.get('scriptName', 'N/A')}
- Duration: {format_duration(duration)}

**Sentiment Analysis:**
- Positive: {stats.get('positive', 0)} 👍
- Negative: {stats.get('negative', 0)} 👎
- Neutral: {stats.get('neutral', 0)} 😐
- Score: {stats.get('sentimentScore', 0)}

**Notes:**
{call_data.get('notes', 'No notes')}
    """
    
    return send_telegram_message(RESULTS_GROUP_ID, result_message)

@app.route('/api/call-result', methods=['POST'])
def submit_call_result():
    try:
        call_data = request.get_json()
        call_data['submitted_at'] = datetime.now().isoformat()
        
        telegram_success = post_call_result_to_telegram(call_data)
        
        return jsonify({
            "success": True,
            "message": "Call result submitted",
            "telegram_posted": telegram_success
        })
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
```

**File 3: `api/requirements.txt`**
```
Flask==3.0.0
requests==2.31.0
