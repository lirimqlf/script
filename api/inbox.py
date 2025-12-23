from flask import Flask, jsonify, request
import os
import json
from datetime import datetime

app = Flask(__name__)

# In-memory storage (will reset on cold start)
profiles_inbox = []

@app.route('/api/inbox', methods=['GET'])
def get_inbox():
    """Get all profiles from inbox"""
    return jsonify({
        "profiles": profiles_inbox,
        "count": len(profiles_inbox)
    })

@app.route('/api/inbox', methods=['POST'])
def add_to_inbox():
    """Add profile to inbox"""
    try:
        profile_data = request.get_json()
        
        if not profile_data.get('firstName') or not profile_data.get('lastName'):
            return jsonify({"error": "firstName and lastName are required"}), 400
        
        profile_data['received_at'] = datetime.now().isoformat()
        profile_data['source'] = 'web_app'
        
        profiles_inbox.append(profile_data)
        
        return jsonify({
            "success": True,
            "message": "Profile added to inbox",
            "profile": profile_data,
            "inbox_count": len(profiles_inbox)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
