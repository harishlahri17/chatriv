const { google } = require("googleapis");
const oauth2Client = require("../config/gmailConfig");

const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
});

const sendOtpToMail = async (email, otp) => {
    try {

        const html = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">

          <h2 style="color: #075e54;">
            🔐 ChatRiv Web Verification
          </h2>

          <p>Hi there,</p>

          <p>
            Your one-time password (OTP) to verify your
            ChatRiv Web account is:
          </p>

          <h1 style="
              background: #e0f7fa;
              color: #000;
              padding: 10px 20px;
              display: inline-block;
              border-radius: 5px;
              letter-spacing: 2px;
          ">
            ${otp}
          </h1>

          <p>
            <strong>
              This OTP is valid for the next 5 minutes.
            </strong>
            Please do not share this code with anyone.
          </p>

          <p>
            If you didn't request this OTP,
            please ignore this email.
          </p>

          <p style="margin-top: 20px;">
            Thanks & Regards,<br/>
            ChatRiv Web Security Team
          </p>

          <hr style="margin: 30px 0;" />

          <small style="color: #777;">
            This is an automated message. Please do not reply.
          </small>

        </div>
        `;

        // Email headers
        const message = [
            `From: "ChatRiv Web" <${process.env.EMAIL_USER}>`,
            `To: ${email}`,
            "Subject: Your ChatRiv verification",
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
            "",
            html
        ].join("\r\n");

        // Gmail API requires base64url encoded message
        const encodedMessage = Buffer
            .from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const result = await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: encodedMessage
            }
        });

        console.log(           "OTP email sent successfully:", result.data.id);
        return result.data;

    } catch (error) {
        console.error("Gmail API email sending failed:");
        console.error(error.response?.data || error.message);
        throw error;
    }
};

module.exports = sendOtpToMail;