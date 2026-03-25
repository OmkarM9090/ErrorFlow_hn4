const scrape = require('./scraper');

scrape('https://www.w3schools.com/').then(data => {
  console.log(JSON.stringify(data, null, 2));
});
