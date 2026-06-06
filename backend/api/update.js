import { google } from 'googleapis';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ status: "ERROR", message: "Method not allowed matrices." });
    }

    try {
        const { password, data } = req.body;

        // 🔐 Hardcoded check mapping via environment configuration keys
        if (!password || password !== process.env.ADMIN_SECRET_KEY) {
            return res.status(401).json({ status: "MISMATCH", message: "Unauthorized proxy gateway validation failure." });
        }

        if (!data) {
            return res.status(400).json({ status: "ERROR", message: "Payload segments structurally incomplete." });
        }

        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const fileId = process.env.GOOGLE_DRIVE_FILE_ID;

        await drive.files.update({
            fileId: fileId,
            media: {
                mimeType: 'application/json',
                body: JSON.stringify(data, null, 2),
            },
        });

        return res.status(200).json({ status: "SUCCESS", message: "Google Drive internal dataset database updated cleanly." });
    } catch (err) {
        console.error("Serverless Update Write Error:", err.message);
        return res.status(500).json({ status: "ERROR", message: err.message });
    }
}