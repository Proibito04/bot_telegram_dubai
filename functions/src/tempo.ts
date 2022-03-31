import * as moment from "moment";
import {Moment} from "moment/moment";
moment.locale('it');

function ottieniGiornoOggi(): moment.Moment{
    return moment()
}

export function controllaStessoGiorno(giorno: Moment): boolean{
    return ottieniGiornoOggi().isSame(giorno, 'day');
}
