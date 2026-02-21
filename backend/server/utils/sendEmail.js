import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Send OTP email using Brevo (Sendinblue) API
 */
export const sendOTPEmail = async (to, userName, otp) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Auth System",
          email: process.env.EMAIL,
        },
        to: [
          {
            email: to,
            name: userName,
          },
        ],
        subject: "Email Verification - OTP Code",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f9; font-family: Arial, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        
        <!-- Card Container -->
        <table width="500" cellpadding="0" cellspacing="0" 
          style="background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 5px 20px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td align="center">
              <h2 style="margin:0; color:#2c3e50;">Email Verification</h2>
              <p style="color:#7f8c8d; margin-top:8px;">
                Secure your account with the OTP below
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-top:25px; color:#2c3e50; font-size:15px;">
              Hello <strong>${userName}</strong>,
              <br/><br/>
              Use the following One-Time Password (OTP) to complete your verification process:
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td align="center" style="padding:30px 0;">
              <div style="
                background:#f1f3f6;
                padding:18px 30px;
                border-radius:10px;
                font-size:28px;
                letter-spacing:6px;
                font-weight:bold;
                color:#2c3e50;
                display:inline-block;">
                ${otp}
              </div>
            </td>
          </tr>

          <!-- Expiry Notice -->
          <tr>
            <td align="center" style="color:#e74c3c; font-size:14px;">
              ⏳ This OTP will expire in 5 minutes.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:30px; font-size:13px; color:#7f8c8d; text-align:center;">
              If you did not request this code, please ignore this email.
              <br/><br/>
              © ${new Date().getFullYear()} Your Company Name. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error("Brevo Email Error:", error.response?.data || error.message);
    throw new Error("Failed to send email");
  }
};