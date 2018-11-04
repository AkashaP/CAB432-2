/**
 * Analyzes Twitter data
 */


// APIs
const Sentiment = require('sentiment');
const natural = require('natural');
const compromise = require('compromise');

// API instances
const sentiment = new Sentiment();
const wordTokenizer = new natural.WordTokenizer();
const analyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");

/**
 * Calculates the unique occurences of words in an array
 */
module.exports.calculateOccurences = function(wordArray) {
    const result = { labels: [], data: [] };
    for (var k = wordArray.length - 1; k >= 0; k--) {
        const index = result.labels.indexOf(wordArray[k]);
        if (index !== -1) {
            result.data[index]++;
        } else {
            result.labels.push(wordArray[k]);
            result.data.push(1);
        }
    }
    return result;
}

/**
 * Strips a string so it only contains nouns
 */
module.exports.stripNouns = function(text) {
    return wordTokenizer.tokenize(compromise(text).nouns().toSingular().out('text').replace(/[^\w\s]|_/g, "")
        .replace(/\s+/g, " ").toLowerCase());
}

/**
 * Strips a string so it only contains verbs
 */
module.exports.stripVerbs = function(text) {
    return wordTokenizer.tokenize(compromise(text).verbs().out('text').replace(/[^\w\s]|_/g, "")
        .replace(/\s+/g, " ").toLowerCase());
}

/**
 * Sorts the graph so that it is ordered by count
 * @param labels the labels of the graph
 * @param data the counts of the graph
 */
module.exports.sortGraph = function(labels, data) {
    var list = [];
    for (var j = 0; j < labels.length; j++)
        list.push({'label': labels[j], 'data': data[j]});

    list.sort(function(a, b) {
        return (a.data < b.data);
    });

    for (var k = 0; k < list.length; k++) {
        labels[k] = list[k].label;
        data[k] = list[k].data;
    }
}