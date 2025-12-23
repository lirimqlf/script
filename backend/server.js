const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for profiles (you can replace with a database)
let inboxProfiles = [];

// Initialize Telegram Bot
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('Telegram bot initialized successfully!');

// Telegram bot message handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Handle /start command
  if (text === '/start') {
    bot.sendMessage(chatId, 
      '👋 Welcome to @Vaulted Cold Call Manager Bot!\n\n' +
      '📋 To add a profile, send a JSON file with this format:\n\n' +
      '```json\n' +
      '{\n' +
      '  "firstName": "John",\n' +
      '  "lastName": "Doe",\n' +
      '  "company": "Acme Corp",\n' +
      '  "position": "Senior Developer",\n' +
      '  "phoneNumber": "+1 (555) 123-4567",\n' +
      '  "city": "San Francisco",\n' +
      '  "state": "CA",\n' +
      '  "timezone": "PT"\n' +
      '}\n' +
      '```\n\n' +
      '✅ The profile will appear in your app\'s inbox!',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Handle /profiles command - show all current profiles
  if (text === '/profiles') {
    if (inboxProfiles.length === 0) {
      bot.sendMessage(chatId, '📭 No profiles in inbox currently.');
    } else {
      let message = `📋 *Current Profiles (${inboxProfiles.length}):*\n\n`;
      inboxProfiles.forEach((profile, idx) => {
        message += `${idx + 1}. ${profile.firstName} ${profile.lastName} - ${profile.company}\n`;
      });
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    return;
  }

  // Handle /clear command - clear all profiles
  if (text === '/clear') {
    const count = inboxProfiles.length;
    inboxProfiles = [];
    bot.sendMessage(chatId, `🗑️ Cleared ${count} profile(s) from inbox.`);
    return;
  }
});

// Handle document uploads (JSON files)
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const document = msg.document;

  // Check if it's a JSON file
  if (!document.file_name.endsWith('.json')) {
    bot.sendMessage(chatId, '❌ Please send a JSON file (.json extension)');
    return;
  }

  try {
    // Get file from Telegram
    const fileLink = await bot.getFileLink(document.file_id);
    const response = await fetch(fileLink);
    const jsonText = await response.text();
    const profileData = JSON.parse(jsonText);

    // Validate profile data
    const requiredFields = ['firstName', 'lastName'];
    const hasRequiredFields = requiredFields.every(field => profileData[field]);

    if (!hasRequiredFields) {
      bot.sendMessage(chatId, '❌ Invalid profile format. Must include firstName and lastName.');
      return;
    }

    // Add to inbox
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

    bot.sendMessage(
      chatId,
      `✅ Profile added successfully!\n\n` +
      `👤 ${profileData.firstName} ${profileData.lastName}\n` +
      `🏢 ${profileData.company || 'N/A'}\n` +
      `📍 ${profileData.city && profileData.state ? `${profileData.city}, ${profileData.state}` : 'N/A'}\n\n` +
      `📥 Check your app's inbox to load this profile!`
    );
  } catch (error) {
    console.error('Error processing document:', error);
    bot.sendMessage(chatId, `❌ Error processing file: ${error.message}`);
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
    // Format the message
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

    // Send to the first chat that started the bot (you can modify this)
    // For production, you'd want to store admin chat IDs
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
    
    if (ADMIN_CHAT_ID) {
      await bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' });
      res.json({ success: true });
    } else {
      console.log('No admin chat ID configured, logging result:', message);
      res.json({ success: true, note: 'No admin chat configured' });
    }
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', profiles: inboxProfiles.length });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Telegram bot is active and listening for messages`);
});
