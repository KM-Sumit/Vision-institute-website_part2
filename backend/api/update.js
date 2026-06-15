import fs from 'fs';
import path from 'path';
import CryptoJS from 'crypto-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        const defaultKey = "ImranSir@VisionEncryption2026NodeKey";

        const adminSecretKey = process.env.ADMIN_SECRET_KEY || defaultKey;
        if (!password || password !== adminSecretKey) {
            return res.status(401).json({ status: "MISMATCH", message: "Unauthorized proxy gateway validation failure." });
        }

        if (!data) {
            return res.status(400).json({ status: "ERROR", message: "Payload segments structurally incomplete." });
        }

        // Encrypt data before saving
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), defaultKey).toString();
        const payloadObject = { payload: encryptedData };

        const filePath = process.env.DATA_PATH || path.join(__dirname, '..', 'data.json');
        fs.writeFileSync(filePath, JSON.stringify(payloadObject, null, 2), 'utf8');

        return res.status(200).json({ status: "SUCCESS", message: "Local encrypted database updated cleanly." });
    } catch (err) {
        console.error("Serverless Update Write Error:", err.message);
        return res.status(500).json({ status: "ERROR", message: err.message });
    }
}