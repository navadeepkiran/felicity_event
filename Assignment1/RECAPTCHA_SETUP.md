# reCAPTCHA Setup Guide

## Current Status
- **Frontend**: reCAPTCHA component removed (no UI widget)
- **Backend**: Validation completely disabled (no checks)
- **Reason**: Simplifies local development and avoids domain verification errors

## ✅ Why reCAPTCHA is Currently Disabled

During development, reCAPTCHA causes issues because:
1. Google reCAPTCHA requires domain verification
2. Localhost domains are not pre-verified
3. Changing URLs during deployment breaks existing keys
4. Adds unnecessary friction for testing

## 🔧 Re-enabling reCAPTCHA for Production (Optional)

If you want bot protection in production, follow these steps:

### Step 1: Register Domain with Google reCAPTCHA
1. Go to https://www.google.com/recaptcha/admin
2. Register a new site with:
   - **Label**: Felicity Event Management
   - **reCAPTCHA Type**: v2 Checkbox
   - **Domains**: 
     - `felicity-event.vercel.app` (frontend)
     - `felicity-event.onrender.com` (backend)
3. Copy the **Site Key** and **Secret Key**

### Step 2: Update Environment Variables

**Frontend** (`Assignment1/frontend/.env.production`):
```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

**Backend** (Render Environment Variables):
```env
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### Step 3: Re-enable Frontend reCAPTCHA Components

**File**: `frontend/src/pages/Auth/Login.jsx`
```javascript
// ADD back import
import ReCAPTCHA from 'react-google-recaptcha';

// ADD back ref
const recaptchaRef = useRef();

// ADD back state
const [captchaToken, setCaptchaToken] = useState(null);

// ADD validation in handleSubmit
if (!captchaToken) {
  setErrorMessage('Please complete the reCAPTCHA verification');
  return;
}

// ADD back JSX (replace production-bypass)
<div className="form-group" style={{ display: 'flex', justifyContent: 'center' }}>
  <ReCAPTCHA
    ref={recaptchaRef}
    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
    onChange={(token) => setCaptchaToken(token)}
  />
</div>
```

Repeat same changes for `frontend/src/pages/Auth/Register.jsx`.

### Step 4: Re-enable Backend reCAPTCHA Validation

**File**: `backend/routes/auth.js`

**For Login Route** (line 120):
```javascript
// RESTORE reCAPTCHA validation
const { captchaToken } = req.body;
if (!captchaToken) {
  return res.status(400).json({ 
    success: false, 
    message: 'reCAPTCHA verification is required' 
  });
}

const isValidCaptcha = await verifyRecaptcha(captchaToken);
if (!isValidCaptcha) {
  return res.status(400).json({ 
    success: false, 
    message: 'reCAPTCHA verification failed. Please try again.' 
  });
}
```

**For Register Route** (line 35):
```javascript
// Same reCAPTCHA validation as login
```

### Step 5: Update verifyRecaptcha Function

**File**: `backend/utils/recaptcha.js`
```javascript
export const verifyRecaptcha = async (token) => {
  // Skip in development only
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  reCAPTCHA skipped in development mode');
    return true;
  }
  
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false; // Fail closed in production
  }
};
```

## 📊 Trade-offs

### Current Approach (No reCAPTCHA)
✅ **Pros:**
- Faster development workflow
- No domain verification headaches
- Easier testing with automated tools
- Better user experience
- No third-party dependency

❌ **Cons:**
- No bot protection on login/register
- Vulnerable to automated spam accounts

### With reCAPTCHA
✅ **Pros:**
- Bot protection
- Spam prevention
- Professional appearance

❌ **Cons:**
- Extra setup complexity
- Domain verification required
- Slower registration flow
- Privacy concerns (Google tracking)
- API quota limits

## 🎯 Recommendation

**For Academic/Testing**: **Current setup (no reCAPTCHA) is PERFECT**
- Focuses on core features
- Easy to demonstrate
- No friction for test accounts

**For Production**: **Add reCAPTCHA only if experiencing bot attacks**
- Monitor registration patterns first
- Implement rate limiting as first defense
- Add reCAPTCHA if automated abuse detected

## 🔒 Alternative Bot Protection (Better than reCAPTCHA)

Instead of reCAPTCHA, consider:

1. **Rate Limiting** (Already implemented)
   - Max 5 failed login attempts per IP
   - Cooldown period

2. **Email Verification** (Already implemented)
   - Confirms real email addresses
   - Prevents fake accounts

3. **Progressive Security**
   - Start without reCAPTCHA
   - Add if abuse detected
   - Only affects suspicious IPs

## 📝 Current Implementation Status

| Component | Status | Note |
|-----------|--------|------|
| Frontend Widget | ❌ Removed | Cleaner UI, no Google dependencies |
| Frontend Validation | ❌ Removed | Bypass token sent as 'production-bypass' |
| Backend Validation | ❌ Disabled | Always returns true |
| Email Verification | ✅ Active | Primary bot defense |
| Rate Limiting | ✅ Active | Prevents brute force |

## 🚀 Deployment Checklist

- [x] Backend deployed without reCAPTCHA errors
- [x] Frontend deployed without reCAPTCHA errors  
- [x] Login works smoothly
- [x] Registration works smoothly
- [ ] (Optional) Register reCAPTCHA domains if bot attacks occur
- [ ] (Optional) Re-enable reCAPTCHA following steps above

## ℹ️ Support

If you decide to enable reCAPTCHA later and encounter issues:
1. Verify domain is correctly registered in Google Console
2. Check site key matches in frontend .env
3. Check secret key matches in backend Render env vars
4. Ensure `NODE_ENV=production` in Render
5. Test locally with `ngrok` to tunnel localhost to public domain
