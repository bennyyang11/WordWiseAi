# WordWise AI - Vercel Deployment Guide

## Quick Deployment Steps

### 1. Push to GitHub (No API Keys)
```bash
git add .
git commit -m "Deploy: WordWise AI with secure configuration"
git push origin main
```

### 2. Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**: `bennyyang11/WordWiseAi`
4. **Configure Environment Variables** (CRITICAL for AI features):

   ```
   VITE_OPENAI_API_KEY = sk-your-actual-openai-api-key-here
   ```

5. **Deploy Settings**:
   - Framework Preset: `Vite`
   - Root Directory: `wordwise-ai`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3. Environment Variables Setup

In Vercel Dashboard → Project → Settings → Environment Variables, add:

| Variable Name | Value | Environment |
|---------------|--------|-------------|
| `VITE_OPENAI_API_KEY` | `sk-proj-...your actual key` | Production, Preview, Development |

**🔑 IMPORTANT**: 
- Your OpenAI API key is stored securely in Vercel
- It's never exposed in your GitHub repository
- The app will have full AI functionality when deployed

### 4. Test Deployment

1. After deployment, visit your Vercel URL
2. Click "Load Test Case" to load error-heavy text
3. Click "Analyze Text" to test AI error detection
4. Verify that errors are being caught and highlighted

## AI Features That Will Work

✅ **Real-time grammar checking**
✅ **Spelling error detection** 
✅ **Vocabulary suggestions**
✅ **Writing style improvements**
✅ **ESL-specific feedback**
✅ **Multiple proficiency levels**
✅ **Interactive error tooltips**

## Troubleshooting

### No AI Analysis Working
- Check that `VITE_OPENAI_API_KEY` is set in Vercel environment variables
- Verify the API key starts with `sk-proj-` and is valid
- Check browser console for error messages

### Build Fails
- Ensure Root Directory is set to `wordwise-ai`
- Check that all dependencies are in `package.json`

### Styling Issues
- Verify Tailwind CSS is building correctly
- Check that all components are importing styles properly

## Local Development

To run locally with AI features:

1. Copy `.env.example` to `.env`
2. Add your real OpenAI API key to `.env`
3. Run `npm run dev`

## Security Notes

✅ **Secure**: API key is in Vercel environment variables only
✅ **Safe**: No secrets in GitHub repository  
✅ **Best Practice**: Uses environment variables for configuration

Your AI-powered writing assistant is now ready for production! 🚀 