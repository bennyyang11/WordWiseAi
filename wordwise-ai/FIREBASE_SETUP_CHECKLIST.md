# Firebase Setup Checklist for WordWise AI

## 🔥 Required Firebase Services

### 1. Authentication Setup
- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select your `wordwise-ai-eeac5` project
- [ ] Click **Authentication** in left sidebar
- [ ] Click **Sign-in method** tab
- [ ] Enable **Email/password** provider
- [ ] Enable **Anonymous** provider (for testing)

### 2. Firestore Database Setup
- [ ] Click **Firestore Database** in left sidebar
- [ ] If you see "Get started", click it to create database
- [ ] Choose **Test mode** for now (we'll secure it later)
- [ ] Select a location (preferably close to your users)
- [ ] Click **Done**

### 3. Firestore Security Rules
- [ ] In Firestore Database, click **Rules** tab
- [ ] Replace default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write essays
    match /essays/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow test documents for debugging
    match /test/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

- [ ] Click **Publish**

### 4. Billing Setup (Required for Firestore)
- [ ] Click **Usage and billing** in left sidebar
- [ ] Click **Details & settings**
- [ ] If on Spark (free) plan, click **Modify plan**
- [ ] Select **Blaze (pay-as-you-go)** plan
- [ ] Add payment method
- [ ] **Note**: Firestore has generous free tier, so cost should be minimal for development

### 5. Project Configuration
- [ ] Click **Project settings** (gear icon)
- [ ] Click **General** tab
- [ ] Verify **Project ID**: `wordwise-ai-eeac5`
- [ ] Copy your config object and compare with your `.env` file

### 6. API Key Restrictions (if applicable)
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Select your project
- [ ] Go to **APIs & Services** → **Credentials**
- [ ] Click on your API key
- [ ] Make sure these APIs are allowed:
  - Cloud Firestore API
  - Firebase Authentication API
  - Identity and Access Management (IAM) API

## 🚨 Most Common Issues

1. **Firestore Database not created** → Creates 400 errors on write
2. **Authentication not enabled** → Blocks security rules
3. **No billing enabled** → Firestore requires paid plan
4. **Default security rules** → Block all operations

## ✅ Testing Your Setup

After completing the checklist, test your setup:

1. Open your app
2. Click "🔧 Show Debug Info"
3. Click "Run Firebase Test"
4. All tests should pass ✅

## 🔧 Debug Command

If you're still getting errors, run this in your browser console:

```javascript
// Check Firebase config
console.log('Firebase Config:', {
  projectId: firebase.app().options.projectId,
  authDomain: firebase.app().options.authDomain,
  hasAuth: !!firebase.auth().currentUser
});

// Test Firestore connection
firebase.firestore().enableNetwork()
  .then(() => console.log('✅ Firestore connected'))
  .catch(err => console.error('❌ Firestore error:', err));
```

## 📞 Need Help?

If you're still getting 400 errors after this checklist:
1. Share a screenshot of your Firebase Console → Firestore Database page
2. Share a screenshot of your Firebase Console → Authentication page  
3. Let me know what step failed in the Debug Panel test 