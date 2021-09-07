window.onload = init;
const HANDLE = "@girlupvitc"; // Instagram handle to print
const INTERNAL_DIMENSIONS = {
    x: 1080,
    y: 1080
};
const GRADIENT = ["#EAC6D9", "#E3B7CD", "#DBA9C1", "#D49AB4", "#CC8BA8", "#C6E2Ea", "#b7dce4", "#a7d7de", "#98d1d7", "#88cbd1", "#E2c6ea", "#Deb7df", "#daa7d5", "#d598ca", "#d188bf"];
// const GRADIENT = ["#EAC6D9", "#E3B7CD", "#DBA9C1", "#D49AB4", "#CC8BA8"]
let gradientIdx = 0;
let longest = function (lines) {
    lines.reduce(function (a, b) {
        return a.length > b.length ? a : b;
    });
};
Array.prototype.remove = function (itm) {
    let idx = this.indexOf(itm);
    if (idx >= 0)
        this.splice(idx, 1);
};
class AssetManager {
    constructor(callback) {
        this.queue = [];
        this.successCount = 0;
        this.results = {};
        this.callback = callback;
    }
    loadAll() {
        let that = this;
        that.numFiles = that.queue.length;
        for (let x of this.queue) {
            fetch(x.url, { method: 'GET' }).then((res) => {
                if (res.ok) {
                    if (x.type === 'img') {
                        res.blob().then((result) => {
                            createImageBitmap(result).then((imgBitmap) => {
                                that.results[x.name] = imgBitmap;
                            });
                        }).then(function () {
                            that.successCount++;
                            if (that.isDone()) {
                                that.callback();
                            }
                        });
                    }
                    else {
                        res.text().then((result) => {
                            that.results[x.name] = result;
                        }).then(function () {
                            that.successCount++;
                            if (that.isDone()) {
                                that.callback();
                            }
                        });
                    }
                }
                that.queue.remove(x);
            });
        }
    }
    queueItems(arr) {
        for (let x of arr) {
            if (!this.queue.includes(x))
                this.queue.push(x);
        }
    }
    isDone() {
        return (this.numFiles == this.successCount);
    }
    getAsset(name) {
        return this.results[name];
    }
}
class FileInfo {
    constructor(name, url, type) {
        this.name = name;
        this.url = url;
        this.type = type;
    }
}
class ImageGen {
    constructor(canvas, word, type, pronunciation, definition, bgcolor) {
        this.fontSize = 80; // this is the default text size in px. Modified by setFont
        this.canvas = canvas; // pass in a canvas, to allow flexibility - either draw offscreen
        // or directly onto the DOM
        this.ctx = this.canvas.getContext('2d');
        let cStyle = window.getComputedStyle(this.canvas);
        this.canvas.width = INTERNAL_DIMENSIONS.x;
        this.canvas.height = INTERNAL_DIMENSIONS.y;
        this.word = word;
        this.pronunciation = pronunciation;
        this.definition = definition;
        this.type = type;
        this.bgcolor = bgcolor;
    }
    setFont(face, style, weight, size) {
        this.fontSize = size;
        let str = ``;
        if (style) {
            str += `${style} `;
        }
        if (weight) {
            str += `${weight} `;
        }
        str += `${size}px ${face}`;
        this.ctx.font = str;
    }
    // https://stackoverflow.com/a/16599668
    getLines(text, maxWidth) {
        // TODO: implement newlines
        let words = text.split(" ");
        let lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let width = this.ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            }
            else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }
    drawCard() {
        // const BGCOLOR = ImageGen.BG_COLORS[Math.floor(Math.random() * ImageGen.BG_COLORS.length)];
        const BGCOLOR = this.bgcolor || ImageGen.BG_COLORS[Math.floor(Math.random() * ImageGen.BG_COLORS.length)];
        this.ctx.fillStyle = BGCOLOR; // background color
        this.ctx.fillRect(0, 0, INTERNAL_DIMENSIONS.x, INTERNAL_DIMENSIONS.y); // fill the canvas or it remains transparent
        this.ctx.fillStyle = ImageGen.RECT_COLOR; // set the card color
        this.ctx.fillRect(108, 242, 864, 596); // card dimensions were obtained from Design
    }
    maximizeFontSize(str, start, target, fontSettings, step) {
        // without clipping the target x
        let wordSize = start;
        this.setFont(fontSettings.face, fontSettings.style, fontSettings.weight, wordSize);
        while (this.ctx.measureText(str).width > target) { // 830
            wordSize -= step;
            this.setFont(fontSettings.face, '', '', wordSize);
        }
    }
    drawWord() {
        this.ctx.fillStyle = ImageGen.TEXT_COLOR;
        let wordSize = 80;
        this.setFont(ImageGen.WORD_FONT, '', '', wordSize);
        this.maximizeFontSize(this.word, wordSize, 830, { face: "Source Serif Pro", style: "", weight: "" }, 17);
        this.ctx.fillText(this.word.toLowerCase(), ImageGen.LEFT_CARD_MARGIN, // the text's margin on the card
        360, // just looks nice.
        INTERNAL_DIMENSIONS.x - ImageGen.LEFT_CARD_MARGIN
        // max width. Canvas API does some ugly scaling so we need the maximizeFontSize call to
        // reduce the size of the text also.
        );
    }
    drawType() {
        this.ctx.fillStyle = ImageGen.TEXT_COLOR;
        this.setFont(ImageGen.TEXT_FONT, 'italic', '', 30);
        this.ctx.fillText(this.type + ".", ImageGen.LEFT_CARD_MARGIN, 430, INTERNAL_DIMENSIONS.x - ImageGen.LEFT_CARD_MARGIN);
    }
    drawPronunciation() {
        this.setFont(ImageGen.TEXT_FONT, '', '300', 30);
        this.ctx.fillText(`[ ${this.pronunciation} ]`, // draw pronunciation with square brackets
        ImageGen.LEFT_CARD_MARGIN, 480, INTERNAL_DIMENSIONS.x);
    }
    drawText() {
        let lines = this.getLines(this.definition, 690);
        let x = 225; // picked to resemble.
        let y = 550; // looks nice.
        let lineSpacing = 15;
        this.maximizeFontSize(longest(lines), 30, 850, { face: ImageGen.TEXT_FONT, style: "", weight: "" }, 2);
        let sideBarLength = (this.fontSize + lineSpacing) * lines.length; // length of the little bar on the side
        this.ctx.fillStyle = '#d8d8d8';
        this.ctx.fillRect(ImageGen.LEFT_CARD_MARGIN, y - this.fontSize, ImageGen.SIDEBAR_WIDTH, sideBarLength); // draw sidebar
        this.ctx.fillStyle = "#454545";
        for (let line of lines) {
            this.ctx.fillText(line, x, y, 1080);
            y += (this.fontSize + lineSpacing);
        }
    }
    drawHandle() {
        this.setFont(ImageGen.TEXT_FONT, '', '400', 22);
        this.ctx.fillStyle = ImageGen.HANDLE_COLOR;
        this.ctx.fillText(`${HANDLE.toUpperCase()}`, // uppercase the handle, it isn't case sensitive and looks
        // nicer that way anyway
        130, 875, INTERNAL_DIMENSIONS.x);
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCard();
        this.drawWord();
        this.drawType();
        this.drawPronunciation();
        this.drawText();
        this.drawHandle();
    }
}
ImageGen.BACKGROUND = '#e9c7d8'; // colors taken from reference post
ImageGen.BG_COLORS = ["#e9c7d8", "rebeccapurple", "#007cdf"];
ImageGen.TEXT_COLOR = '#454545';
ImageGen.RECT_COLOR = '#ffffff';
ImageGen.HANDLE_COLOR = 'c983a8';
ImageGen.WORD_FONT = "Source Serif Pro";
ImageGen.TEXT_FONT = "Montserrat";
ImageGen.LEFT_CARD_MARGIN = 180; // picked to resemble existing posts.
ImageGen.SIDEBAR_WIDTH = 5;
function init() {
    let assets = new AssetManager(function () {
        let content = assets.getAsset("know_your_terms_pipe.csv");
        let lines = content.split("\n");
        let generators = [];
        let zip = new JSZip();
        for (let x of lines) {
            let parts = x.split("|");
            let c = document.createElement("canvas");
            let wd = document.createElement('h3');
            wd.innerHTML = parts[1];
            document.body.appendChild(wd);
            c.classList.add("dict-canvas");
            document.body.appendChild(c);
            c.onclick = function () {
                let tmp = document.createElement('a');
                tmp.href = c.toDataURL();
                tmp.download = parts[1] + ".png";
                document.body.appendChild(tmp);
                tmp.click();
                document.body.removeChild(tmp);
            };
            let gen = new ImageGen(c, parts[1], parts[2], parts[3], parts[4], GRADIENT[(gradientIdx++) % GRADIENT.length]);
            gen.draw();
            zip.file(`${parts[1]}.png`, c.toDataURL().split(",")[1], { base64: true });
        }
        let downloadBtn = document.createElement("button");
        downloadBtn.innerHTML = "Download all";
        downloadBtn.onclick = function () {
            zip.generateAsync({ type: "base64" }).then(function (content) {
                location.href = "data:application/zip;base64," + content;
            });
        };
        document.body.prepend(downloadBtn);
    });
    assets.queueItems([
        new FileInfo("know_your_terms_pipe.csv", "know_your_terms_pipe.csv", "text")
    ]);
    assets.loadAll();
}
