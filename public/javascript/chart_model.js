// Handles interaction with Chart.js

var nounChartInstance = null,
verbChartInstance = null;

function transformData(data) {
    console.log(data);
}

function graphVocabVisualiserNoun(canvas, _data) {
    if (_data == undefined || _data.data === undefined) return false;
    if (nounChartInstance === null)
        nounChartInstance = new Chart(canvas.getContext('2d'), _data);
    else {
        nounChartInstance.data = _data.data;
        nounChartInstance.update();
    }
    return true;
}

function graphVocabVisualiserVerb(canvas, _data) {
    if (_data == undefined || _data.data === undefined) return false;
    if (verbChartInstance === null)
        verbChartInstance = new Chart(canvas.getContext('2d'), _data);
    else {
        verbChartInstance.data = _data.data;
        verbChartInstance.update();
    }
    return true;
}