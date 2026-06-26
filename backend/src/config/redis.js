const { createClient } = require('redis');

let clientInstance = null;

function getClient() {
    if (!clientInstance) {
        clientInstance = createClient({
            username: 'default',
            password: process.env.REDIS_PASS,
            socket: {
                host: 'redis-12835.crce206.ap-south-1-1.ec2.cloud.redislabs.com',
                port: 12835
            }
        });
    }
    return clientInstance;
}

// Special properties accessed by bundlers/loaders at module evaluation time (global scope).
// We return undefined for these to prevent instantiating the real Redis client (which uses crypto) at load time.
const SPECIAL_PROPS = new Set([
    '__esModule',
    'default',
    'then',
    'constructor',
    'inspect',
    'prototype',
    'valueOf'
]);

// Export a proxy so that the client is instantiated lazily upon first property access.
// This resolves Cloudflare Worker errors due to accessing crypto.randomBytes in the global scope.
const redisClientProxy = new Proxy({}, {
    get(target, prop) {
        if (typeof prop === 'symbol' || SPECIAL_PROPS.has(prop)) {
            return undefined;
        }

        const client = getClient();
        const value = client[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    }
});

module.exports = redisClientProxy;
