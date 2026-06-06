import { google } from 'googleapis';
import CryptoJS from 'crypto-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const fileId = process.env.GOOGLE_DRIVE_FILE_ID;

        const response = await drive.files.get({
            fileId: fileId,
            alt: 'media',
        });

        const rawDataString = JSON.stringify(response.data);

        // 🔐 AES LAYER: Encrypted handshake using server side environments variables
        const sharedKey = process.env.SHARED_AES_KEY;
        const encryptedData = CryptoJS.AES.encrypt(rawDataString, sharedKey).toString();

        // Strict non-cache directive declarations
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(200).json({ payload: encryptedData });
    } catch (err) {
        console.error("Serverless Read Sync Engine Error:", err.message);
        return res.status(500).json({ status: "ERROR", message: "Database sync parsing failure timeline timeout." });
    }
}