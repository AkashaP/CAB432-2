// APIs
const Sentiment = require('sentiment');
const natural = require('natural');
const compromise = require('compromise');

// API instances
const sentiment = new Sentiment();
const wordTokenizer = new natural.WordTokenizer();
const analyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");

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

module.exports.stripNouns = function(text) {
    return wordTokenizer.tokenize(compromise(text).nouns().toSingular().out('text').replace(/[^\w\s]|_/g, "")
        .replace(/\s+/g, " ").toLowerCase());
}

module.exports.stripVerbs = function(text) {
    return wordTokenizer.tokenize(compromise(text).verbs().out('text').replace(/[^\w\s]|_/g, "")
        .replace(/\s+/g, " ").toLowerCase());
}