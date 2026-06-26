import { httpServerHandler } from 'cloudflare:node';
import app from './app.js';
import main from './config/db.js';
import redisClient from './config/redis.js';

let initialized = false;

async function ensureConnections() {
    if (!initialized) {
        try {
            await Promise.all([main(), redisClient.connect()]);
            initialized = true;
            console.log("Lazy database and Redis connections initialized");
        } catch (error) {
            console.error("Failed to initialize connections:", error);
            throw error;
        }
    }
}

// Start Express listening internally on port 3000
app.listen(3000, () => {
    console.log("Internal Express server listening on port 3000");
});

const handler = httpServerHandler({ port: 3000 });

export default {
    async fetch(request, env, ctx) {
        // Copy wrangler environment variables / secrets to process.env
        // so that Mongoose, JWT, Gemini, etc. can read them.
        for (const key in env) {
            if (typeof env[key] === 'string') {
                process.env[key] = env[key];
            }
        }

        // Lazy initialize Mongoose and Redis connections on first request
        await ensureConnections();

        // Forward request using httpServerHandler
        return handler.fetch(request, env, ctx);
    }
};
