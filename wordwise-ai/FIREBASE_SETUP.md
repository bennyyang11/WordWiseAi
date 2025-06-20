# Firebase Setup Guide for WordWise AI

## 🔥 Setting up Firebase Authentication & Database

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "wordwise-ai")
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

### Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication** → **Sign-in method**
2. Click on **Email/Password** provider
3. Enable **Email/Password** (first option)
4. Click **Save**

### Step 3: Enable Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)
5. Click **Done**

### Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** → **Web app** (</> icon)
4. Enter app nickname (e.g., "wordwise-web")
5. Click **Register app**
6. Copy the configuration object

### Step 5: Configure Environment Variables

Create a `.env` file in the `wordwise-ai` directory with:

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 6: Update Firestore Rules (Optional)

For better security in production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Users can only access their own essays
    match /essays/{essayId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### Step 7: Test the Setup

1. Restart your development server: `npm run dev`
2. Try creating a new account
3. Sign in with the created account
4. Check Firebase Console → Authentication to see the user
5. Check Firestore → Data to see user profile

## 🚨 Security Notes

- **Never commit `.env` files** to version control
- **Use Firebase Security Rules** in production
- **Enable App Check** for additional security
- **Monitor usage** in Firebase Console

## 🔧 Troubleshooting

### "Firebase configuration validation failed"
- Ensure all VITE_FIREBASE_* variables are set in `.env`
- Check for typos in environment variable names
- Restart the development server after changing `.env`

### "Auth domain not authorized"
- Go to Authentication → Settings → Authorized domains
- Add your domain (e.g., localhost:5174 for development)

### "Firestore permission denied"
- Check Firestore rules allow read/write for authenticated users
- Ensure user is properly authenticated

### "Network error"
- Check internet connection
- Verify Firebase project is active
- Check browser console for detailed errors

## 📚 What's Included

The Firebase backend now includes:

### Authentication Service (`src/services/authService.ts`)
- ✅ Email/password sign up
- ✅ Email/password sign in
- ✅ Sign out
- ✅ User state management
- ✅ Error handling with user-friendly messages

### User Service (`src/services/userService.ts`)
- ✅ User profile creation and storage
- ✅ Essay saving and retrieval
- ✅ User statistics tracking
- ✅ Progress monitoring

### Firebase Configuration (`src/lib/firebase.ts`)
- ✅ Secure Firebase initialization
- ✅ Environment validation
- ✅ Emulator support for development

### Features
- ✅ **Real Authentication**: No more fake passwords!
- ✅ **User Profiles**: Store name, native language, English level
- ✅ **Essay Storage**: Save essays with metadata
- ✅ **Progress Tracking**: Word count, essay count, average scores
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Loading States**: Proper loading indicators

## 🎉 You're Ready!

Your WordWise AI app now has a complete Firebase backend with:
- Secure user authentication
- User data storage
- Essay management
- Progress tracking

No more accepting any password - only real, authenticated users can access the app! 