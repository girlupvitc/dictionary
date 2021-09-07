var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import cf from 'campfire.js';
import utils from './utils';
import { parse } from 'papaparse';
import { ImageGen } from './card';
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
function showMask(msg, onclick = (e) => { }) {
    const mask = document.querySelector("#mask");
    mask.style.display = 'flex';
    mask.innerHTML = msg;
    mask.onclick = onclick;
}
function hideMask() {
    const mask = document.querySelector("#mask");
    mask.style.display = 'none';
}
function showWordList(elt, maskContents = '') {
    elt.style.display = 'flex';
    elt.style.zIndex = '10000';
}
function hideWordList(elt) {
    elt.style.display = 'none';
    elt.style.zIndex = 'initial';
    hideMask();
}
function screenTooNarrow() {
    return matchMedia('(max-aspect-ratio: 1/1)').matches;
}
function fixCanvasSize(canvas) {
    if (screenTooNarrow()) {
        canvas.style.width = (window.innerWidth * 0.95) + 'px';
        canvas.style.height = canvas.style.width;
    }
    else {
        canvas.style.height = (window.innerWidth * 0.4) + 'px';
        canvas.style.width = canvas.style.height;
    }
}
window.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    let canvasInvisible = true;
    const wordList = document.querySelector("#words");
    const prompt = document.querySelector("#prompt");
    const canvas = document.querySelector('#defn-canvas');
    const currentDef = new cf.Store({});
    const mobileState = new cf.Store(true);
    mobileState.on("update", (isMobile) => {
        prompt.innerHTML = '';
        if (isMobile) {
            hideWordList(wordList);
            prompt.appendChild(cf.nu('div.button', {
                i: 'Pick a word',
                on: {
                    'click': (e) => {
                        showWordList(wordList);
                        showMask('', (e) => {
                            hideMask();
                            hideWordList(wordList);
                        });
                    }
                },
                s: { border: 'none' }
            }));
        }
        else {
            prompt.innerHTML = 'Pick a word on the left';
            showWordList(wordList);
        }
    });
    mobileState.update(screenTooNarrow());
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
    for (const word of parsed.data) {
        wordList === null || wordList === void 0 ? void 0 : wordList.appendChild(cf.nu("div.button", {
            innerHTML: word.Term,
            on: {
                'click': (e) => {
                    hideMask();
                    if (screenTooNarrow())
                        hideWordList(wordList);
                    currentDef.update(word);
                }
            }
        }));
    }
    hideMask();
    window.addEventListener('resize', (e) => {
        fixCanvasSize(canvas);
        mobileState.update(screenTooNarrow());
    });
    currentDef.on("update", (val) => {
        fixCanvasSize(canvas);
        if (canvasInvisible) {
            canvasInvisible = false;
            canvas.style.display = 'block';
        }
        new ImageGen(canvas, val).draw();
    });
    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        let str = params.get('define');
        for (const word of parsed.data) {
            console.log(word, str);
            if (word.Term === str) {
                currentDef.update(word);
                break;
            }
        }
    }
}));
