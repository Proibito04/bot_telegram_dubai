import {db} from "./impstaFirebase";
import {database} from "firebase-admin";
import * as moment from "moment";
import {Moment} from "moment/moment";
import 'moment/locale/it'
import {User} from "telegraf/typings/core/types/typegram";
import DataSnapshot = database.DataSnapshot;

moment.locale('it');

export async function ottieniUltimoGiornoSalvato(): Promise<Moment> {
    const ref = db.ref('impostazioni/oggi');
    const dataOggiSnap: DataSnapshot = await ref.get();
    const dataOggi: string = dataOggiSnap.val()

    // Se non esiste
    if (dataOggi == null) {
        await ref.set(moment('01/01/2000', "DD/MM/YYYY").toISOString())
        return moment('01/01/2000', "DD/MM/YYYY")
    }
    return moment(dataOggi)
}

export async function ottieniUltimoMenuSalvato(): Promise<string> {
    const ref = await db.ref('menus').get();
    const menus = ref.val()
    return menus[Object.keys(menus)[0]].menu
}

// Prende dal server l'ultimo id del menu
export async function ottieniUltimoIDSalvato(): Promise<string> {
    const ref = await db.ref('impostazioni/ultimoID').get();
    return ref.val()
}

export async function aggiornaDataOggi() {
    const ref = db.ref('impostazioni/oggi')
    await ref.set(moment().toISOString())
}

export async function aggiornaUltimoMenuID(id: number | string) {
    const ref = db.ref('impostazioni/ultimoID')
    await ref.set(id)
}

/**
 * Pusha il pranzo di oggi sul server
 * @param data
 * @param menu il menu in formato testo
 */
export async function pushPranzoOggi(data: Moment, menu: string) {
    const ref = await db.ref(`menus`)
    const valoreSnap = await ref.get()
    let valore = valoreSnap.val();
    if (!valore) {
        valore = []
    }
    valore.unshift({
        data: data.toISOString(),
        menu
    })
    ref.set(valore);
}

/**
 * Salva l'utente
 * @param utente
 */
export async function salvaUtente(utente: User) {
    const ref = await db.ref(`utenti/${utente.id}`)
    await ref.set(utente)
}


/**
 * aggiunte o modifica l'utente sul server che vuole essere aggiornato sui menu ogni volta che ne esce uno nuovo
 *
 *  @param utente l'utente da inserire sul server
 */
export async function salvaUtenteDaTenereAggiornato(utente: User) {
    const ref = await db.ref(`utentiDaAggiornare/${utente.id}`)
    await ref.set(`${utente.id}`)
}

/**
 * Elimina l'utente dalle persone da aggiornare
 * @param utente
 */
export async function eliminaUtenteDaTenereAggiornato(utente: User) {
    const ref = await db.ref(`utentiDaAggiornare/${utente.id}`)
    await ref.remove()
}

/**
 * In caso di errore lo salva sul server
 */
export async function salvaErrore(errore?: boolean) {
    const ref = await db.ref(`impostazioni/errore`)
    await ref.set(errore ?? true)
}

export async function ottieniErrore(): Promise<boolean> {
    const ref = await db.ref(`impostazioni/errore`).get()
    return ref.val() ?? false
}


/**
 * Ottieni tutti gli utenti da aggiornare
 */
export async function ottieniUtentiDaAggiornare(escludi?: string): Promise<string[]> {
    const ref = await db.ref(`utentiDaAggiornare/`).get()
    const utenti: string[] | [] = Object.keys(ref.val() ?? [])
    if (escludi) {
        utenti.splice(utenti.findIndex(i => i == escludi), 1)
        return utenti
    }
    return utenti
}

export async function ottieniTuttiIDUtenti(): Promise<string[]>{
    const ref = await db.ref(`utenti/`).get()
    return Object.keys(ref.val() ?? [])

}
