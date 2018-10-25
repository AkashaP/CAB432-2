// This file handles user input and sets up initial element states

/*
$.get("/api/stream", 
    function(obj){console.log( populateNouns(JSON.parse(obj)[0].nouns)
        
        )}) //for putting the first tweet into the noun vis
*/
// Settings
const animHideShowDuration = 800;

// JQuery object caches
const select = $("#select");
const trending = $("#trending");
const activeTag = $("#activetag");
const vocabVisualiserVerb = document.getElementById("vocabVisualiserVerb");
const vocabVisualiserNoun = document.getElementById("vocabVisualiserNoun");
const views = $(".view");
var streamInterval;
// Initialise element states

vocabVisualiserVerb.setAttribute("width", $(window).width());
vocabVisualiserVerb.setAttribute("height", $(window).height());
vocabVisualiserNoun.setAttribute("width", $(window).width());
vocabVisualiserNoun.setAttribute("height", $(window).height());
for (var i = 1; i < views.length; i++) {
    views[i].style.display = "none";
}

// DOM manipulation methods

//var trends = retrieveTrends();

// Initial populate trends
controlTrends();
function controlTrends() {
    retrieveTrends(function (trends) {
        /*retrieveTweets(function(data) {
                console.log(data);
                graphVocabVisualiserNoun(vocabVisualiserNoun, data.nouns);
                graphVocabVisualiserVerb(vocabVisualiserVerb, data.verbs);
            });*/

        populateTrends(trends);

    });
}

var trends;

function populateTrends(_trends) {
    trends = _trends;
    trending.empty();
    for (var x = 0; x < trends.length; x++) {
        
        // The card
        var card = $(document.createElement('div'));
        card.addClass('card');
        card.addClass('trendcard');
        
        // The card text
        var cardtext = $(document.createElement('div'));
        cardtext.addClass('card-text');
        
        // The link
        var linkElement = $(document.createElement('a'));
        linkElement.text(trends[x]);
        linkElement.attr("href", "javascript:navSubmitTag("+x+")")
        trending.append(linkElement);
        
        // Hierarchy structure
        cardtext.append(linkElement);
        card.append(cardtext);
        trending.append(card);
    }
}

/**
* Callback for when the user selects a hashtag to query
*/
function navSubmitTag(tagIndex) {
	activeTag.text(trends[tagIndex]);
	select.hide(animHideShowDuration);

	if (streamInterval !== undefined)
	    clearInterval(streamInterval);

    controlTweets(trends[tagIndex]);

    streamInterval = setInterval(function(){

        controlTweets(trends[tagIndex]);

    }, 1000);
}


function controlTweets(trend) {
    retrieveTweets(trend, function(callback) {
        var r = graphVocabVisualiserNoun(vocabVisualiserNoun, callback.nounGraph);
        r = graphVocabVisualiserVerb(vocabVisualiserVerb, callback.verbGraph) || r;
        if (!r) {
            console.log('no tweets for that');
        }
    });
}

/**
* Callback for when user wants to go back to hashtag selection
*/
function navTagSelection() {
	activeTag.text("Nothing Selected");
	select.show(animHideShowDuration);
}

function navView(viewIndex) {
    for (var i = 0; i < views.length; i++) {
        views[i].style.display = "none";
    }
    views[viewIndex].style.display = "";
    //TODO make graph not break when hiding it
    //Also make the graph generated relevant to the current view
}