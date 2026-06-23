# The Vision Institute - Complete Project Report 🚀

Ye report aapke poore project ka aasaan bhasha (Hinglish) me ek map hai. Isme likha hai ki konsa folder kya kaam karta hai, aur kis file ko run karne ke liye konsi command lagani padti hai.

---

## 📂 1. Project Ke Folders aur Unka Kaam

Aapke project me mainly 3 hisse (parts) hain:

### A. `frontend` (Jo students ko dikhta hai)
*   **`index.html`**: Ye website ka main page hai jo students ko dikhta hai. Isme courses, videos aur saari details dikhti hain.
*   **`admin.html`**: Ye aapka (Sir ka) control room hai. Yahan se aap website ka data update ya change karte hain (Password dalke).
*   **`package.json` & `package-lock.json`**: Ye frontend ki setting files hain, jinme likha hai ki website me konse external tools use hue hain (jaise live-server chalane ke liye). 
*   **`.txt` ki jagah `.json`**: Hum `.json` isliye use karte hain taaki browser aur code use jaldi aur asaani se padh sake (Key-Value form me).

### B. `backend` (Jo data handle karta hai)
Ye website ka dimag (brain) aur tijori (database) dono hai.
*   **`server.js`**: Ye main backend ka engine hai. Jab isko start karte ho, toh ye ek local server bana deta hai.
*   **`data.json`**: Ye wo file hai jisme aapka saara data (courses, links, address) lock (encrypt) karke save hota hai.
*   **`api/getData.js`**: Ye file aapke encrypted data ko padhti hai aur website ko safely bhejti hai.
*   **`api/update.js`**: Ye file admin se naya data leti hai, password check karti hai, use encrypt karti hai aur `data.json` me save kar deti hai.
*   **`.env` (myenv)**: Is file me hum apne passwords aur secret keys chhupate hain taaki koi aur unhe dekh na sake (GitHub wagera par).
*   **`package.json` & `package-lock.json`**: Ye batate hain ki backend me konse Node.js module (jaise `express`, `crypto-js`) install kiye gaye hain aur unka lock version kya hai.

### C. `extension` (Chrome Extension)
Ye ek custom Chrome browser extension hai jise aap browser me install kar sakte ho.
*   **`manifest.json`**: Extension ka ID card.
*   **`popup.html` & `popup.js`**: Ye browser ke top-right corner me ek chhota box kholte hain aur backend se latest course aur videos laa kar dikhate hain, taaki aapko poori website na kholni pade.

---

## 💻 2. Commands Ki List (Project Chalane ke liye)

Yaha step-by-step likha hai ki project ko chalana kaise hai. Aapko apne Terminal (VS Code terminal ya Command Prompt) me ye commands likhni hain:

### Step 1: Backend Server Chalana
Sabse pehle backend ko on karna zaroori hai taaki data mil sake.
1.  Terminal me backend folder ke andar jayein:
    ```bash
    cd backend
    ```
2.  Agar aapne modules pehli baar download karne hain (ya naye PC me chala rahe hain), toh ye likhein:
    ```bash
    npm install
    ```
3.  Server ko chaalu karne ke liye ye command lagayein:
    ```bash
    node server.js
    ```
    *(Ye chalu rehna chahiye. Is terminal ko band na karein. Ek naya (second) terminal khol lein baaki kaamo ke liye).*

### Step 2: Frontend Website Chalana
1.  Naye terminal me frontend folder ke andar jayein:
    ```bash
    cd frontend
    ```
2.  (Optional) Agar aapke paas koi frontend build step ya packages hain toh `npm install` karein, warna seedhe next step.
3.  Website ko live server par chalane ke liye (Agar aap `live-server` package use kar rahe hain):
    ```bash
    npx serve
    ```
    *Ya phir aap VS Code me `index.html` par Right Click karke **"Open with Live Server"** bhi kar sakte hain.*

### Step 3: Chrome Extension Install Karna
Iske liye koi command nahi chahiye, bas browser me setting karni hai:
1.  Apna Google Chrome kholiye.
2.  Address bar me likhiye: `chrome://extensions/` aur Enter dabaiye.
3.  Top-right me **"Developer mode"** ka button hoga, use ON kar dijiye.
4.  Top-left me **"Load unpacked"** (ya "unpacked extension load karein") ka button aayega. Us par click karein.
5.  Apne computer me se `Desktop/coching/extension` wala folder select kar lein.
6.  Aapka The Vision Institute wala extension Chrome me add ho jayega!

---
**Summary Rule:** 
- **Start Backend:** `cd backend` -> `node server.js`
- **Start Frontend:** `cd frontend` -> Open `index.html` 
- **Passwords:** Hamesha `.env` me rakhne hain!

---

## 💳 3. Cashfree Payment Gateway (LIVE Integration)

Aapke project me ab **Cashfree Payment Gateway** successfully add ho chuka hai! Students ab notes ko seedha online pay karke khareed sakte hain.

### Kaise kaam karta hai?
1. **Student** website par Notes section me "💳 Buy Now" button par click karta hai.
2. **Backend** (`server.js` → `api/payment.js`) Cashfree se ek secure Order ID banwata hai.
3. **Cashfree Popup** khulta hai jahan student UPI / Card / NetBanking se pay kar sakta hai.
4. **Payment hone ke baad**, backend verify karta hai ki paisa aaya ya nahi.
5. ✅ Success ya ❌ Failed ka message student ko dikhta hai.

### Files jo is feature me kaam karti hain:
*   **`backend/api/payment.js`** (NAYI FILE) - Cashfree ke saath order banana aur verify karna.
*   **`backend/server.js`** - Do naye routes add hue: `/api/create-order` aur `/api/verify-payment`.
*   **`frontend/index.html`** - Notes cards me "Buy Now" button aur Cashfree SDK add hua.

### Aapki Cashfree API Details:
*   **App ID:** `TEST111158894fefa705d3add44a42a298851111`
*   **Secret Key:** ⚠️ **Aapko apni Cashfree Dashboard se Secret Key lekar backend code me add karni hogi!**
*   Backend file `backend/api/payment.js` me line 5 par `REPLACE_WITH_YOUR_CASHFREE_SECRET_KEY` ko apni asli secret key se badlein.
*   **Production ke liye:** `sandbox.cashfree.com` ko `api.cashfree.com` me badalna hoga.

