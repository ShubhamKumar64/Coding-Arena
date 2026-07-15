const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const main = require('./config/db');
const redisClient = require('./config/redis');
const setupSocket = require('./socket');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174'
        ],
        credentials: true
    }
});

setupSocket(io);

const InitalizeConnection = async () => {
    try {
        await Promise.all([main(), redisClient.connect()]);
        console.log("DB and Redis Connected");
        
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log("Server listening at port number: " + PORT);
        });
    }
    catch(err) {
        console.log("Error: " + err);
    }
}

InitalizeConnection();

