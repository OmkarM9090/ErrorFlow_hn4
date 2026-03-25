const scrape = require('./scraper');

scrape('https://www.geeksforgeeks.org/cpp/cpp-exercises/').then(data => {
    console.log(JSON.stringify(data, null, 2));
});