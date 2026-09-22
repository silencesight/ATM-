const puppeteer = require('puppeteer');
(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  
  console.log("Navigating...");
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking bulk button...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const bulkBtn = buttons.find(b => b.textContent && b.textContent.includes('Bulk $'));
    if(bulkBtn) bulkBtn.click();
    else console.log('Bulk button not found!');
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
  console.log("Done");
})();
