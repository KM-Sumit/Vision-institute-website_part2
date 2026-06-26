const nodemailer = require('nodemailer');

// Gmail SMTP Configuration
// ⚠️ Aapko Gmail me "App Password" generate karni hogi (2-Step Verification ON karke)
// Google Account → Security → 2-Step Verification → App Passwords → "Mail" select karo
const SMTP_EMAIL = (process.env.SMTP_EMAIL || '').replace(/^"|"$/g, '').trim();
const SMTP_PASSWORD = (process.env.SMTP_PASSWORD || '').replace(/^"|"$/g, '').trim();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD
    }
});

// Send notes/PDF link to student after successful payment
async function sendNotesEmail(studentEmail, noteDetails, paymentId) {
    const { title, subject, noteClass, price, pdfLink } = noteDetails;

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a365d, #2d4a7a); padding: 30px; text-align: center;">
            <h1 style="color: #d69e2e; margin: 0; font-size: 24px;">The Vision Institute</h1>
            <p style="color: #cbd5e0; margin: 5px 0 0; font-size: 12px; letter-spacing: 2px;">SUDHIR SHIVAM SIR</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
            <h2 style="color: #1a365d; margin-top: 0;">✅ Payment Successful!</h2>
            <p style="color: #4a5568; line-height: 1.6;">
                Dear Student,<br>
                Aapka payment successfully receive ho gaya hai. Neeche aapke notes ki details hain:
            </p>

            <!-- Order Details Card -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #718096; font-size: 14px;">📚 Notes Title:</td>
                        <td style="padding: 8px 0; color: #1a365d; font-weight: bold; text-align: right;">${title}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #718096; font-size: 14px;">📖 Subject:</td>
                        <td style="padding: 8px 0; color: #1a365d; font-weight: bold; text-align: right;">${subject}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #718096; font-size: 14px;">🎓 Class:</td>
                        <td style="padding: 8px 0; color: #1a365d; font-weight: bold; text-align: right;">${noteClass}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #718096; font-size: 14px;">💰 Amount Paid:</td>
                        <td style="padding: 8px 0; color: #16a34a; font-weight: bold; text-align: right;">₹${price}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #718096; font-size: 14px;">🔑 Payment ID:</td>
                        <td style="padding: 8px 0; color: #1a365d; font-weight: bold; text-align: right; font-size: 12px;">${paymentId}</td>
                    </tr>
                </table>
            </div>

            ${pdfLink ? `
            <!-- Download Button -->
            <div style="text-align: center; margin: 25px 0;">
                <a href="${pdfLink}" style="display: inline-block; background: linear-gradient(135deg, #d69e2e, #ecc94b); color: #1a365d; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; letter-spacing: 0.5px;">
                    📥 Download Your Notes (PDF)
                </a>
            </div>
            ` : `
            <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 15px; text-align: center; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                    📋 Aapke notes jaldi hi aapko WhatsApp ya Email par bhej diye jayenge. <br>
                    Kripya apna WhatsApp check karte rahein.
                </p>
            </div>
            `}

            <p style="color: #4a5568; font-size: 13px; line-height: 1.6;">
                Agar koi problem aaye toh hume contact karein:<br>
                📞 <strong>7225902570</strong> | 📧 <strong>sudhirsilavat12@gmail.com</strong>
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #1a365d; padding: 20px; text-align: center;">
            <p style="color: #a0aec0; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} The Vision Institute | All Rights Reserved<br>
                Kulkula Mata Mandir, Englishpura, Sehore, 466001
            </p>
        </div>
    </div>
    `;

    // Generate Direct Download URL from Google Drive Link
    function getGoogleDriveDownloadUrl(url) {
        if (!url) return null;
        let fileId = '';
        const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        
        if (match1) fileId = match1[1];
        else if (match2) fileId = match2[1];
        
        if (fileId) {
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        return null;
    }

    const mailOptions = {
        from: `"The Vision Institute" <${SMTP_EMAIL}>`,
        to: studentEmail,
        subject: `✅ Payment Confirmed - ${title} | The Vision Institute`,
        html: htmlContent
    };

    // Attach PDF if link is available
    if (pdfLink) {
        const downloadUrl = getGoogleDriveDownloadUrl(pdfLink);
        if (downloadUrl) {
            mailOptions.attachments = [
                {
                    filename: `${title ? title.replace(/[^a-zA-Z0-9 ]/g, "") : "Study_Notes"}.pdf`,
                    path: downloadUrl
                }
            ];
        }
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error('📧 Email sending failed:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { sendNotesEmail };
