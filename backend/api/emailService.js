const nodemailer = require('nodemailer');

// Gmail SMTP Configuration
// ⚠️ You need to generate an "App Password" in Gmail (by turning ON 2-Step Verification)
// Google Account → Security → 2-Step Verification → App Passwords → select "Mail"
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
                Your payment has been successfully received. Below are the details of your study notes:
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
                    📋 Your notes will be sent to you shortly via WhatsApp or Email. <br>
                    Please keep checking your WhatsApp.
                </p>
            </div>
            `}

            <p style="color: #4a5568; font-size: 13px; line-height: 1.6;">
                If you face any issues, please contact us:<br>
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

// Send notification to teacher when a new review is submitted
async function sendReviewNotificationEmail(reviewDetails) {
    const { name, email, rating, cls, reviewText } = reviewDetails;
    
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background-color: #1a365d; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0; color: #facc15;">⭐ New Student Review Received</h2>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">The Vision Institute Portal</p>
        </div>
        <div style="padding: 20px; color: #374151;">
            <p>Dear Sudhir Sir,</p>
            <p>A student has submitted a review on the website. Below are the details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; font-weight: bold; color: #1a365d;">Student Name:</td>
                    <td style="padding: 10px 0;">${name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; font-weight: bold; color: #1a365d;">Email:</td>
                    <td style="padding: 10px 0;">${email}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; font-weight: bold; color: #1a365d;">Class:</td>
                    <td style="padding: 10px 0;">${cls}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; font-weight: bold; color: #1a365d;">Rating:</td>
                    <td style="padding: 10px 0; color: #facc15; font-size: 18px;">
                        ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5 Star)
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #1a365d; vertical-align: top;">Review Message:</td>
                    <td style="padding: 10px 0; font-style: italic; color: #4b5563;">"${reviewText}"</td>
                </tr>
            </table>

            <div style="background-color: #f9fafb; border-left: 4px solid #1a365d; padding: 12px; margin-top: 15px; border-radius: 4px; font-size: 13px;">
                <strong>Note:</strong> This review has been saved to the database. You can manage, edit, or delete it from the <strong>Admin Dashboard</strong>.
            </div>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 11px; color: #6b7280;">
            © ${new Date().getFullYear()} The Vision Institute Sehore | Automated Notification
        </div>
    </div>
    `;

    const recipient = `sudhirsilavat12@gmail.com, ${SMTP_EMAIL}`;
    const mailOptions = {
        from: `"Vision Institute Portal" <${SMTP_EMAIL}>`,
        to: recipient,
        subject: `⭐ New Review: ${name} (Class ${cls})`,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('📧 Review notification email sent successfully.');
        return { success: true };
    } catch (err) {
        console.error('📧 Review notification email failed:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { sendNotesEmail, sendReviewNotificationEmail };
