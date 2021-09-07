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

window.addEventListener('DOMContentLoaded', async () => {
    let data: Record<string, unknown> = {};
    let canvasInvisible = true;

    const wordList = document.querySelector("#words");
    const definitionPane = document.querySelector("#definition-pane");
    const prompt: HTMLElement | null = document.querySelector("#prompt");
    const currentDef = new cf.Store({});
    Object.defineProperty(window, 'currentDef', currentDef);
    
    try {
        data = await getFileFromURL(MASTER, "");
    }
    catch (e) {
        console.log(`error loading data: ${e}`);
    }
    const parsed:ParseResult<Word> = parse(data.text as string, utils.PAPA_OPTIONS);
    
    if (!parsed.data) {
        console.log('error parsing received data.');
    }

    for (const word of parsed.data) {
        wordList?.appendChild(
            cf.nu("div.word", {
                innerHTML: word.Term,
                on: {
                    'click': (e) => {
                        currentDef.update(word);
                    }
                }
            }
        ));
    }
    
    const canvas: HTMLElement | null = document.querySelector('#defn-canvas');

    window.addEventListener('resize', (e) => {
        canvas!.style.height = canvas?.getBoundingClientRect().width + 'px';
    })

    currentDef.on("update", (val) => {
        if (canvasInvisible) {
            canvasInvisible = false;
            canvas!.style.display = 'block';
            canvas!.style.height = canvas?.getBoundingClientRect().width + 'px';

            prompt!.style.display = 'none';
        }
        canvas!.style.height = canvas?.getBoundingClientRect().width + 'px';
        new ImageGen(canvas, val).draw();
    });
})