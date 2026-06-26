const express = require('express');
const app = require('../src/app');
const main = require('../src/config/db');
const redisClient = require('../src/config/redis');

let initialized = false;

async function ensureConnections() {
    if (!initialized) {
        try {
            await Promise.all([main(), redisClient.connect()]);
            initialized = true;
            console.log("Database and Redis connections initialized");
        } catch (error) {
            console.error("Failed to initialize connections:", error);
            throw error;
        }
    }
}

const wrapperApp = express();

// Set up connection check as the first middleware
wrapperApp.use(async (req, res, next) => {
    try {
        await ensureConnections();
        next();
    } catch (error) {
        res.status(500).send("Database/Redis Connection Error: " + error.message);
    }
});

// Delegate all requests to the original app
wrapperApp.use(app);

module.exports = wrapperApp;
