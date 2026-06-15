// 🔐 OBFUSCATED TOKEN STORAGE CHUNKS (Inspect element matrix bypass logic)
const _chunkAlpha = "ImranSir";
const _chunkBeta = "@Vision";
const _chunkGamma = "Encryption2026NodeKey";

function reassembleSecretKey() {
    return `${_chunkAlpha}${_chunkBeta}${_chunkGamma}`;
}

// 🔴 CHANGE THIS TO YOUR LIVE DEPLOYED API ADDRESS:
const VERCEL_PRODUCTION_API = "https://vision-institute-website-part2.onrender.com"; 

document.addEventListener('DOMContentLoaded', () => {
    fetchDecryptedCloudData();
});

async function fetchDecryptedCloudData() {
    const statusBox = document.getElementById('status-node');
    const cacheBusterTimestamp = Date.now();
    const endpointTarget = `${VERCEL_PRODUCTION_API}/api/getData?cb=${cacheBusterTimestamp}`;

    try {
        const response = await fetch(endpointTarget, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });

        if (!response.ok) throw new Error("Proxy Hub Stream connection dropped.");
        const data = await response.json();

        if (!data.payload) throw new Error("Encrypted payload footprint parsing fault.");

        const runtimeAESKey = reassembleSecretKey();

        // 🔓 DECRYPTION DE-SERIALIZATION CONTEXT ENGINE
        const decryptedBytes = CryptoJS.AES.decrypt(data.payload, runtimeAESKey);
        const rawJsonString = decryptedBytes.toString(CryptoJS.enc.Utf8);

        if (!rawJsonString) throw new Error("Decryption mismatch footprint signature error.");

        const cleanDataset = JSON.parse(rawJsonString);
        renderExtensionDOM(cleanDataset);
        statusBox.textContent = "🔒 SECURE ENCRYPTED NODE DATA SYNCHRONIZED";
        
    } catch(err) {
        console.error("Extension Handshake Failure Matrix:", err.message);
        statusBox.style.color = "#dc2626";
        statusBox.textContent = "TUNNEL FAULT BUFFER ACTIVE";
    }
}

function renderExtensionDOM(data) {
    const cBox = document.getElementById('courses-box');
    const vBox = document.getElementById('videos-box');

    if(data.courses && data.courses.length) {
        cBox.innerHTML = data.courses.map(c => `• <b>${c.title}</b> (Class ${c.class} - ${c.subject})`).join('<br>');
    } else {
        cBox.textContent = "Zero active course objects synchronized.";
    }

    if(data.lectures && data.lectures.length) {
        vBox.innerHTML = data.lectures.map(v => `• <a href="${v.url}" target="_blank">${v.title}</a>`).join('<br>');
    } else {
        vBox.textContent = "Zero digital referenced video loops active.";
    }
}