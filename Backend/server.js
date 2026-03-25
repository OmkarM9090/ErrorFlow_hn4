require('dotenv').config();
const express = require('express');
const cors = require('cors');
const scrape = require('./scraper');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

app.get('/scan', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter "url" is required',
            });
        }

        const data = await scrape(url);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to scan website',
            error: error.message,
        });
    }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();