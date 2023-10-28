import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';

async function executeJavaScriptFile(htmlFilePath: string, jsCode: string) : Promise<any>  {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
  await page.setContent(htmlContent);
  const result = await page.evaluate(jsCode);
  await browser.close();
  return result; 
}


export default executeJavaScriptFile
