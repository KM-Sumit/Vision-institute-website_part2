const crypto = require('crypto');
const { sendNotesEmail } = require('./emailService');

// Cashfree API Configuration
const CASHFREE_APP_ID = (process.env.CASHFREE_APP_ID || '').replace(/^"|"$/g, '').trim();
const CASHFREE_SECRET_KEY = (process.env.CASHFREE_SECRET_KEY || '').replace(/^"|"$/g, '').trim();

// Automatically switch between Sandbox (Test) and Production (Live)
const CASHFREE_API_URL = CASHFREE_APP_ID.startsWith('TEST') 
    ? 'https://sandbox.cashfree.com/pg' 
    : 'https://api.cashfree.com/pg';
const API_VERSION = '2023-08-01';

// In-memory store for order details (to use during verification for sending email)
const orderStore = {};

// Create a new Cashfree order and get payment session ID
async function createOrder(req, res) {
    try {
        const { amount, noteTitle, noteClass, noteSubject, customerName, customerPhone, customerEmail, pdfLink } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ status: "ERROR", message: "Invalid amount." });
        }

        if (!customerEmail) {
            return res.status(400).json({ status: "ERROR", message: "Student email is required." });
        }

        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const customerId = `cust_${Date.now()}`;

        let baseOrigin = req.headers.origin || req.headers.referer || 'https://visioninstitutemp.in';
        baseOrigin = baseOrigin.replace(/\/$/, '');

        // Cashfree production mode requires HTTPS return_url.
        if (!CASHFREE_APP_ID.startsWith('TEST') && baseOrigin.startsWith('http:')) {
            if (baseOrigin.startsWith('http://localhost') || baseOrigin.startsWith('http://127.0.0.1')) {
                baseOrigin = 'https://visioninstitutemp.in';
            } else {
                baseOrigin = baseOrigin.replace(/^http:/, 'https:');
            }
        }

        const orderPayload = {
            order_id: orderId,
            order_amount: parseFloat(amount),
            order_currency: "INR",
            customer_details: {
                customer_id: customerId,
                customer_name: customerName || "Student",
                customer_phone: customerPhone || "9999999999",
                customer_email: customerEmail
            },
            order_meta: {
                return_url: `${baseOrigin}/index.html?order_id=${orderId}&order_status={order_status}`
            },
            order_note: `${noteTitle || 'Notes'} - Class ${noteClass || ''} ${noteSubject || ''}`,
            order_tags: {
                noteTitle: noteTitle ? noteTitle.substring(0, 200) : "N/A",
                noteClass: noteClass ? noteClass.substring(0, 200) : "N/A",
                noteSubject: noteSubject ? noteSubject.substring(0, 200) : "N/A"
            }
        };

        const response = await fetch(`${CASHFREE_API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': API_VERSION
            },
            body: JSON.stringify(orderPayload)
        });

        const data = await response.json();

        if (data.payment_session_id) {
            // SECURITY FIX: Fetch the actual PDF link directly from backend DB so frontend can't spoof or scrape it
            let actualPdfLink = "";
            try {
                const filePath = process.env.DATA_PATH || require('path').join(__dirname, '..', 'data.json');
                let defaultKey = process.env.ADMIN_SECRET_KEY || '';
                defaultKey = defaultKey.replace(/^"|"$/g, '').trim();
                if (require('fs').existsSync(filePath)) {
                    const fileContent = JSON.parse(require('fs').readFileSync(filePath, 'utf8'));
                    const decryptedBytes = require('crypto-js').AES.decrypt(fileContent.payload, defaultKey);
                    const dbState = JSON.parse(decryptedBytes.toString(require('crypto-js').enc.Utf8));
                    
                    const targetNote = dbState.notes?.find(n => n.title === noteTitle && n.class === noteClass);
                    if (targetNote && targetNote.link) {
                        actualPdfLink = targetNote.link;
                    }
                }
            } catch(e) {
                console.error("Failed to extract secure PDF link from DB:", e.message);
            }

            // Store order details for email sending after verification
            orderStore[orderId] = {
                email: customerEmail,
                noteTitle: noteTitle,
                noteClass: noteClass,
                noteSubject: noteSubject,
                price: amount,
                pdfLink: actualPdfLink
            };

            return res.status(200).json({
                status: "SUCCESS",
                payment_session_id: data.payment_session_id,
                order_id: data.order_id,
                order_amount: data.order_amount,
                environment: CASHFREE_APP_ID.startsWith('TEST') ? 'sandbox' : 'production'
            });
        } else {
            console.error("Cashfree Order Error:", JSON.stringify(data));
            return res.status(400).json({ status: "ERROR", message: data.message || "Order creation failed.", details: data });
        }
    } catch (err) {
        console.error("Cashfree Order Creation Error:", err.message);
        return res.status(500).json({ status: "ERROR", message: "Payment order creation failed: " + err.message });
    }
}

// Verify payment status after completion and send email
async function verifyPayment(req, res) {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({ status: "ERROR", message: "Order ID is required." });
        }

        const response = await fetch(`${CASHFREE_API_URL}/orders/${order_id}`, {
            method: 'GET',
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': API_VERSION
            }
        });

        const data = await response.json();

        if (data.order_status === 'PAID') {
            // 📧 Send email with notes/PDF to student
            let emailResult = { success: false };
            const storedOrder = orderStore[order_id];

            const customerEmail = data.customer_details?.customer_email || (storedOrder && storedOrder.email);
            const noteTitle = data.order_tags?.noteTitle !== "N/A" ? data.order_tags?.noteTitle : (storedOrder && storedOrder.noteTitle) || "Notes";
            const noteClass = data.order_tags?.noteClass !== "N/A" ? data.order_tags?.noteClass : (storedOrder && storedOrder.noteClass) || "";
            const noteSubject = data.order_tags?.noteSubject !== "N/A" ? data.order_tags?.noteSubject : (storedOrder && storedOrder.noteSubject) || "";
            const price = data.order_amount || (storedOrder && storedOrder.price);

            let actualPdfLink = storedOrder ? storedOrder.pdfLink : "";

            if (customerEmail && !actualPdfLink) {
                try {
                    const filePath = process.env.DATA_PATH || require('path').join(__dirname, '..', 'data.json');
                    let defaultKey = process.env.ADMIN_SECRET_KEY || '';
                    defaultKey = defaultKey.replace(/^"|"$/g, '').trim();
                    if (require('fs').existsSync(filePath)) {
                        const fileContent = JSON.parse(require('fs').readFileSync(filePath, 'utf8'));
                        const decryptedBytes = require('crypto-js').AES.decrypt(fileContent.payload, defaultKey);
                        const dbState = JSON.parse(decryptedBytes.toString(require('crypto-js').enc.Utf8));
                        
                        const targetNote = dbState.notes?.find(n => n.title === noteTitle && n.class === noteClass);
                        if (targetNote && targetNote.link) {
                            actualPdfLink = targetNote.link;
                        }
                    }
                } catch(e) {
                    console.error("Failed to extract secure PDF link from DB in verify:", e.message);
                }
            }

            if (customerEmail) {
                emailResult = await sendNotesEmail(
                    customerEmail,
                    {
                        title: noteTitle,
                        subject: noteSubject,
                        noteClass: noteClass,
                        price: price,
                        pdfLink: actualPdfLink
                    },
                    order_id
                );
                // Clean up stored order fallback
                if (storedOrder) delete orderStore[order_id];
            }

            return res.status(200).json({
                status: "SUCCESS",
                message: "Payment verified successfully!",
                order_id: data.order_id,
                order_amount: data.order_amount,
                emailSent: emailResult.success
            });
        } else {
            return res.status(400).json({
                status: "PENDING",
                message: `Payment status: ${data.order_status}`,
                order_status: data.order_status
            });
        }
    } catch (err) {
        console.error("Cashfree Payment Verification Error:", err.message);
        return res.status(500).json({ status: "ERROR", message: "Verification error." });
    }
}

module.exports = { createOrder, verifyPayment };
