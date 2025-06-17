# WordWise AI Setup Guide

## Adding Your OpenAI API Key

To enable real-time grammar and spell checking with ChatGPT, you need to add your OpenAI API key:

### Step 1: Create Environment File
Create a file named `.env` in the `wordwise-ai` folder with the following content:

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_actual_api_key_here

# Firebase Configuration (optional - for future features)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Step 2: Replace the API Key
Replace `your_actual_api_key_here` with your actual OpenAI API key (starts with `sk-...`)

### Step 3: Restart the Development Server
After adding the API key, restart your development server:

```bash
npm run dev
```

## Features

### Real-time Analysis
- **Grammar Check**: Detects grammar errors and provides suggestions
- **Spell Check**: Identifies spelling mistakes with corrections
- **Vocabulary Enhancement**: Suggests better word choices for academic writing
- **Style & Clarity**: Provides tips for better sentence structure and flow
- **ESL Tips**: Specialized feedback for English as Second Language learners

### How It Works
1. Start typing in the essay editor
2. After 10+ characters, analysis begins automatically
3. Wait 1.5 seconds after stopping typing for suggestions to appear
4. View real-time score and feedback in the right panel

### Fallback Mode
If no API key is provided, the app will use mock suggestions to demonstrate functionality.

## Security Note
**Important**: The current setup uses `dangerouslyAllowBrowser: true` for demonstration purposes. In a production environment, you should:

1. Create a backend API to proxy OpenAI requests
2. Never expose API keys in frontend code
3. Implement proper authentication and rate limiting

## Troubleshooting

### API Key Not Working
- Ensure your API key starts with `sk-`
- Check that you have credits available in your OpenAI account
- Verify the key has the correct permissions

### No Suggestions Appearing
- Make sure you've typed at least 10 characters
- Wait 1.5 seconds after stopping typing
- Check the browser console for any error messages

### Environment Variables Not Loading
- Ensure the `.env` file is in the `wordwise-ai` folder (same level as `package.json`)
- Restart the development server after creating/modifying `.env`
- Environment variables must start with `VITE_` to be accessible in the frontend 