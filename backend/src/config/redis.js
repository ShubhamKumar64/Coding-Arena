// const { createClient } = require('redis');

// const redisClient = createClient({
//     username: 'default',
//     password: process.env.REDIS_PASS,
//     socket: {
//         host: 'redis-12835.crce206.ap-south-1-1.ec2.cloud.redislabs.com',
//         port: 12835
//     }
// });

// module.exports = redisClient;

const { createClient } = require ('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    // bdxFpra88MXd8F33EnHVo8McICZO9So8
    socket: {
        host: 'redis-12835.crce206.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 12835
    }
});

// client.on('error', err => console.log('Redis Client Error', err));

// await client.connect();

// await client.set('foo', 'bar');
// const result = await client.get('foo');
// console.log(result)  // >>> bar

module.exports = redisClient;
