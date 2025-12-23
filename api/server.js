const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for profiles
let inboxProfiles = [];

// Telegram Bot Token
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Helper function to send Telegram messages
async function sendTelegramMessage(chatId, text, options = {}) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: options.parse_mode || 'Markdown'
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Helper function to delete Telegram messages
async function deleteTelegramMessage(chatId, messageId) {
  try {
    const response = await fetch(`${TELEGRAM_API}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting message:', error);
  }
}

// Helper function to get file link
async function getTelegramFileLink(fileId) {
  try {
    const response = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    const data = await response.json();
    if (data.ok) {
      return `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${data.result.file_path}`;
    }
    throw new Error('Failed to get file');
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
}

// Helper function to set webhook
async function setWebhook(url) {
  try {
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return await response.json();
  } catch (error) {
    console.error('Error setting webhook:', error);
    throw error;
  }
}

// Helper function to get webhook info
async function getWebhookInfo() {
  try {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    return await response.json();
  } catch (error) {
    console.error('Error getting webhook info:', error);
    throw error;
  }
}

// Webhook endpoint for Telegram
app.post('/api/webhook', async (req, res) => {
  try {
    const update = req.body;
    
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text;

      // Handle /start command
      if (text === '/start') {
        await sendTelegramMessage(chatId, 
          '👋 *Welcome to @Vaulted Cold Call Manager Bot!*\n\n' +
          '🎯 *Available Commands:*\n' +
          '• `/upload` - Ready to upload a profile\n' +
          '• `/profiles` - View all profiles in inbox\n' +
          '• `/clear` - Clear all profiles\n' +
          '• `/help` - Show profile format\n\n' +
          '💡 Start by typing `/upload` to add a profile!'
        );
      }

      // Handle /upload command
      else if (text === '/upload') {
        await sendTelegramMessage(chatId,
          '📤 *Ready to Upload!*\n\n' +
          '📋 Send me a JSON file with the profile information.\n\n' +
          '✅ I\'ll confirm when it\'s uploaded successfully!'
        );
      }

      // Handle /help command
      else if (text === '/help') {
        await sendTelegramMessage(chatId,
          '📋 *Profile JSON Format:*\n\n' +
          '```json\n' +
          '{\n' +
          '  "firstName": "John",\n' +
          '  "lastName": "Doe",\n' +
          '  "company": "Acme Corp",\n' +
          '  "position": "Senior Developer",\n' +
          '  "phoneNumber": "+1 (555) 123-4567",\n' +
          '  "city": "San Francisco",\n' +
          '  "state": "CA"\n' +
          '}\n' +
          '```\n\n' +
          '📝 *Required fields:* firstName, lastName\n' +
          '📝 *Optional fields:* company, position, phoneNumber, city, state\n\n' +
          '💾 Save this as a .json file and send it to me!'
        );
      }

      // Handle /profiles command
      else if (text === '/profiles') {
        if (inboxProfiles.length === 0) {
          await sendTelegramMessage(chatId, 
            '📭 *Inbox is Empty*\n\n' +
            'No profiles uploaded yet.\n\n' +
            '💡 Type `/upload` to add a profile!'
          );
        } else {
          let message = `📋 *Current Profiles (${inboxProfiles.length}):*\n\n`;
          inboxProfiles.forEach((profile, idx) => {
            message += `${idx + 1}. *${profile.firstName} ${profile.lastName}*\n`;
            message += `   🏢 ${profile.company || 'No company'}\n`;
            message += `   📞 ${profile.phoneNumber || 'No phone'}\n\n`;
          });
          await sendTelegramMessage(chatId, message);
        }
      }

      // Handle /clear command
      else if (text === '/clear') {
        const count = inboxProfiles.length;
        inboxProfiles = [];
        await sendTelegramMessage(chatId, 
          `🗑️ *Inbox Cleared!*\n\n` +
          `Removed ${count} profile(s) from inbox.\n\n` +
          `💡 Type \`/upload\` to add new profiles.`
        );
      }

      // Handle document uploads
      if (msg.document) {
        const document = msg.document;

        if (!document.file_name.endsWith('.json')) {
          await sendTelegramMessage(chatId, 
            '❌ *Error: Invalid File Type*\n\n' +
            'Please send a JSON file (.json extension)\n\n' +
            '💡 Tip: Type `/help` to see the correct format'
          );
          return res.status(200).send('OK');
        }

        // Show processing message
        const processingMsg = await sendTelegramMessage(chatId, '⏳ Processing your profile...');

        try {
          const fileLink = await getTelegramFileLink(document.file_id);
          const response = await fetch(fileLink);
          const jsonText = await response.text();
          const profileData = JSON.parse(jsonText);

          const requiredFields = ['firstName', 'lastName'];
          const hasRequiredFields = requiredFields.every(field => profileData[field]);

          if (!hasRequiredFields) {
            if (processingMsg.ok) {
              await deleteTelegramMessage(chatId, processingMsg.result.message_id);
            }
            await sendTelegramMessage(chatId, 
              '❌ *Error: Missing Required Fields*\n\n' +
              'Your profile must include:\n' +
              '• firstName\n' +
              '• lastName\n\n' +
              '💡 Type `/help` to see the correct format'
            );
            return res.status(200).send('OK');
          }

          inboxProfiles.push({
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            company: profileData.company || '',
            position: profileData.position || '',
            phoneNumber: profileData.phoneNumber || '',
            city: profileData.city || '',
            state: profileData.state || '',
            timezone: profileData.timezone || ''
          });

          // Delete processing message
          if (processingMsg.ok) {
            await deleteTelegramMessage(chatId, processingMsg.result.message_id);
          }

          // Send success message with profile details
          await sendTelegramMessage(
            chatId,
            '✅ *Profile Uploaded Successfully!*\n\n' +
            '👤 *Name:* ' + profileData.firstName + ' ' + profileData.lastName + '\n' +
            '🏢 *Company:* ' + (profileData.company || 'Not provided') + '\n' +
            '💼 *Position:* ' + (profileData.position || 'Not provided') + '\n' +
            '📞 *Phone:* ' + (profileData.phoneNumber || 'Not provided') + '\n' +
            '📍 *Location:* ' + (profileData.city && profileData.state ? `${profileData.city}, ${profileData.state}` : 'Not provided') + '\n\n' +
            '📥 *Next Steps:*\n' +
            '1. Open your app: script-nine-orcin.vercel.app\n' +
            '2. Go to the "Inbox" tab\n' +
            '3. Click "LOAD PROFILE" to use it\n\n' +
            '🎯 Total profiles in inbox: ' + inboxProfiles.length
          );
        } catch (error) {
          if (processingMsg.ok) {
            await deleteTelegramMessage(chatId, processingMsg.result.message_id);
          }
          console.error('Error processing document:', error);
          await sendTelegramMessage(chatId, 
            '❌ *Error Processing File*\n\n' +
            'Make sure your file is valid JSON format.\n\n' +
            'Error: ' + error.message + '\n\n' +
            '💡 Type `/help` to see the correct format'
          );
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// API Routes

// Get all profiles in inbox
app.get('/api/inbox', (req, res) => {
  res.json({ profiles: inboxProfiles });
});

// Remove profile from inbox
app.delete('/api/inbox/:index', (req, res) => {
  const index = parseInt(req.params.index);
  if (index >= 0 && index < inboxProfiles.length) {
    inboxProfiles.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Profile not found' });
  }
});

// Submit call result to Telegram
app.post('/api/call-result', async (req, res) => {
  const callData = req.body;
  
  try {
    let message = `📞 *Call Completed*\n\n`;
    message += `📋 Script: ${callData.scriptName}\n`;
    message += `⏱️ Duration: ${Math.floor((callData.duration || 0) / 60)}:${((callData.duration || 0) % 60).toString().padStart(2, '0')}\n`;
    message += `📊 Outcome: ${callData.outcome?.toUpperCase()}\n\n`;
    
    if (callData.profile) {
      message += `👤 Contact:\n`;
      message += `   ${callData.profile.firstName} ${callData.profile.lastName}\n`;
      message += `   ${callData.profile.phoneNumber}\n`;
      message += `   ${callData.profile.company}\n\n`;
    }
    
    if (callData.stats) {
      message += `📈 Stats:\n`;
      message += `   ✅ Positive: ${callData.stats.positive}\n`;
      message += `   ❌ Negative: ${callData.stats.negative}\n`;
      message += `   ⚪ Neutral: ${callData.stats.neutral}\n`;
      message += `   💯 Score: ${callData.stats.sentimentScore}\n\n`;
    }
    
    if (callData.notes) {
      message += `📝 Notes:\n${callData.notes}\n`;
    }

    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
    
    if (ADMIN_CHAT_ID) {
      await sendTelegramMessage(ADMIN_CHAT_ID, message);
      res.json({ success: true });
    } else {
      console.log('No admin chat ID configured');
      res.json({ success: true, note: 'No admin chat configured' });
    }
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    profiles: inboxProfiles.length,
    telegram: !!TELEGRAM_TOKEN
  });
});

// Setup webhook endpoint - call this once after deploying
app.get('/api/setup', async (req, res) => {
  try {
    const webhookUrl = `https://script-nine-orcin.vercel.app/api/webhook`;
    const result = await setWebhook(webhookUrl);
    
    if (result.ok) {
      res.json({ 
        success: true, 
        message: 'Webhook configured successfully!',
        webhookUrl: webhookUrl,
        note: 'Your bot is now ready to receive messages'
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Failed to set webhook',
        error: result.description
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check webhook status
app.get('/api/webhook-info', async (req, res) => {
  try {
    const info = await getWebhookInfo();
    if (info.ok) {
      res.json({
        webhookUrl: info.result.url,
        pendingUpdates: info.result.pending_update_count,
        lastError: info.result.last_error_message || 'None',
        lastErrorDate: info.result.last_error_date || 'N/A'
      });
    } else {
      res.status(500).json({ error: 'Failed to get webhook info' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export for Vercel serverless
module.exports = app;
