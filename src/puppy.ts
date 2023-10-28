import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';

async function executeJavaScriptFile(htmlFilePath: string, jsCode: string) : Promise<any>  {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  // Load the HTML file
  //console.log("Inside Puppeteer");
  const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
  //console.log("Behind readFile");
  await page.setContent(htmlContent);
  // Execute the JavaScript code
  const result = await page.evaluate(jsCode);
  await browser.close();
  return result; //console.log(result);
}

//executeJavaScriptFile("index.html", "document.querySelectorAll('header a')[0].textContent");

export default executeJavaScriptFile
