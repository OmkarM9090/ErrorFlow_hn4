require('dotenv').config();
const express = require('express');
const cors = require('cors');
const scrape = require('./scraper');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());

app.get('/scan', async (req, res) => {
    const url = req.query.url;
    const data = await scrape(url);
    res.json(data);
});

app.listen(5000, () => console.log("Server running"));