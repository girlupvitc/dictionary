window.onload = init;

const HANDLE = "@girlupvitc"; // Instagram handle to print
const INTERNAL_DIMENSIONS = { // dimensions of the internal canvas, controls
    x: 1080,
    y: 1080
}

// find the longest line in an array of strings
let longest = (lines) => lines.reduce((a, b) => a.length > b.length ? a : b)

class ImageGen {
    static BACKGROUND = '#e9c7d8'; // colors taken from reference post
    static BG_COLORS = ["#e9c7d8", "rebeccapurple", "#007cdf"];
    static TEXT_COLOR = '#454545';
    static RECT_COLOR = '#ffffff';
    static HANDLE_COLOR = 'c983a8';

    static WORD_FONT = "Source Serif Pro";
    static TEXT_FONT = "Montserrat";

    static LEFT_CARD_MARGIN = 180; // picked to resemble existing posts.
    static SIDEBAR_WIDTH = 5;

    constructor(canvas, word, bgcolor) {
        this.fontSize = 80; // this is the default text size in px. Modified by setFont
        this.canvas = canvas; // pass in a canvas, to allow flexibility - either draw offscreen
        // or directly onto the DOM
        this.ctx = this.canvas.getContext('2d');
        let cStyle = window.getComputedStyle(this.canvas);
        this.canvas.width = INTERNAL_DIMENSIONS.x;
        this.canvas.height = INTERNAL_DIMENSIONS.y;
        this.word = word.Word;
        this.pronunciation = word.Pronunciation;
        this.definition = word.Definition;
        this.type = word.Type;
        this.bgcolor = bgcolor;
    }

    setFont(face, style, weight, size) {
        this.fontSize = size;
        let str = ``
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
    getLines(text, maxWidth) { // text wrapping function
        // TODO: implement newlines
        let words = text.split(" ");
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let width = this.ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    drawCard() { // draw the background card
        const BGCOLOR = this.bgcolor || ImageGen.BG_COLORS[Math.floor(Math.random() * ImageGen.BG_COLORS.length)];
        this.ctx.fillStyle = BGCOLOR; // background color
        this.ctx.fillRect(0, 0, INTERNAL_DIMENSIONS.x, INTERNAL_DIMENSIONS.y); // fill the canvas or it remains transparent
        this.ctx.fillStyle = ImageGen.RECT_COLOR; // set the card color
        this.ctx.fillRect(108, 242, 864, 596); // card dimensions were obtained from Design
    }

    maximizeFontSize(str, start, target, fontSettings, step) { // set the font size to the maximum it can be
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
        this.maximizeFontSize(this.word, wordSize, 830, {face: "Source Serif Pro", style: "", weight: ""}, 17);
        this.ctx.fillText(this.word.toLowerCase(),
            ImageGen.LEFT_CARD_MARGIN, // the text's margin on the card
            360, // just looks nice.
            INTERNAL_DIMENSIONS.x - ImageGen.LEFT_CARD_MARGIN
            // max width. Canvas API does some ugly scaling so we need the maximizeFontSize call to
            // reduce the size of the text also.
        );
    }
    
    drawType() {
        this.ctx.fillStyle = ImageGen.TEXT_COLOR;
        this.setFont(ImageGen.TEXT_FONT, 'italic', '', 30);
        this.ctx.fillText(this.type + ".",
            ImageGen.LEFT_CARD_MARGIN,
            430,
            INTERNAL_DIMENSIONS.x - ImageGen.LEFT_CARD_MARGIN
        );
    }

    drawPronunciation() {
        this.setFont(ImageGen.TEXT_FONT, '', '300', 30);
        this.ctx.fillText(`[ ${this.pronunciation} ]`, // draw pronunciation with square brackets
            ImageGen.LEFT_CARD_MARGIN,
            480,
            INTERNAL_DIMENSIONS.x
        );
    }

    drawText() {
        let lines = this.getLines(this.definition, 690);
        let x = 225; // picked to resemble.
        let y = 550; // looks nice.
        let lineSpacing = 15;
        this.maximizeFontSize(longest(lines), 30, 850, { face: ImageGen.TEXT_FONT, style: "", weight: "" }, 2);
        let sideBarLength = (this.fontSize + lineSpacing) * lines.length; // length of the little bar on the side
        this.ctx.fillStyle = '#d8d8d8';
        this.ctx.fillRect(ImageGen.LEFT_CARD_MARGIN,
            y - this.fontSize,
            ImageGen.SIDEBAR_WIDTH,
            sideBarLength
        ); // draw sidebar
        this.ctx.fillStyle = "#454545";
        for (let line of lines) {
            this.ctx.fillText(line,
                x,
                y,
                1080,
            );
            y += (this.fontSize + lineSpacing);
        }
    }

    drawHandle() {
        this.setFont(ImageGen.TEXT_FONT, '', '400', 22);
        this.ctx.fillStyle = ImageGen.HANDLE_COLOR;
        this.ctx.fillText(`${HANDLE.toUpperCase()}`, // uppercase the handle, it isn't case sensitive and looks
                                                     // nicer that way anyway
            130,
            875,
            INTERNAL_DIMENSIONS.x
        );
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

export {
    ImageGen 
};