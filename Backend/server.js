// const express = require('express');
// const cors = require('cors');
// const scrape = require('./scraper');

// const app = express();
// app.use(cors());

// app.get('/scan', async (req, res) => {
//     const url = req.query.url;
//     const data = await scrape(url);
//     res.json(data);
// });

// app.listen(5000, () => console.log("Server running"));


/**
 * server.js
 *
 * HTTP server entry point.
 * Separate from app.js so app can be imported in tests without binding a port.
 */

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Accessibility Audit API running on port ${PORT}`);
});