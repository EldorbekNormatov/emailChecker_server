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
        user: "eldorbek052@gmail.com",
        pass: "zzjvbiceitbcigvl", // App Password
      },
    });

    const { email, pickup, delivery, referenceId, firstName, lastName, role} = req.body;
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
    <p>${firstName} ${lastName}</p>
    <p>${role}</p>
      <p>Thank you for your cooperation!</p>
      <hr>
      <div>
        <img src="cid:logo" alt="NAVINIX Logo" width="100">
        <p>MC 992513, DOT 2927626</p>
        <p>Main: 513-252-2094</p>
        <p>After hours: 816-974-6688</p>
        <a href="http://www.navinixllc.com">www.navinixllc.com</a>
      </div>
    `;

    const mailOptions = {
      from: "eldorbek052@gmail.com",
      to: email || "eldorbekn52@gmail.com",
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
