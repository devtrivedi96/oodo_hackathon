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
          <h2>Email Verification</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
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