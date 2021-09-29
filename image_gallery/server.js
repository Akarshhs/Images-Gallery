const bodyParser = require('body-parser');
const express = require('express');

const connectDB = require('./src/config/db')
const imageApi = require('./src/controllers/api');

async function main() {
    const PORT = 6000;
    const app = express();

    app.use(bodyParser.json())
    app.use('/api', imageApi)

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server listening on ${PORT}`)
    })
    try {
        await connectDB();
        console.log("Successfully connected")
    } catch (e) {
        console.error('Failed to connect to thd database', e)
    }


}

main();