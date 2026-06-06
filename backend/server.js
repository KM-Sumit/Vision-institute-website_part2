const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Middleware Settings
app.use(cors());
app.use(express.json());

// 🔒 HIGH SECURITY LAYER: Apps Script Core Tunnel URL (Frontend se invisible)
const APPS_SCRIPT_API = "https://script.google.com/macros/s/AKfycbxVIRdFZRus7rKVHFQ5ef3DLlMBdjiyu9UXR7ArN2Z0gxuIi1iVu4XF74DH9VR3XlQP/exec";

// Axios Custom Instance (Google Apps Script ke 302 Redirects ko handle karne ke liye)
const googleClient = axios.create({
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400
});

// ==========================================================
// 🔑 1. AUTHENTICATION ROUTE (Drive file validation proxy)
// ==========================================================
app.get('/api/auth', async (req, res) => {
    try {
        const { password } = req.query;
        if (!password) {
            return res.status(400).json({ status: "ERROR", message: "Password query missing." });
        }
        
        // Google redirect bypass ke sath structural handshake
        const targetUrl = `${APPS_SCRIPT_API}?action=auth&password=${encodeURIComponent(password)}`;
        const response = await googleClient.get(targetUrl);
        
        res.json(response.data);
    } catch (err) {
        console.error("Auth Tunnel Error:", err.message);
        res.status(500).json({ status: "ERROR", message: "Secure Tunnel Connection Timeout." });
    }
});

// ==========================================================
// 📝 2. WRITE LAYER ROUTE (Appends data safely into Google Sheet)
// ==========================================================
app.post('/api/write', async (req, res) => {
    try {
        const { sheet, data } = req.body;
        if (!sheet || !data) {
            return res.status(400).json({ status: "ERROR", message: "Payload segments incomplete." });
        }

        // URL parsing logic updated for deep proxy verification
        const targetUrl = `${APPS_SCRIPT_API}?sheet=${encodeURIComponent(sheet)}&data=${encodeURIComponent(JSON.stringify(data))}`;
        const response = await googleClient.get(targetUrl);
        
        // Frontend framework authentication matrix alignment
        if (response.data.status === "SUCCESS" || response.data.result === "SUCCESS") {
            res.json({ status: "SUCCESS", message: "Data synchronized successfully." });
        } else {
            res.json(response.data);
        }
    } catch (err) {
        console.error("Write Tunnel Error:", err.message);
        res.status(500).json({ status: "ERROR", message: "Cloud Commit Handshake Failed." });
    }
});

// ==========================================================
// 🔄 3. DATA LIVE FETCH ENGINE (Website synchronization)
// ==========================================================
app.get('/api/data', async (req, res) => {
    try {
        const response = await googleClient.get(APPS_SCRIPT_API);
        res.json(response.data);
    } catch (err) {
        console.error("Fetch Tunnel Error:", err.message);
        res.status(500).json({ status: "ERROR", message: "Data Synchronization Sync Timeout." });
    }
});

// Server boot listener port mapping
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Secure Node System streaming dynamically on port ${PORT}`);
});