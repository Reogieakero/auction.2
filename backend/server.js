const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://192.168.1.65:8081',
    'exp://192.168.1.65:8081',
    'http://localhost:8081'
  ],
  credentials: true
}));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const otpStore = new Map();

// email -> { shopName, phone, zipCode, city, selectedCategories, submittedAt, status: 'pending' | 'activated' }
const pendingApplications = new Map();

// ─── OTP: Send ───────────────────────────────────────────────────────────────
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000 });

    const htmlTemplate = `
      <!DOCTYPE html><html><head><style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;}
        .container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
        .otp-box{background:#f0f0f0;border-left:4px solid #000;padding:20px;margin:20px 0;text-align:center;}
        .otp-code{font-size:32px;font-weight:700;color:#000;letter-spacing:4px;font-family:'Courier New',monospace;}
        .otp-info{font-size:12px;color:#999;margin-top:10px;}
        .footer{text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#999;}
      </style></head><body>
        <div class="container">
          <h2 style="text-align:center;color:#111;">Auction App</h2>
          <p style="text-align:center;color:#666;">Email Verification</p>
          <p>Hello,</p>
          <p>Thank you for signing up! Use the code below to verify your email:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-info">This code expires in 10 minutes</div>
          </div>
          <p><strong>Important:</strong> Do not share this code with anyone.</p>
          <div class="footer">
            <p>If you didn't create this account, please ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} Auction App. All rights reserved.</p>
          </div>
        </div>
      </body></html>`;

    await transporter.sendMail({
      from: `"Auction App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - Auction App',
      html: htmlTemplate,
    });

    console.log(`OTP sent to ${email}: ${otp}`);
    res.json({
      success: true,
      message: `Verification code sent to ${email}`,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// ─── OTP: Verify ─────────────────────────────────────────────────────────────
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const storedOtpData = otpStore.get(email);
    if (!storedOtpData) return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' });
    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }
    if (storedOtpData.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid verification code.' });

    otpStore.delete(email);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify code.' });
  }
});

// ─── OTP: Resend ─────────────────────────────────────────────────────────────
app.post('/api/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, message: 'Valid email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000 });

    const htmlTemplate = `
      <!DOCTYPE html><html><head><style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;}
        .container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;}
        .otp-box{background:#f0f0f0;border-left:4px solid #000;padding:20px;margin:20px 0;text-align:center;}
        .otp-code{font-size:32px;font-weight:700;color:#000;letter-spacing:4px;font-family:'Courier New',monospace;}
        .otp-info{font-size:12px;color:#999;margin-top:10px;}
        .footer{text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#999;}
      </style></head><body>
        <div class="container">
          <h2 style="text-align:center;">Auction App</h2>
          <p>Here is your new verification code:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-info">This code expires in 10 minutes</div>
          </div>
          <p><strong>Important:</strong> Do not share this code with anyone.</p>
          <div class="footer"><p>&copy; ${new Date().getFullYear()} Auction App. All rights reserved.</p></div>
        </div>
      </body></html>`;

    await transporter.sendMail({
      from: `"Auction App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'New Verification Code - Auction App',
      html: htmlTemplate,
    });

    console.log(`OTP resent to ${email}: ${otp}`);
    res.json({ success: true, message: `Verification code resent to ${email}`, otp: process.env.NODE_ENV === 'development' ? otp : undefined });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to resend verification code.' });
  }
});

// ─── Zip Code Lookup ──────────────────────────────────────────────────────────
app.post('/api/lookup-zip', async (req, res) => {
  const { zipCode } = req.body;
  if (!zipCode || zipCode.length !== 4) return res.status(400).json({ success: false, message: 'Invalid Zip Code' });
  try {
    const response = await fetch(`https://api.zippopotam.us/ph/${zipCode}`);
    if (response.ok) {
      const data = await response.json();
      const city = data.places[0]['place name'].split(',')[0].trim();
      return res.json({ success: true, city });
    }
    res.json({ success: false, message: 'Zip code not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Service Unavailable' });
  }
});

// ─── Merchant Application: Submit ────────────────────────────────────────────
app.post('/api/merchant-application', async (req, res) => {
  const { email, shopName, phone, zipCode, city, selectedCategories } = req.body;

  if (!email || !shopName || !phone || !city) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const existing = pendingApplications.get(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'You already have a pending application.' });
  }

  try {
    // Save with pending status
    pendingApplications.set(email, {
      shopName, phone, zipCode, city,
      selectedCategories: selectedCategories || [],
      submittedAt: new Date().toISOString(),
      status: 'pending',
    });

    const categoriesDisplay = (selectedCategories || []).join(', ') || 'N/A';
    const submittedAt = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });

    // Build activation token (base64 of email — swap for JWT in production)
    const activationToken = Buffer.from(email).toString('base64url');
    const activationUrl = `http://192.168.1.65:${PORT}/api/activate-shop?token=${activationToken}`;

    // 1. Notify ADMIN with activate button
    await transporter.sendMail({
      from: `"The Vault" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Merchant Application: ${shopName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:30px;border-radius:8px;">
          <h2 style="color:#111;border-bottom:2px solid #000;padding-bottom:10px;">New Merchant Application</h2>
          <p>A new shop application is awaiting your review and activation.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#f9f9f9;"><td style="padding:10px;font-weight:bold;width:40%;">Shop Name</td><td style="padding:10px;">${shopName}</td></tr>
            <tr><td style="padding:10px;font-weight:bold;">Owner Email</td><td style="padding:10px;">${email}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:10px;font-weight:bold;">Phone</td><td style="padding:10px;">${phone}</td></tr>
            <tr><td style="padding:10px;font-weight:bold;">Location</td><td style="padding:10px;">${city} (ZIP: ${zipCode})</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:10px;font-weight:bold;">Categories</td><td style="padding:10px;">${categoriesDisplay}</td></tr>
            <tr><td style="padding:10px;font-weight:bold;">Submitted</td><td style="padding:10px;">${submittedAt}</td></tr>
          </table>
          <div style="text-align:center;margin:30px 0;">
            <a href="${activationUrl}"
              style="background:#000;color:#fff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
              ACTIVATE SHOP
            </a>
          </div>
          <p style="color:#888;font-size:13px;text-align:center;">Clicking the button will immediately activate this merchant's shop.</p>
        </div>
      `
    });

    // 2. Confirm to USER (no activation button — admin activates)
    await transporter.sendMail({
      from: `"The Vault" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Application Received – ${shopName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:30px;border-radius:8px;">
          <h2 style="text-align:center;color:#111;">Application Under Review</h2>
          <p>Hi there,</p>
          <p>We've received your application to open <strong>${shopName}</strong> on The Vault. Our team will review your submission and activate your shop within 1–2 business days.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#f9f9f9;"><td style="padding:10px;font-weight:bold;width:40%;">Shop Name</td><td style="padding:10px;">${shopName}</td></tr>
            <tr><td style="padding:10px;font-weight:bold;">Location</td><td style="padding:10px;">${city}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:10px;font-weight:bold;">Categories</td><td style="padding:10px;">${categoriesDisplay}</td></tr>
            <tr><td style="padding:10px;font-weight:bold;">Submitted</td><td style="padding:10px;">${submittedAt}</td></tr>
          </table>
          <div style="background:#f0f0f0;border-left:4px solid #000;padding:15px;margin:20px 0;">
            <strong>What's next?</strong><br/>
            Our team will review your application. You'll receive a confirmation email once your shop is activated.
          </div>
          <p style="color:#888;font-size:13px;">If you didn't submit this application, please ignore this email.</p>
        </div>
      `
    });

    console.log(`Merchant application submitted: ${email} -> ${shopName}`);
    res.json({ success: true, message: 'Application submitted! Check your email for confirmation.' });

  } catch (error) {
    console.error('Merchant application error:', error);
    pendingApplications.delete(email);
    res.status(500).json({ success: false, message: 'Failed to submit application. Please try again.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// ─── Merchant Application: Check Status ──────────────────────────────────────
app.get('/api/merchant-application/status', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const application = pendingApplications.get(email);
  if (application) {
    return res.json({ success: true, hasPending: true, application });
  }
  res.json({ success: true, hasPending: false });
});

// ─── Activate Shop (admin clicks button in email) ─────────────────────────────
app.get('/api/activate-shop', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(activationPage('error', 'Invalid activation link.'));
  }

  let email;
  try {
    email = Buffer.from(token, 'base64url').toString('utf8');
  } catch (e) {
    return res.status(400).send(activationPage('error', 'Invalid or corrupted activation token.'));
  }

  const application = pendingApplications.get(email);

  if (!application) {
    return res.status(404).send(activationPage('error', 'No pending application found for this account.'));
  }

  if (application.status === 'activated') {
    return res.send(activationPage('already', `"${application.shopName}" is already activated.`));
  }

  // Activate the shop
  application.status = 'activated';
  application.activatedAt = new Date().toISOString();
  pendingApplications.set(email, application);

  // Notify user their shop is now live
  try {
    await transporter.sendMail({
      from: `"The Vault" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your shop "${application.shopName}" is now LIVE!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:30px;border-radius:8px;">
          <h2 style="text-align:center;color:#111;">Your Shop is Live!</h2>
          <p>Hi there,</p>
          <p>Great news! Your shop <strong>${application.shopName}</strong> has been reviewed and is now officially activated on The Vault.</p>
          <div style="background:#000;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
            <p style="color:#fff;font-size:20px;font-weight:bold;margin:0;">SHOP ACTIVATED</p>
            <p style="color:#aaa;font-size:13px;margin:8px 0 0;">${application.shopName} &mdash; ${application.city}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#f9f9f9;"><td style="padding:10px;font-weight:bold;width:40%;">Shop Name</td><td style="padding:10px;">${application.shopName}</td></tr>
            <tr><td style="padding:10px;font-weight:bold;">Location</td><td style="padding:10px;">${application.city}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:10px;font-weight:bold;">Categories</td><td style="padding:10px;">${(application.selectedCategories || []).join(', ')}</td></tr>
            <tr><td style="padding:10px;font-weight:bold;">Activated On</td><td style="padding:10px;">${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</td></tr>
          </table>
          <p>You can now log in to The Vault and start listing your items. Welcome to the marketplace!</p>
          <p style="color:#888;font-size:13px;">If you have any questions, reply to this email.</p>
        </div>
      `
    });
  } catch (e) {
    console.error('Failed to send activation confirmation email:', e.message);
  }

  console.log(`Shop activated: ${email} -> ${application.shopName}`);
  return res.send(activationPage('success', application.shopName, email));
});

// ─── Activation Result Page ───────────────────────────────────────────────────
function activationPage(type, shopNameOrMessage, email = '') {
  const isSuccess = type === 'success';
  const isAlready = type === 'already';

  const icon = isSuccess ? '✓' : isAlready ? '!' : '✗';
  const iconBg = isSuccess ? '#000' : isAlready ? '#f59e0b' : '#ef4444';
  const title = isSuccess ? 'Shop Activated!' : isAlready ? 'Already Activated' : 'Activation Failed';
  const message = isSuccess
    ? `<strong>${shopNameOrMessage}</strong> is now live on The Vault. A confirmation email has been sent to <strong>${email}</strong>.`
    : shopNameOrMessage;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title} — The Vault</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
        .card{background:#fff;border-radius:16px;padding:48px 40px;max-width:480px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
        .icon{width:80px;height:80px;border-radius:50%;background:${iconBg};color:#fff;font-size:36px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;}
        h1{font-size:26px;font-weight:800;color:#111;margin-bottom:12px;}
        p{font-size:15px;color:#555;line-height:1.7;}
        .badge{display:inline-block;background:#f0f0f0;border-radius:8px;padding:10px 20px;margin-top:24px;font-size:13px;color:#888;}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="badge">The Vault &mdash; Merchant Portal</div>
      </div>
    </body>
    </html>
  `;
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✓ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Email service: ${process.env.EMAIL_USER ? 'Configured (' + process.env.EMAIL_USER + ')' : 'NOT CONFIGURED'}`);
  console.log('\nEndpoints:');
  console.log('  POST /api/send-otp');
  console.log('  POST /api/verify-otp');
  console.log('  POST /api/resend-otp');
  console.log('  POST /api/merchant-application');
  console.log('  GET  /api/merchant-application/status?email=...');
  console.log('  GET  /api/activate-shop?token=...');
  console.log('  GET  /api/health\n');
});