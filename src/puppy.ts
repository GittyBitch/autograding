import puppeteer from 'puppeteer';
//import { promises as fs } from 'fs';
import * as path from 'path';

async function executeJavaScriptFile(htmlFilePath: string, jsCode: string) : Promise<any>  {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  //const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
  const fullPath = path.join(process.cwd(), htmlFilePath);
  await page.goto('file://'+ fullPath, { waitUntil: 'load' });
  const result = await page.evaluate(jsCode);
  await browser.close();
  return result; 
}

export default executeJavaScriptFile
