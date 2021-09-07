function getSheetID(url) {
    return url.split("/")[5];
}
const PAPA_OPTIONS = {
    header: true,
    delimiter: ',',
    newline: '\n',
    quoteChar: '"',
    skipEmptyLines: false,
};
class Performance {
    constructor(name) {
        this.name = "";
        this.startTime = 0;
        this.startTime = performance.now();
        this.name = name;
    }
    getElapsed() {
        return performance.now() - this.startTime;
    }
    log() {
        let name = this.name;
        let task = ((str) => {
            return str ? `Task '${str}'` : `Task`;
        })(name);
        console.log(`${task} took ${this.getElapsed()}ms to complete`);
    }
    ;
}
export default {
    getSheetID, Performance, PAPA_OPTIONS
};
