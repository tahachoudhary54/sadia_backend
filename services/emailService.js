import nodemailer  from 'nodemailer';

/**
 * Configure Nodemailer SMTP Transporter using Environment variables
 */
const getTransporter = () => {
  // Check if credentials are present
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || user.includes("placeholder") || pass.includes("placeholder")) {
    return null;
  }

  // Create standard SMTP transport configuration
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass
    }
  });
};

/**
 * Premium Luxury HTML Email Template generator (Black & Gold)
 * @param {string} name - Patron's full name
 * @param {string} otp - Secure 6-digit OTP code
 */
const getLuxuryOTPTemplate = (name, otp) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Sadia Fragrance Account</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #050505;
        font-family: 'Playfair Display', 'Didot', 'Georgia', serif;
        -webkit-font-smoothing: antialiased;
        color: #e5e5e5;
      }
      .wrapper {
        width: 100%;
        background-color: #050505;
        padding: 40px 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #0b0b0b;
        border: 1px solid #c5a880; /* Elegant gold border */
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      }
      .header {
        background-color: #0b0b0b;
        padding: 40px 20px 20px 20px;
        text-align: center;
        border-bottom: 1px solid rgba(197, 168, 128, 0.15);
      }
      .logo {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: #d4af37; /* Luxury Gold color */
        margin: 0;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      }
      .subtitle {
        font-size: 10px;
        letter-spacing: 0.4em;
        text-transform: uppercase;
        color: #c5a880;
        margin: 8px 0 0 0;
        opacity: 0.8;
      }
      .content {
        padding: 40px 50px;
        text-align: center;
        background-image: radial-gradient(circle at center, #141414 0%, #0b0b0b 100%);
      }
      .greeting {
        font-size: 20px;
        color: #ffffff;
        margin-bottom: 20px;
        font-weight: 500;
        letter-spacing: 0.05em;
      }
      .message {
        font-size: 14px;
        line-height: 1.8;
        color: #bfa17a;
        margin-bottom: 35px;
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        font-weight: 300;
      }
      .otp-box {
        display: inline-block;
        background-color: #000000;
        border: 1px solid rgba(212, 175, 55, 0.4);
        border-radius: 4px;
        padding: 18px 40px;
        margin: 10px 0 30px 0;
        box-shadow: inset 0 0 15px rgba(212, 175, 55, 0.05), 0 4px 10px rgba(0,0,0,0.3);
      }
      .otp-code {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 0.25em;
        color: #d4af37;
        margin: 0;
        padding-left: 0.25em; /* Balance centering with letter-spacing */
      }
      .expiry-alert {
        font-size: 11px;
        color: #c5a880;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin-bottom: 10px;
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      }
      .expiry-sub {
        font-size: 12px;
        color: rgba(229, 229, 229, 0.5);
        margin-bottom: 40px;
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        font-weight: 300;
      }
      .divider {
        width: 60px;
        height: 1px;
        background-color: #d4af37;
        margin: 0 auto 30px auto;
        opacity: 0.6;
      }
      .footer {
        background-color: #050505;
        padding: 30px 20px;
        text-align: center;
        border-top: 1px solid rgba(197, 168, 128, 0.1);
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      }
      .footer-text {
        font-size: 11px;
        color: rgba(229, 229, 229, 0.4);
        line-height: 1.6;
        letter-spacing: 0.1em;
        margin: 0 0 15px 0;
      }
      .footer-links {
        font-size: 10px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #d4af37;
      }
      @media only screen and (max-width: 600px) {
        .content {
          padding: 30px 25px;
        }
        .greeting {
          font-size: 18px;
        }
        .message {
          font-size: 13px;
        }
        .otp-code {
          font-size: 28px;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <!-- Brand Header -->
        <div class="header">
          <h1 class="logo">Sadia Fragrance</h1>
          <p class="subtitle">Maison De L'attar Exquisite</p>
        </div>
        
        <!-- Interactive OTP Content -->
        <div class="content">
          <div class="greeting">Welcome to the Inner Circle, ${name}</div>
          <p class="message">
            To conclude your registration and secure your patron vault at Sadia Fragrance, please verify your identity using the exclusive authentication credential below:
          </p>
          
          <div class="otp-box">
            <h2 class="otp-code">${otp}</h2>
          </div>
          
          <div class="divider"></div>
          
          <div class="expiry-alert">TEMPORARY PASSCODE</div>
          <div class="expiry-sub">This unique authentication credential will expire in 5 minutes.</div>
        </div>
        
        <!-- Elegant Footer -->
        <div class="footer">
          <p class="footer-text">
            You are receiving this communication because an account registration was requested at sadiafragrance.com.<br>
            If you did not initiate this request, please disregard this transmission securely.
          </p>
          <div class="footer-links">
            PARIS &bull; DUBAI &bull; NEW DELHI
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Send Transactional Email with 6-Digit Verification OTP
 * @param {string} email - Destination email address
 * @param {string} name - Patron's full name
 * @param {string} otp - Plaintext 6-digit OTP code
 */
const sendOTPEmail = async (email, name, otp) => {
  const transporter = getTransporter();

  // FALLBACK SANDBOX IN DEV ENVIRONMENT (no blocker for developer)
  if (!transporter) {
    console.log("\n====================================================================");
    console.log(`[DEV ONLY - SMTP SANDBOX]`);
    console.log(`To: ${email}`);
    console.log(`Subject: Verify Your Sadia Fragrance Account`);
    console.log(`Patron Name: ${name}`);
    console.log(`OTP Code: ${otp}`);
    console.log("====================================================================\n");
    return {
      success: true,
      message: "Development sandboxed email logged successfully.",
      sandboxed: true
    };
  }

  const mailOptions = {
    from: `"Sadia Fragrance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Sadia Fragrance Account",
    html: getLuxuryOTPTemplate(name, otp)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Verification OTP email dispatched to ${email}. MessageId: ${info.messageId}`);
    return {
      success: true,
      message: "Email dispatched successfully.",
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${email}:`, error.message);
    throw new Error(`Email dispatch failed: ${error.message}`);
  }
};

export default {
  sendOTPEmail
};
