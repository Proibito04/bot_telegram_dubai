import * as functions from "firebase-functions";
import "moment/locale/it";
import "./comandi";
import { bot } from "./comandi";
import { impostaCookie, scrapaMenuOggiv2 } from "./scrapa";

// per far funzionare il programma
// ngrok http 5001
// <ngrok-link>/telgrambot-e15a0/europe-west1/echoBot


export const echoBot = functions
	.region("europe-west1")
	.runWith({
		memory: "1GB",
		timeoutSeconds: 10,
	})
	.https.onRequest(async (request: any, response) => {
		functions.logger.log("Arrivato un messaggio");
		response.send(await bot.handleUpdate(request.body, response));
	});

export const salvaCookie = functions
	.region("europe-west1")
	.runWith({
		memory: "1GB",
		timeoutSeconds: 120,
	})
	.https.onRequest(async (request: any, response) => {
		await impostaCookie();
		response.send("salvato");
	});
