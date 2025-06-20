# Sample Content Generator Setup

The WordWiseAI application now includes a **Sample Content Generator** that uses OpenAI's API to create example essays, emails, letters, reports, and other content based on difficulty levels.

## Features

✅ **Writing Type Specific**: Generates content appropriate for the selected writing type (essay, email, letter, etc.)  
✅ **Difficulty Levels**: Choose between Beginner, Intermediate, and Advanced levels  
✅ **Real OpenAI Integration**: Uses GPT-3.5-turbo for intelligent content generation  
✅ **Fallback Content**: Provides mock examples if API is unavailable  
✅ **Copy & Use**: Copy generated content or use as a writing template  

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`)

### 2. Configure Environment Variables
Create a `.env` file in the project root with:

```env
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 3. Restart Development Server
```bash
npm run dev
```

## How to Use

1. **Select Writing Type**: Choose your writing type (Essay, Email, etc.)
2. **Open Writing Interface**: Click on any writing type to start writing
3. **Find Sample Generator**: Look for "Sample Content Generator" in the right sidebar
4. **Choose Difficulty**: Select Beginner, Intermediate, or Advanced level
5. **Generate Content**: Click "Generate Sample" to create new content
6. **Use Content**: Copy the generated text or use it as a template

## Content Types & Examples

### Essays
- **Beginner**: Simple vocabulary, basic sentence structures
- **Intermediate**: Academic vocabulary, complex sentences
- **Advanced**: Sophisticated arguments, advanced terminology

### Emails
- **Beginner**: Simple inquiry emails
- **Intermediate**: Job applications, formal requests
- **Advanced**: Business proposals, strategic communications

### Letters
- **Beginner**: Friendly, personal letters
- **Intermediate**: Complaint letters, formal correspondence
- **Advanced**: Recommendation letters, official communications

### Reports
- **Beginner**: Simple team updates
- **Intermediate**: Sales analysis, trend reports
- **Advanced**: Strategic analysis, market research

### Creative Writing
- **Beginner**: Simple stories with basic vocabulary
- **Intermediate**: Character development, plot structure
- **Advanced**: Complex narratives, literary techniques

### Casual Text
- **Beginner**: Simple conversations
- **Intermediate**: Opinion discussions
- **Advanced**: Complex social topics, cultural references

## Troubleshooting

### "Failed to generate sample content"
- Check that your OpenAI API key is correctly set in `.env`
- Ensure you have sufficient API credits
- Verify internet connection

### Mock Content Appears Instead
- This is normal if no API key is configured
- The app will show pre-written examples as fallbacks

### API Key Not Working
- Make sure the key starts with `sk-`
- Restart the development server after adding the key
- Check OpenAI platform for account status and billing

## Cost Considerations

- Each sample generation costs approximately $0.001-0.003
- The app uses GPT-3.5-turbo for cost efficiency
- Failed requests don't charge your account
- Monitor usage on the OpenAI platform

## Privacy & Security

- API key is only stored in your local environment
- Generated content is not stored by the application
- OpenAI may temporarily store content for safety purposes
- Do not commit your `.env` file to version control

## Support

If you need help setting up the sample content generator:
1. Check this guide first
2. Verify your OpenAI account status
3. Ensure API key is correctly formatted
4. Try generating content with a simple prompt first 