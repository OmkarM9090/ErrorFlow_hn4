const scrape = require('./scraper');

scrape('https://www.geeksforgeeks.org/cpp/c-plus-plus/').then(data => {
  console.log(JSON.stringify(data, null, 2));
});
