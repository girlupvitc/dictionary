var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import utils from './utils';
import { parse } from 'papaparse';
const MASTER = "https://docs.google.com/spreadsheets/d/17uwwOGlFX1VLN-OtY6e_iYqz1-68DiRUgErO7O99hJ4/edit#gid=0";
function getFileFromURL(url, sheetName) {
    return __awaiter(this, void 0, void 0, function* () {
        let id = utils.getSheetID(url);
        let params = new URLSearchParams(); // magical API to generate the query string for us
        params.set("id", id);
        params.set("sheetName", sheetName);
        const URL_BASE = `https://googlesheets-proxy.herokuapp.com`;
        let getUrl = `${URL_BASE}/dl?${params.toString()}`; // loading through the proxy for CORS reasons
        return (yield fetch(getUrl, {
            method: "GET",
        })).json();
    });
}
window.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    try {
        data = yield getFileFromURL(MASTER, "");
    }
    catch (e) {
        console.log(`error loading data: ${e}`);
    }
    const parsed = parse(data.text, utils.PAPA_OPTIONS);
    if (!parsed.data) {
        console.log('error parsing received data.');
    }
    console.log(parsed.data);
}));
