/**
 * NEXUS INNOVATION LAB // BACKEND SERVICE
 * * Technology Stack:
 * - Node.js
 * - Express Framework
 * - Body-Parser for JSON Ingestion
 * - CORS for Secure Cross-Origin Resource Sharing
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const serviceAccount = require('./serviceAccountKey.json');


const app = express();
const PORT = process.env.PORT || 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// --- MIDDLEWARE CONFIGURATION ---
// Enable CORS to allow the frontend to communicate with this server
app.use(cors({
    origin: '*', // In production, restrict this to your actual domain
    methods: ['POST', 'GET']
}));

// Parse JSON request bodies
app.use(bodyParser.json());

// Basic logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    next();
});

// --- API ENDPOINTS ---

/**
 * Health Check Endpoint
 * Used for monitoring service availability
 */
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'active', version: '1.0.0-nexus' });
});

/**
 * Membership Application Endpoint
 * Processes incoming inquiries from the frontend form
 */
app.post('/api/apply', async (req, res) => {
    const { name, email, message, timestamp } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 🔥 Save to Firestore
        const docRef = await db.collection('applications').add({
            name,
            email,
            message,
            timestamp,
            status: 'pending'
        });

        // 📧 Email Notification
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'codingclubiccs@gmail.com',
                pass: 'slad cazt ebxx kuia'
            }
        });

        await transporter.sendMail({
            from: '"Coding Club" <yourclubemail@gmail.com>',
            to: 'yourclubemail@gmail.com',
            subject: 'New Application Received',
            html: `
                <h3>New Application</h3>
                <p><b>Name:</b> ${name}</p>
                <p><b>Email:</b> ${email}</p>
                <p><b>Message:</b> ${message}</p>
            `
        });

        res.status(201).json({
            success: true,
            referenceId: docRef.id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// --- INITIALIZATION ---
app.listen(PORT, () => {
    console.log(`NEXUS Backend Service online.`);
    console.log(`Listening on port: ${PORT}`);
    console.log(`Press Ctrl+C to terminate.`);
});
