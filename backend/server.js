const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');
const githubDb = require('./githubDb');

const app = express();

// Middleware Settings
app.use(cors());
app.use(express.json());

const DATA_FILE_PATH = process.env.DATA_PATH || path.join(__dirname, 'data.json');
const DEFAULT_KEY = "ImranSir@VisionEncryption2026NodeKey";

// Helper to seed data if not present
function initializeDataFile() {
    if (!fs.existsSync(DATA_FILE_PATH)) {
        const defaultState = {
            siteSettings: {
                instituteName: "The Vision Institute",
                teacherName: "Sudhir Shivam Sir",
                phone: "7225902570",
                whatsapp: "7225902570",
                email: "sudhirsilavat12@gmail.com",
                address: "Kulkula Mata Mandir, Englishpura, Sehore, 466001",
                logo: "",
                socialLinks: {
                    youtube: "https://m.youtube.com/c/MathsandEnglishClasses",
                    instagram: "#",
                    facebook: "#",
                    telegram: "#",
                    whatsapp: "7225902570"
                }
            },
            sliderData: [
                { title: "Empowering Minds, Shaping Futures", description: "Targeted systemic instructional pathways for board excellence under Sudhir Sir.", image: "" }
            ],
            courses: [],
            lectures: [],
            notes: [],
            galleryData: [],
            testimonialsData: [],
            inquiriesData: []
        };
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(defaultState), DEFAULT_KEY).toString();
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify({ payload: encryptedData }, null, 2), 'utf8');
    }
}

initializeDataFile();

// ==========================================================
// 🔄 1. DATA LIVE FETCH ENGINE (Website synchronization)
// ==========================================================
app.get('/api/getData', async (req, res) => {
    try {
        // Strict non-cache directive declarations
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        if (githubDb.isConfigured) {
            console.log("Fetching database dynamically from GitHub...");
            const gitData = await githubDb.fetchFromGithub();
            return res.status(200).json({ payload: gitData.payload });
        }

        initializeDataFile();
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        return res.status(200).json(JSON.parse(fileContent));
    } catch (err) {
        console.error("Read Error:", err.message);
        return res.status(500).json({ status: "ERROR", message: err.message || "Database read failure." });
    }
});

// ==========================================================
// 📝 2. WRITE LAYER ROUTE (Appends data safely into local database)
// ==========================================================
app.post('/api/update', async (req, res) => {
    try {
        const { password, data } = req.body;

        const adminSecretKey = process.env.ADMIN_SECRET_KEY || DEFAULT_KEY;
        if (!password || password !== adminSecretKey) {
            return res.status(401).json({ status: "MISMATCH", message: "Unauthorized validation failure." });
        }

        if (!data) {
            return res.status(400).json({ status: "ERROR", message: "Payload incomplete." });
        }

        // Encrypt data before saving to make sure database.json is encrypted
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), DEFAULT_KEY).toString();

        if (githubDb.isConfigured) {
            console.log("Committing database update to GitHub...");
            await githubDb.writeToGithub(encryptedData);
            return res.status(200).json({ status: "SUCCESS", message: "Encrypted database updated & committed to GitHub." });
        }

        const payloadObject = { payload: encryptedData };
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(payloadObject, null, 2), 'utf8');

        return res.status(200).json({ status: "SUCCESS", message: "Local encrypted database updated cleanly." });
    } catch (err) {
        console.error("Write Error:", err.message);
        return res.status(500).json({ status: "ERROR", message: err.message });
    }
});

// Server boot listener port mapping
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Secure Node System streaming dynamically on port ${PORT}`);
});