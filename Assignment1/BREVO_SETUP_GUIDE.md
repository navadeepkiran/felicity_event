# 📧 Email Service Setup Guide - Brevo (for Production)

## Why Brevo Instead of Gmail?

Gmail SMTP **does NOT work on deployed servers** (Render, Vercel, etc.) due to security restrictions.  
**Brevo (formerly Sendinblue)** is:
- ✅ **Free**: 300 emails/day
- ✅ **Reliable**: Works on all cloud platforms
- ✅ **Easy**: 5-minute setup
- ✅ **Professional**: Better for production

---

## 🚀 Setup Instructions (5 minutes)

### Step 1: Create Brevo Account
1. Go to: **https://app.brevo.com/account/register**
2. Sign up with your email (use `nanikolupoti@gmail.com`)
3. Verify your email
4. Complete the onboarding (select "Transactional emails")

### Step 2: Get SMTP Credentials
1. Login to Brevo
2. Click your profile (top-right) → **SMTP & API**
3. Or go directly to: **https://app.brevo.com/settings/keys/smtp**
4. You'll see:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: Your email (e.g., `nanikolupoti@gmail.com`)
   - **Password**: Click **"Create a new SMTP key"**

### Step 3: Create SMTP Key
1. Click **"Create a new SMTP key"**
2. Name it: `Felicity Events`
3. Copy the generated key (looks like: `xsmtpsib-a1b2c3d4...`)
4. Save it somewhere safe (you can't see it again!)

### Step 4: Configure Render (Production)
1. Go to your Render dashboard: **https://dashboard.render.com**
2. Select your backend service
3. Go to **Environment** tab
4. Add these environment variables:

```
EMAIL_SERVICE = brevo
BREVO_USER = nanikolupoti@gmail.com
BREVO_PASSWORD = xsmtpsib-your-actual-smtp-key-here
EMAIL_USER = nanikolupoti@gmail.com
```

5. Click **"Save Changes"**
6. Render will auto-redeploy

### Step 5: Test on Production
1. Wait for Render deployment to complete (~2 minutes)
2. Register for an event on production: **https://felicity-event.vercel.app**
3. Check your email for the ticket!

---

## 🧪 Testing Locally Before Deploy

To test Brevo locally (optional):

1. Update your `.env` file:
```env
EMAIL_SERVICE=brevo
BREVO_USER=nanikolupoti@gmail.com
BREVO_PASSWORD=xsmtpsib-your-actual-smtp-key
```

2. Restart backend:
```bash
cd backend
node test-email.js
```

3. If successful, deploy to production!

---

## 🔄 Current Setup

- **Local Development**: Gmail (already working)
- **Production (Render)**: Will use Brevo once you set env vars
- **Email Send From**: "Felicity Events <nanikolupoti@gmail.com>"
- **Daily Limit**: 300 emails (more than enough!)

---

## ❓ Troubleshooting

### "Invalid credentials" error
- Make sure you created an SMTP key (not API key)
- Copy the full key including `xsmtpsib-` prefix

### "Sender not verified" error in Brevo dashboard
- Add sender email in Brevo: Settings → Senders & IPs
- You'll need to verify `nanikolupoti@gmail.com` (one-time)

### Still not getting emails on production
- Check Render logs for email errors
- Verify environment variables are set correctly
- Check Brevo dashboard → Statistics to see if emails were sent

---

## 📊 Monitoring

Check email delivery stats on Brevo:
- **https://app.brevo.com/statistics/transactional**
- See sent/delivered/bounced emails
- View email logs

---

## ✅ Quick Checklist

- [ ] Create Brevo account
- [ ] Generate SMTP key
- [ ] Add environment variables to Render
- [ ] Wait for Render to redeploy
- [ ] Test registration on production
- [ ] Verify email received

**Estimated time: 5-10 minutes**

---

## 🎯 Production-Ready!

Once configured, **all event registration tickets will be automatically sent via email** on production! 🎉
