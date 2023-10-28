const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function executeJavaScriptFile(htmlFilePath, jsCode) {
  const browser = await puppeteer.launch({headless:"new"});
  const page = await browser.newPage();

  // Load the HTML file
  console.log("Inside Puppeteer");
  const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
  console.log("Behind readFile");
  await page.setContent(htmlContent);

  // Execute the JavaScript code
  const result = await page.evaluate(jsCode);

  console.log(result);

  await browser.close();
}

const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error('Usage: node puppy.js <HTML_FILE_PATH> "<JS_CODE>"');
  process.exit(1);
}

const [htmlFilePath, jsCode] = args;
executeJavaScriptFile(htmlFilePath, jsCode).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

