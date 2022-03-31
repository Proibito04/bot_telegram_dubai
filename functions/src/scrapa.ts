import {Page} from "puppeteer";
import {NodeHtmlMarkdown} from "node-html-markdown";
import * as functions from "firebase-functions";
import * as fs from "fs";
import {Menu} from "./types";
import {salvaErrore} from "./database";

const puppeteer = require('puppeteer');


export async function scrapaMenuOggi(): Promise<Menu> {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            slowMo: 100,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        // Impsta user agent
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
        await caricaCookie(page)
        await page.goto('https://m.facebook.com/pg/Dubaicoffeelounge/posts/?ref=page_internal&mt_nav=0');
        await apriUltimoPost(page)
        const id = await ottieniIdPagina(page)
        const menu = await ottieniMenu(page);
        await browser.close()
        await salvaErrore(false)
        return {menu, id} as Menu
    } catch (e) {
        functions.logger.error(e)
        await salvaErrore()
        return {menu: '', id: -1}
    }
}

async function salvaCookie(pagina: Page) {
    const cookies = await pagina.cookies();
    await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2), () => {
    });
}

async function cliccaBottoneCookie(pagina: Page) {
    const selettore = '*[data-cookiebanner="accept_button"]'
    await delay(1000)

    await pagina.waitForSelector(selettore)
    await pagina.click(selettore)
}

async function scrollaFinoInfondo(pagina: Page) {
    let nonTrovato = true
    while (nonTrovato) {
        nonTrovato = !(await pagina.$('#pages_msite_body_contents'))
    }
}

async function apriUltimoPost(pagina: Page) {
    await pagina.click('div#pages_msite_body_contents > div > div:nth-of-type(3)')
}

async function ottieniMenu(pagina: Page) {
    try {
        await pagina.waitForSelector('*[data-gt]', {timeout: 5000})
        const ritorno = await pagina.$eval('*[data-gt] div', (element) => {
            return element.innerHTML
        })
        // rimove \ che per qualche ragione a me sconosciuta compare
        let grezza = NodeHtmlMarkdown.translate(ritorno)
        grezza = grezza.replace(/\\-/gm, '- ');
        return grezza
    } catch (e) {
        console.log(e)
        console.error('Errore nel prendere il menu!')
    }
    await salvaErrore()
    return "c'è qualcosa che non va"
}

async function caricaCookie(pagina: Page) {
    const cookiesString = fs.readFileSync('./cookies.json', {encoding: 'utf8'});
    const cookies = JSON.parse(cookiesString);
    await pagina.setCookie(...cookies);
}

// funzione che resituisce id parametro di una pagina
async function ottieniIdPagina(pagina: Page): Promise<string> {
    const url = pagina.url()
    return new URL(url).searchParams.get('story_fbid') ?? '';
}

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}


export async function impostaCookie(): Promise<void> {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            slowMo: 100,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        // Impsta user agent
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
        await page.goto('https://m.facebook.com/pg/Dubaicoffeelounge/posts/?ref=page_internal&mt_nav=0');
        await delay(50000)
        await salvaCookie(page)
        await browser.close()
    } catch (e) {
    }
}
