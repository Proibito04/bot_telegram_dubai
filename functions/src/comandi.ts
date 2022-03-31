import * as functions from "firebase-functions";
import {controllaStessoGiorno} from "./tempo";
import {
    aggiornaDataOggi,
    aggiornaUltimoMenuID,
    eliminaUtenteDaTenereAggiornato,
    ottieniErrore,
    ottieniTuttiIDUtenti,
    ottieniUltimoGiornoSalvato,
    ottieniUltimoIDSalvato,
    ottieniUltimoMenuSalvato,
    ottieniUtentiDaAggiornare,
    pushPranzoOggi,
    salvaUtente,
    salvaUtenteDaTenereAggiornato
} from "./database";
import {Menu} from "./types";
import {scrapaMenuOggi} from "./scrapa";
import * as moment from "moment/moment";
import {Markup, Telegraf} from "telegraf";

// TODO fixxare in caso di errori

export const bot = new Telegraf(functions.config().telegram.token, {telegram: {webhookReply: true}})

const messaggioHelp = `
Ho dei comandi:

/menuoggi - Ti dò il menu di oggi
/tienimiaggiornato - Ogni volta che esce un menù, e qualcuno lo ottiene, lo mando a tutto il resto della combriccola 🤠 (solo la prima volta al giorno)
/discrivimidallalista - Ti disiscrivo dalla lista, non riceverai più messaggi in automatico
/help - Ottieni questo messaggio
/infobot - Scopri chi è il mio creatore con i suoi contatti

Il codice è open source quindi se volete migliorarmi o avete qualche idea figa potete farlo tramite Github o contattando il mio creatore.
Per avere tutti i dettaglio /infobot.

Fine. Buon divertimento

<i>Sono ancora in fase sperimentale se ogni tanto muoio è normale, tanto poi riparto🤖</i>

P.s.: Se eviti di spammare mi fai un favore
`

/**
 * Inizializza Bot
 */
bot.command('start', async (ctx) => {
        ctx.reply('Ciao, qui puoi trovare il menu del Dubai! 🔥')
        await salvaUtente(ctx.from)
        await ctx.replyWithHTML(messaggioHelp)
    }
)

bot.command('help', (ctx) => {
    ctx.replyWithHTML(messaggioHelp)
})

bot.command('menuoggi', async (ctx) => {
    let stringaDaStampare: string;
    const errore = await ottieniErrore()

    // Fa un check se oggi ha già controllato il menu
    if (controllaStessoGiorno((await ottieniUltimoGiornoSalvato())) && !errore) {
        stringaDaStampare = await ottieniUltimoMenuSalvato()
    } else {
        ctx.reply('Dammi un momento che devo andare a prenderlo... 🤓.')
        const menu: Menu = await scrapaMenuOggi()
        // controlla ban facebook
        if (menu.id === -1) {
            await ctx.reply(`Ciao molto probabilmente Facebook mi sta dando dei problemi, ora mi aggiusto!⚙️🛠️

Ci vorrà un po', lo vedrai quando ripartirò 😀`)
            return
        }


        if (menu.id === await ottieniUltimoIDSalvato() && !errore) {
            // Se il menu non è ancora uscito
            stringaDaStampare = 'Oggi il menu non è ancora uscito!'
        } else {
            // Se è il primo trigger della giornata
            ctx.reply('Sei il primo oggi a chiedermelo! 🥳')
            await pushPranzoOggi(moment(), menu.menu)
            await aggiornaDataOggi();
            await aggiornaUltimoMenuID(menu.id)
            stringaDaStampare = menu.menu

            // mando a tutti gli iscritti
            for (const utente of await ottieniUtentiDaAggiornare(String(ctx.from.id))) {
                try {
                    ctx.telegram.sendMessage(utente, `Ciao oggi potrai mangiare:

${stringaDaStampare}

buon appetito! 😋

Ringraziate @${ctx.from.username}, che oggi è stato il primo!
`)
                } catch (e) {
                    console.error(e)
                }
            }

        }

    }

    // Controlla se oggi ha già controllato
    await ottieniUltimoGiornoSalvato()
    await ctx.reply(
        `${ctx.from.first_name} oggi potrai mangiare:

${stringaDaStampare}

buon appetito! 😋
`
    )
    ctx.reply(`Lo sai che puoi rimanere aggiornato in modo automatico digirando: /tienimiaggiornato ?`)
})

// Inizio dei comandi relativi a tienimi aggiornato
// ------------------------------------------------

// con questo comando l'utente decide se ricevere il messaggio
bot.command('tienimiaggiornato', async (ctx) => {
    return ctx.reply('Vuoi tenerti aggiornato?',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                Markup.button.callback('🙋‍♀️🙋 Sì', 'siAggiorna'),
                Markup.button.callback('🙅‍♀️🙅‍♂️ No', 'nonVoglio')
            ])
        }
    )
})

bot.action('siAggiorna', async (ctx) => {
    ctx.reply('Ok allora ti aggiungo! 😀')
    ctx.reply('Ricordati che se vuoi eliminarti puoi digitare: /discrivimidallalista')
    if (ctx.from)
        await salvaUtenteDaTenereAggiornato(ctx.from)
})


bot.action('nonVoglio', async (ctx) => {
    ctx.reply('Ok allora nulla!')
    ctx.reply('Se cambi idea puoi sempre fare /tienimiaggiornato')
})

bot.command('discrivimidallalista', async (ctx) => {
    ctx.reply('Ok ti elimino dalla lista... 🙃')
    await eliminaUtenteDaTenereAggiornato(ctx.from)
})

// Restituisce l'ora nel server del bot
bot.command('dammiOra', (ctx) => {
    return ctx.reply(`${moment().format('DD/MM/YYYY hh:mm:ss')} a buccin`)
})


// fine dei comandi relativi a tienimi aggiornato
// ------------------------------------------------

bot.command('infobot', async (ctx) => {
    ctx.reply('Ciao!')
    ctx.reply(
        `Sono stato creato da Edoardo Balzano. @Pedoardo04 🧑🏼‍💻.
Se vuoi puoi aiutarlo a costruirmi e/o migliorarmi.
Ha detto che se vuoi anche solo salutarlo va bene ugualmente...

Cose da nerd 🤓: sono stato scritto in Node (Typescript 💙), uso firebase e tanto amore ❤️.

edoardobalzano01@gmail.com - https://github.com/Proibito

Ringrazio il mio mitico🦸 alpha tester Deniss 👨🏽‍🦰 (non pagato)
`
    )
    return
})


bot.command('test', async (ctx) => {
    console.log(await ottieniErrore())
})

/**
 * Fa uscire l bot
 */
bot.command('stop', (ctx) => {
    ctx.reply(`Sciao bello!`)
})

/**
 * Invia messaggio a tutti
 * non è proprio il massimo ma funziona
 */
bot.on('text', async (ctx) => {
    if (!ctx.message.text.includes('invia messaggio:')) {
        return
    }

    if (ctx.from.id !== 1013062356) {
        ctx.reply('Bel tentavivo!')
        return
    }

    const utenti = await ottieniTuttiIDUtenti();
    const messaggio = ctx.message.text.replace('invia messaggio:', '')
    for (const utente of utenti) {
        if (utente !== '1013062356')
            await ctx.telegram.sendMessage(utente, messaggio)
    }
    ctx.reply(`inviato messagio a tutti: ${messaggio}`)
})
