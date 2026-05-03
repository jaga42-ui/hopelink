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

  const isEmergency = postDetails.isEmergency || postDetails.priority === 'high';
  
  const theme = {
    title: isEmergency ? "EMERGENCY ALERT IN YOUR SECTOR" : "NGO RELIEF UPDATE NEARBY",
    subject: isEmergency ? `🚨 URGENT: ${postDetails.bloodGroup || 'Assistance'} Needed` : `📢 Local Update: Verified NGO Relief Camp`,
    color: isEmergency ? "#ff4a1c" : "#1e7a6f", // Blazing Flame for SOS, Pine Teal for NGO
    border: isEmergency ? "#ff4a1c" : "#1e7a6f",
    messageLabel: isEmergency ? "Emergency Details" : "Relief Details",
  };

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    bcc: bccEmails, 
    subject: theme.subject,
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; padding: 40px; border-radius: 24px; color: #29524a; border: 1px solid rgba(132, 107, 138, 0.3); box-shadow: 0 20px 40px rgba(41, 82, 74, 0.08);">
        
        <h2 style="color: ${theme.color}; margin-top: 0; font-weight: 900; font-style: italic; letter-spacing: -0.05em;">${theme.title}</h2>
        <p style="color: #846b8a; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">A nearby Sahayam member has updated the grid.</p>
        
        <div style="background-color: #ffffff; padding: 24px; border-left: 4px solid ${theme.border}; border-radius: 16px; margin: 30px 0; box-shadow: 0 4px 6px rgba(132, 107, 138, 0.1);">
          <p style="margin: 0 0 10px 0; color: #846b8a; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 900;">${theme.messageLabel}</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #29524a;">"${postDetails.message}"</p>
          ${postDetails.bloodGroup ? `<p style="margin: 15px 0 0 0; color: ${theme.color}; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Required: ${postDetails.bloodGroup}</p>` : ''}
          ${postDetails.requesterName ? `<p style="margin: 15px 0 0 0; color: #29524a; font-weight: 500; font-size: 14px;"><strong>Contact:</strong> ${postDetails.requesterName} ${postDetails.requesterPhone ? `(${postDetails.requesterPhone})` : ''}</p>` : ''}
        </div>

        <p style="color: #29524a; margin-bottom: 30px; font-weight: 500;">Access the radar to view the exact location and establish contact.</p>
        
        <a href="${radarLink}" style="display: inline-block; padding: 16px 32px; background-color: ${theme.border}; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 25px rgba(41, 82, 74, 0.2); margin-right: 10px; margin-bottom: 10px;">Open Radar</a>
        ${postDetails.lat && postDetails.lng ? `<a href="https://maps.google.com/?q=${postDetails.lat},${postDetails.lng}" style="display: inline-block; padding: 14px 30px; background-color: transparent; border: 2px solid ${theme.border}; color: ${theme.border}; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">Get Directions</a>` : ''}
        
        <hr style="border: 0; border-top: 1px solid rgba(132, 107, 138, 0.2); margin: 40px 0 20px 0;" />
        <p style="font-size: 10px; color: #846b8a; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">You are receiving this communication because your Sahayam profile is set to an active radius near this event.</p>
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