// Handles interaction with Chart.js

var nounChartInstance = null,
verbChartInstance = null;

function transformData(data) {
    console.log(data);
}

function graphVocabVisualiserNoun(canvas, _data) { 
    if (nounChartInstance === null)
     nounChartInstance = new Chart(canvas.getContext('2d'), _data);
    else {nounChartInstance.data = _data;
    nounChartInstance.update();}
    return nounChartInstance;
}

function graphVocabVisualiserVerb(canvas, _data) { 
    if (verbChartInstance === null)
     verbChartInstance = new Chart(canvas.getContext('2d'), _data);
    else {verbChartInstance.data = _data;
    verbChartInstance.update();}
    return verbChartInstance;
}