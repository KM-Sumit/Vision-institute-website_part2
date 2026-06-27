require('dotenv').config();
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
        let adminSecretKey = process.env.ADMIN_SECRET_KEY || DEFAULT_KEY;
        adminSecretKey = adminSecretKey.replace(/^"|"$/g, '').trim();
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(defaultState), adminSecretKey).toString();
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

        let adminSecretKey = process.env.ADMIN_SECRET_KEY || DEFAULT_KEY;
        adminSecretKey = adminSecretKey.replace(/^"|"$/g, '').trim();

        let payloadToReturn;
        if (githubDb.isConfigured) {
            console.log("Fetching database dynamically from GitHub...");
            const gitData = await githubDb.fetchFromGithub();
            payloadToReturn = gitData.payload;
        } else {
            initializeDataFile();
            const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
            payloadToReturn = JSON.parse(fileContent).payload;
        }

        const requestPassword = req.query.pwd;
        if (requestPassword !== adminSecretKey && payloadToReturn) {
            try {
                const decryptedBytes = CryptoJS.AES.decrypt(payloadToReturn, adminSecretKey);
                const rawJsonString = decryptedBytes.toString(CryptoJS.enc.Utf8);
                if (rawJsonString) {
                    const parsedData = JSON.parse(rawJsonString);
                    if (parsedData.notes && parsedData.notes.length > 0) {
                        parsedData.notes = parsedData.notes.map(note => {
                            const { link, pdfLink, ...safeNote } = note;
                            return safeNote;
                        });
                        payloadToReturn = CryptoJS.AES.encrypt(JSON.stringify(parsedData), adminSecretKey).toString();
                    }
                }
            } catch (e) {
                console.error("Payload security filter error:", e.message);
            }
        }
        return res.status(200).json({ payload: payloadToReturn });
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

        let adminSecretKey = process.env.ADMIN_SECRET_KEY || DEFAULT_KEY;
        adminSecretKey = adminSecretKey.replace(/^"|"$/g, '').trim();

        if (!password || password !== adminSecretKey) {
            return res.status(401).json({ status: "MISMATCH", message: "Unauthorized validation failure." });
        }

        if (!data) {
            return res.status(400).json({ status: "ERROR", message: "Payload incomplete." });
        }

        // Encrypt data before saving to make sure database.json is encrypted
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), adminSecretKey).toString();

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

// ==========================================================
// 💳 3. CASHFREE PAYMENT GATEWAY ROUTES
// ==========================================================
const payment = require('./api/payment');
app.post('/api/create-order', payment.createOrder);
app.post('/api/verify-payment', payment.verifyPayment);

// ==========================================================
// ⭐ 4. STUDENT REVIEW SUBMISSION (Public — no password needed)
// ==========================================================
app.post('/api/submitReview', async (req, res) => {
    try {
        const { name, email, class: cls, rating, reviewText } = req.body;
        if (!name || !reviewText) return res.status(400).json({ status: 'ERROR', message: 'Name and review required.' });

        let adminSecretKey = (process.env.ADMIN_SECRET_KEY || DEFAULT_KEY).replace(/^\"|\"$/g, '').trim();

        // Read current data
        let currentState = {};
        try {
            if (githubDb.isConfigured) {
                const gitData = await githubDb.fetchFromGithub();
                const dec = CryptoJS.AES.decrypt(gitData.payload, adminSecretKey);
                currentState = JSON.parse(dec.toString(CryptoJS.enc.Utf8));
            } else {
                const fileContent = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf8'));
                const dec = CryptoJS.AES.decrypt(fileContent.payload, adminSecretKey);
                currentState = JSON.parse(dec.toString(CryptoJS.enc.Utf8));
            }
        } catch(e) { currentState = { siteSettings:{}, sliderData:[], courses:[], lectures:[], notes:[], galleryData:[], testimonialsData:[], inquiriesData:[] }; }

        if (!currentState.testimonialsData) currentState.testimonialsData = [];
        currentState.testimonialsData.push({ 
            name, 
            email: email || '',
            class: cls || '', 
            rating: rating || 5, 
            reviewText 
        });

        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(currentState), adminSecretKey).toString();
        if (githubDb.isConfigured) {
            await githubDb.writeToGithub(encrypted);
        } else {
            fs.writeFileSync(DATA_FILE_PATH, JSON.stringify({ payload: encrypted }, null, 2), 'utf8');
        }

        // Send email notification to Sudhir Sir
        try {
            const { sendReviewNotificationEmail } = require('./api/emailService');
            await sendReviewNotificationEmail({ name, email: email || 'No email', rating: rating || 5, cls: cls || '', reviewText });
        } catch (emailErr) {
            console.error('Failed to send review email notification:', emailErr.message);
        }

        return res.status(200).json({ status: 'SUCCESS', message: 'Review saved!' });
    } catch(err) {
        console.error('Review Error:', err.message);
        return res.status(500).json({ status: 'ERROR', message: err.message });
    }
});

// ==========================================================
// 🖥️ 4. SERVE FRONTEND STATIC FILES
// ==========================================================
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Serve index.html for any unknown route to support SPA navigation
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Server boot listener port mapping
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Secure Node System streaming dynamically on port ${PORT}`);
    });
}

// EXPORT APP FOR VERCEL SERVERLESS SUPPORT
module.exports = app;