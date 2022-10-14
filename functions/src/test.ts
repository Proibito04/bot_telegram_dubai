import { Page } from "puppeteer";
import { Menu } from "./types";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { fromHtml } from "hast-util-from-html";
import { Root } from "hast-util-from-html/lib";
import { visit } from "unist-util-visit";
import { remove } from "unist-util-remove";
// @ts-ignore
import puppeteer from "puppeteer";

scrapaMenuOggiv2();

export async function scrapaMenuOggiv2(): Promise<Menu> {
	const browser = await puppeteer.launch({
		headless: true,
		slowMo: 100,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});
	const page = await browser.newPage();
	// Impsta user agent
	// await page.setUserAgent(
	// 	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
	// );
	// await caricaCookie(page)
	await page.goto(
		"https://m.facebook.com/pg/Dubaicoffeelounge/posts/?ref=page_internal&mt_nav=0"
	);
	await cliccaBottoneCookie(page);
	await schiacciaAltro(page);
	await delay(2000);
	await ottieniMenuV2(page);
	await browser.close();
	// await apriUltimoPost(page)
	// const id = await ottieniIdPagina(page)
	// const menu = await ottieniMenu(page);
	// await salvaErrore(false);
	//
	return {} as Menu;
}

async function ottieniMenuV2(pagina: Page) {
	const selettore = ".story_body_container > div:first-of-type";
	await pagina.waitForSelector(selettore);
	const ritorno = await pagina.$$eval(
		".story_body_container > div:first-of-type",
		(element) => {
			return element[0].innerHTML;
		}
	);

	const tree = fromHtml(ritorno) as Root;
	const file = await unified()
		.use(rehypeParse)
		.use(rehypeRemark)
		.use(plugin)
		.run(tree as any);

	// visit(file, "text", (nodo) => {
	// 	console.log(nodo);
	// });

	const ret = unified().use(remarkStringify).stringify(file);
	console.log(ret);
}

function plugin() {
	return (albero) => {
		remove(albero, "link");
	};
}

async function schiacciaAltro(pagina: Page) {
	const selettore = 'span[data-sigil="more"]';
	await delay(1000);
	await pagina.waitForSelector(selettore);
	await pagina.click(selettore);
}

async function cliccaBottoneCookie(pagina: Page) {
	const selettore = '*[data-cookiebanner="accept_button"]';
	await delay(1000);

	await pagina.waitForSelector(selettore);
	await pagina.click(selettore);
}

async function scrollaFinoInfondo(pagina: Page) {
	let nonTrovato = true;
	while (nonTrovato) {
		nonTrovato = !(await pagina.$("#pages_msite_body_contents"));
	}
}

async function apriUltimoPost(pagina: Page) {
	await pagina.click(
		"div#pages_msite_body_contents > div > div:nth-of-type(3)"
	);
}

async function ottieniMenu(pagina: Page) {
	try {
		await pagina.waitForSelector("*[data-gt]", { timeout: 5000 });
		const ritorno = await pagina.$eval("*[data-gt] div", (element) => {
			return element.innerHTML;
		});
		// rimove \ che per qualche ragione a me sconosciuta compare
		let grezza = "";
		grezza = grezza.replace(/\\-/gm, "- ");
		return grezza;
	} catch (e) {
		console.log(e);
		console.error("Errore nel prendere il menu!");
	}
	// await salvaErrore();
	return "c'è qualcosa che non va";
}

// funzione che resituisce id parametro di una pagina
async function ottieniIdPagina(pagina: Page): Promise<string> {
	const url = pagina.url();
	return new URL(url).searchParams.get("story_fbid") ?? "";
}

function delay(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}
