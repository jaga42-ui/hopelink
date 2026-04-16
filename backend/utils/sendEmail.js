const nodemailer = require("nodemailer");

const sendPostAlertEmail = async (bccEmails, postDetails) => {
  if (!bccEmails || bccEmails.length === 0) return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, 
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const radarLink = `${process.env.FRONTEND_URL}/radar`;

  // 👉 THE FIX: Dynamic styling based on whether it's an emergency!
  const isEmergency = postDetails.isEmergency || false;
  
  const theme = {
    title: isEmergency ? "Emergency Alert in Your Sector" : "New Community Offer Nearby",
    subject: isEmergency ? `🚨 URGENT: ${postDetails.bloodGroup || 'Assistance'} Needed` : `📢 Local Update: New Item Available`,
    color: isEmergency ? "#f87171" : "#2dd4bf", // Red for SOS, Teal for Donations
    border: isEmergency ? "#ef4444" : "#0d9488",
    messageLabel: isEmergency ? "Transmission Details" : "Item Details",
  };

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    bcc: bccEmails, 
    subject: theme.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 40px; border-radius: 16px; color: #f8fafc;">
        <h2 style="color: ${theme.color}; margin-top: 0;">${theme.title}</h2>
        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.5;">A nearby HopeLink member has updated the grid.</p>
        
        <div style="background-color: #1e293b; padding: 20px; border-left: 4px solid ${theme.border}; border-radius: 8px; margin: 30px 0;">
          <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;">${theme.messageLabel}</p>
          <p style="margin: 0; font-size: 18px; font-weight: 500;">"${postDetails.message}"</p>
          ${postDetails.bloodGroup ? `<p style="margin: 15px 0 0 0; color: ${theme.color}; font-weight: bold;">Required: ${postDetails.bloodGroup}</p>` : ''}
        </div>

        <p style="color: #cbd5e1; margin-bottom: 30px;">Access the radar to view the exact location and connect.</p>
        
        <a href="${radarLink}" style="display: inline-block; padding: 14px 28px; background-color: ${theme.border}; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Open Radar</a>
        
        <hr style="border: 0; border-top: 1px solid #334155; margin: 40px 0 20px 0;" />
        <p style="font-size: 11px; color: #64748b; margin: 0;">You are receiving this communication because your HopeLink profile is set to an active radius near this event.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email Blast Success: Dispatched to ${bccEmails.length} nearby users.`);
  } catch (error) {
    console.error("Email Blast Failed:", error.message);
  }
};

module.exports = { sendPostAlertEmail };