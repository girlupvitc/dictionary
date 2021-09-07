import cf, { Store } from 'campfire.js';
import utils from './utils';
import { parse, ParseResult } from 'papaparse';
import { ImageGen } from './card';

interface Word {
    Term: string,
    Pronunciation: string,
    Definition: string,
    Type: string
}

const MASTER = "https://docs.google.com/spreadsheets/d/17uwwOGlFX1VLN-OtY6e_iYqz1-68DiRUgErO7O99hJ4/edit#gid=0";

async function getFileFromURL(url: string, sheetName: string) {
    let id = utils.getSheetID(url);
    let params = new URLSearchParams(); // magical API to generate the query string for us

    params.set("id", id);
    params.set("sheetName", sheetName);

    const URL_BASE = `https://googlesheets-proxy.herokuapp.com`;
    let getUrl = `${URL_BASE}/dl?${params.toString()}`; // loading through the proxy for CORS reasons

    return (await fetch(getUrl, {
        method: "GET",
    })).json();
}

function showMask(msg: string, onclick = (e: Event) => { }) {
    const mask: HTMLElement = document.querySelector("#mask")!;
    mask.style.display = 'flex';
    mask.innerHTML = msg;
    mask.onclick = onclick;
}

function hideMask() {
    const mask: HTMLElement = document.querySelector("#mask")!;
    mask.style.display = 'none';
}

function showWordList(elt: HTMLElement, maskContents = '') {
    elt.style.display = 'flex';
    elt.style.zIndex = '10000';
}

function hideWordList(elt: HTMLElement) {
    elt.style.display = 'none';
    elt.style.zIndex = 'initial';
    hideMask();
}

function screenTooNarrow() {
    return matchMedia('(max-aspect-ratio: 1/1)').matches;
}

function fixCanvasSize(canvas: HTMLElement) {
    if (screenTooNarrow()) {
        canvas.style.width = (window.innerWidth * 0.95) + 'px';
        canvas.style.height = canvas.style.width;
    }
    else {
        canvas.style.height = (window.innerWidth * 0.4) + 'px';
        canvas.style.width = canvas.style.height;
    }
}

window.addEventListener('DOMContentLoaded', async () => {

    let data: Record<string, unknown> = {};
    let canvasInvisible = true;

    const wordList: HTMLElement = document.querySelector("#words")!;

    const prompt: HTMLElement = document.querySelector("#prompt")!;
    const canvas: HTMLElement = document.querySelector('#defn-canvas')!;

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
                s: {border: 'none'}
            }))
        }
        else {
            prompt.innerHTML = 'Pick a word on the left';
            showWordList(wordList);
        }
    });

    mobileState.update(screenTooNarrow());

    try {
        data = await getFileFromURL(MASTER, "");
    }
    catch (e) {
        console.log(`error loading data: ${e}`);
    }
    const parsed: ParseResult<Word> = parse(data.text as string, utils.PAPA_OPTIONS);

    if (!parsed.data) {
        console.log('error parsing received data.');
    }

    for (const word of parsed.data) {
        wordList?.appendChild(
            cf.nu("div.button", {
                innerHTML: word.Term,
                on: {
                    'click': (e) => {
                        hideMask();
                        if (screenTooNarrow()) hideWordList(wordList);
                        currentDef.update(word);
                    }
                }
            }
            ));
    }

    hideMask();

    window.addEventListener('resize', (e) => {
        fixCanvasSize(canvas);
        mobileState.update(screenTooNarrow());

    })

    currentDef.on("update", (val) => {
        fixCanvasSize(canvas);
        if (canvasInvisible) {
            canvasInvisible = false;
            canvas!.style.display = 'block';
        }
        new ImageGen(canvas, val).draw();
    });
})