const nodemailer = require("nodemailer");

const sendPostAlertEmail = async (bccEmails, postDetails) => {
  // 1. Safety check: Don't send if nobody is nearby
  if (!bccEmails || bccEmails.length === 0) return;

  // 2. Configure the Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // 3. Construct the deep link to your frontend
  const radarLink = `${process.env.FRONTEND_URL}/radar`;

  // 4. Build the Mail Options (Notice we use BCC to hide emails from each other)
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    bcc: bccEmails, 
    subject: `🚨 URGENT: ${postDetails.bloodGroup || 'Assistance'} Needed Nearby`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 40px; border-radius: 16px; color: #f8fafc;">
        <h2 style="color: #f87171; margin-top: 0;">Emergency Alert in Your Sector</h2>
        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.5;">A nearby HopeLink member has broadcasted an urgent request.</p>
        
        <div style="background-color: #1e293b; padding: 20px; border-left: 4px solid #ef4444; border-radius: 8px; margin: 30px 0;">
          <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;">Transmission Details</p>
          <p style="margin: 0; font-size: 18px; font-weight: 500;">"${postDetails.message}"</p>
          ${postDetails.bloodGroup ? `<p style="margin: 15px 0 0 0; color: #ef4444; font-weight: bold;">Required: ${postDetails.bloodGroup}</p>` : ''}
        </div>

        <p style="color: #cbd5e1; margin-bottom: 30px;">If you are in a position to assist, please access the grid immediately.</p>
        
        <a href="${radarLink}" style="display: inline-block; padding: 14px 28px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Open Radar</a>
        
        <hr style="border: 0; border-top: 1px solid #334155; margin: 40px 0 20px 0;" />
        <p style="font-size: 11px; color: #64748b; margin: 0;">You are receiving this communication because your HopeLink profile is set to 'Donor' mode within a 20km radius of this request.</p>
      </div>
    `,
  };

  // 5. Fire and Forget
  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email Blast Success: Dispatched to ${bccEmails.length} nearby donors.`);
  } catch (error) {
    console.error("Email Blast Failed:", error.message);
  }
};

module.exports = { sendPostAlertEmail };