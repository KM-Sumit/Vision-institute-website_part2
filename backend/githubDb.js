const CryptoJS = require('crypto-js');

let GITHUB_PAT = process.env.GITHUB_PAT || "";
GITHUB_PAT = GITHUB_PAT.replace(/^"|"$/g, '').trim();

let GITHUB_REPO = process.env.GITHUB_REPO || "KM-Sumit/Vision-institute-website_part2";
GITHUB_REPO = GITHUB_REPO.replace(/^"|"$/g, '').trim();

const GITHUB_PATH = process.env.GITHUB_PATH || "backend/data.json";

/**
 * Fetches the encrypted payload file from GitHub repository
 * @returns {Promise<{payload: string, sha: string}>}
 */
async function fetchFromGithub() {
    if (!GITHUB_PAT) {
        throw new Error("GITHUB_PAT is not defined in environment variables.");
    }

    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${GITHUB_PAT}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Vision-Backend"
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch database file from GitHub: ${response.statusText}`);
    }

    const data = await response.json();
    // GitHub API returns file content base64-encoded with newlines
    const rawBase64Content = data.content.replace(/\s/g, "");
    const decodedString = Buffer.from(rawBase64Content, 'base64').toString('utf8');
    const parsedJson = JSON.parse(decodedString);

    return {
        payload: parsedJson.payload,
        sha: data.sha
    };
}

/**
 * Commits the encrypted payload file to GitHub repository
 * @param {string} encryptedPayload - The encrypted AES payload string
 * @returns {Promise<void>}
 */
async function writeToGithub(encryptedPayload) {
    if (!GITHUB_PAT) {
        throw new Error("GITHUB_PAT is not defined in environment variables.");
    }

    // 1. Get the current file's SHA first (required to overwrite an existing file)
    let sha = null;
    try {
        const fetchRes = await fetchFromGithub();
        sha = fetchRes.sha;
    } catch (err) {
        console.warn("Could not retrieve existing file SHA, will try to commit without it:", err.message);
    }

    // 2. Prepare payload
    const payloadObject = { payload: encryptedPayload };
    const contentString = JSON.stringify(payloadObject, null, 2);
    const contentBase64 = Buffer.from(contentString, 'utf8').toString('base64');

    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
    const body = {
        message: "Database updated dynamically via admin panel",
        content: contentBase64
    };
    if (sha) {
        body.sha = sha;
    }

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${GITHUB_PAT}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "Vision-Backend"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update database on GitHub: ${response.status} - ${errorText}`);
    }
}

module.exports = {
    isConfigured: !!GITHUB_PAT,
    fetchFromGithub,
    writeToGithub
};
