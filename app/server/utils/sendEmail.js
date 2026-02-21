const axios = require('axios');
require('dotenv').config();

/**
 * Send OTP email using Brevo (Sendinblue) API
 * @param {string} to - Recipient email
 * @param {string} userName - User's name
 * @param {string} otp - OTP code
 */
const sendOTPEmail = async (to, userName, otp) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Auth System',
          email: process.env.EMAIL 
        },
        to: [
          {
            email: to,
            name: userName
          }
        ],
        subject: 'Email Verification - OTP Code',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Email Verification</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${userName}</strong>,</p>
                <p>Thank you for registering! Please use the following OTP code to verify your email address:</p>
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                <p><strong>This OTP will expire in 5 minutes.</strong></p>
                <p>If you didn't request this code, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>This is an automated email, please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error('Brevo Email Error:', error.response?.data || error.message);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendOTPEmail };