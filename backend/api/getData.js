import fs from 'fs';
import path from 'path';
import CryptoJS from 'crypto-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const filePath = process.env.DATA_PATH || path.join(__dirname, '..', 'data.json');
        const defaultKey = process.env.ADMIN_SECRET_KEY;
        
        let fileContent;
        if (fs.existsSync(filePath)) {
            fileContent = fs.readFileSync(filePath, 'utf8');
        } else {
            // Seed default state if file doesn't exist
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
            const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(defaultState), defaultKey).toString();
            fileContent = JSON.stringify({ payload: encryptedData }, null, 2);
            fs.writeFileSync(filePath, fileContent, 'utf8');
        const adminSecretKey = process.env.ADMIN_SECRET_KEY;
        const requestPassword = req.query.pwd;

        // Security: Filter out sensitive PDF links if request is not from authorized admin
        if (requestPassword !== adminSecretKey && fileContent) {
            try {
                const raw = JSON.parse(fileContent);
                if (raw && raw.payload) {
                    const decryptedBytes = CryptoJS.AES.decrypt(raw.payload, defaultKey);
                    const rawJsonString = decryptedBytes.toString(CryptoJS.enc.Utf8);
                    if (rawJsonString) {
                        const parsedData = JSON.parse(rawJsonString);
                        if (parsedData.notes && parsedData.notes.length > 0) {
                            parsedData.notes = parsedData.notes.map(note => {
                                const { link, ...safeNote } = note;
                                return safeNote;
                            });
                            // Re-encrypt safe data and overwrite response payload
                            const filteredEncrypted = CryptoJS.AES.encrypt(JSON.stringify(parsedData), defaultKey).toString();
                            fileContent = JSON.stringify({ payload: filteredEncrypted }, null, 2);
                        }
                    }
                }
            } catch (e) {
                console.error("Payload security filter error:", e.message);
            }
        }

        // Strict non-cache directive declarations
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(200).json(JSON.parse(fileContent));
    } catch (err) {
        console.error("Serverless Read Sync Engine Error:", err.message);
        return res.status(500).json({ status: "ERROR", message: "Database sync parsing failure timeline timeout." });
    }
}