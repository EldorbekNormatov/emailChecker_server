import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const EmailSend = async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "dispatch@navinixllc.com",
        pass: "xrmrndthoiwxfmvg", // App Password
      },
    });

    const { 
      email, 
      pickup, 
      delivery, 
      referenceId, 
      firstName, 
      lastName, 
      role, 
      phoneNumber,
      phoneExt,
      emailAddress } = req.body;
    const ref = String(referenceId || "").trim();

    let messageBody = `
      <p>Hi,</p>
      <p>Could you please share full load details and your best rate?</p>    
    `;

    if (ref && ref !== "-" && ref !== "–" && ref != "Not Available") {
      messageBody += `<p><strong>Reference ID:</strong> ${ref}</p>`;
    }

    messageBody += `<p><strong>My MC: 992513</strong></p>`;

    // const logoPath = path.join(__dirname, "logo", "Sticker.jpg");
    const logoPath = path.join(__dirname, "../../logo/Sticker.jpg");


    if (!fs.existsSync(logoPath)) {
      console.error("Logo not found:", logoPath);
      return res.status(500).json({ error: "Logo file missing" });
    }

messageBody += `
  <p style="font-weight: 600; font-size: 17px; color: #000; margin-bottom: 2px; font-family: Arial, sans-serif;">
    ${firstName} ${lastName}
  </p>
  <p style="font-weight: 600; font-size: 14px; color: #000; margin-top: 0; margin-bottom: 6px; font-family: Arial, sans-serif;">
    ${role}
  </p>

  ${phoneNumber || phoneExt ? `
    <p style="margin: 2px 0; font-family: Arial, sans-serif; font-size: 14px; color: #333;">
      📞 Phone: ${phoneNumber ? phoneNumber : ""} ${phoneExt ? `ext ${phoneExt}` : ""}
    </p>
  ` : ""}

  ${emailAddress ? `
    <p style="margin: 2px 0; font-family: Arial, sans-serif; font-size: 14px; color: #333;">
      ✉️ Email: <a href="mailto:${emailAddress}" style="color: #0073e6;">${emailAddress}</a>
    </p>
  ` : ""}

  <p style="margin-top: 6px; font-family: Arial, sans-serif; font-size: 14px; color: #333;">
    Thank you for your cooperation!
  </p>
  <hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0;">
  <div style="font-family: Arial, sans-serif; font-size: 13px; color: #333; line-height: 1.4;">
    <img src="cid:logo" alt="NAVINIX Logo" width="100" style="margin-bottom: 4px;">
    <p style="margin: 2px 0;">MC 992513, DOT 2927626</p>
    <p style="margin: 2px 0;">Main: 513-252-2094</p>
    <p style="margin: 2px 0;">After hours: 816-974-6688</p>
    <a href="http://www.navinixllc.com" style="color: #0073e6; text-decoration: none;">
      www.navinixllc.com
    </a>
  </div>
`;


    const mailOptions = {
      from: "dispatch@navinixllc.com",
      to: email,
      subject: `${pickup} to ${delivery}`,
      html: messageBody,
      attachments: [{ filename: "Sticker.jpg", path: logoPath, cid: "logo" }],
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email sent!", info });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: error.message });
  }
};
