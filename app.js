// Basic Nodejs Modules
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// API Keys
const secrets = require('./secrets.json');

// API modules
const Twitter = require('twitter');
const twitter = new Twitter({
    consumer_key: secrets.consumer_key,
    consumer_secret: secrets.consumer_secret,
    access_token_key: secrets.access_token,
    access_token_secret: secrets.access_token_secret
});

const indexRouter = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// App states
const state = {trends:[], data: {}, raw: { labels:[], counts:[] }};

// Instance and utility modules
function createBaseGraphObject() {
    return {
        type: 'bar',
        data: {
            labels: [], // populate labels
            datasets: [{
                label: '# of Occurences',
                data: [], // populate data
                borderWidth: 1
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Distribution of words tweeted about topic'
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    };
}

const poller = require('./poller.js');
const analysis = require('./analysis.js');
poller.initialise(twitter, secrets);

// Poll for top 10 trends
doWork();
/*setInterval(function(){
    doWork(); // I need to not poll very often
}, 1000 * 1000);*/


function doWork() {
    poller.pollTrends(20, function(trends) {
        state.trends = trends;

        // Stream the top 10 trends
        poller.pollStream(trends, function (channel, tweetText) {
            // On each streamed tweet...

            // Check the channel, initialise if not exist
            if (state.data[channel] === undefined) {
                state.data[channel] = {};
                state.data[channel].tweets = [];
                state.data[channel].nounGraph = createBaseGraphObject();
                state.data[channel].verbGraph = createBaseGraphObject();

            }
            // Push the tweet onto the raw tweets
            state.data[channel].tweets.push(tweetText);

            // Perform analysis
            const nounsAnalysis = analysis.calculateOccurences(analysis.stripNouns(tweetText));
            const verbsAnalysis = analysis.calculateOccurences(analysis.stripVerbs(tweetText));
            combineCount(state.data[channel].nounGraph, nounsAnalysis);
            combineCount(state.data[channel].verbGraph, verbsAnalysis);
        });
    });
}

function combineCount(graph, instance) {
    if (instance === undefined || instance.labels === undefined || instance.data === undefined) {
        console.log(instance);
        return;
    }
    for(var x=0; x<instance.labels.length; x++) {
        // Find if the word already exists in the total graph
        const index = graph.data.labels.indexOf(instance.labels[x]);
        if (index !== -1) {
            // Already exists; add to the count
            graph.data.datasets[0].data[index] += instance.data[x];
            state.raw.counts[index] += instance.data[x];
        } else {
            // Does not exist, add to the graph data and label arrays
            graph.data.labels.push(instance.labels[x]);
            graph.data.datasets[0].data.push(instance.data[x]);
            state.raw.labels.push(instance.labels[x])
            state.raw.counts.push(instance.data[x]);
        }
    }
}

var times = 0;
setInterval(function(){
    times++;
    var _state = state;
    console.log(10 * times+" seconds in");
}, 10000);

function finaliseGraph(graphData) {
    analysis.sortGraph(graphData.data.labels, graphData.data.datasets[0].data);
    graphData.data.labels = graphData.data.labels.slice(0, 30);
    graphData.data.datasets[0].data = graphData.data.datasets[0].data.slice(0, 30);
}

// ---== Routing ==---

// Internal API setup

app.use('/api/trends', function(req,res,next) {
    try {
        console.log('Sending trends to client');

        // Trim off the trends that have no tweets
        const clientTrends = [];
        for (var x=0; x<state.trends.length; x++) {
            //if (state.raw.labels.indexOf(state.trends[x]) !== -1) {
            if (state.data[state.trends[x]] !== undefined) {
                clientTrends.push(state.trends[x]);
            }
        }
        res.send(clientTrends);
    } catch (error) {
        res.send(createError(400));
    }
});

app.use('/api/analysis', function(req,res,next) {
    try {
        console.log('client requests analysis of ' + req.query.id.toLowerCase());
        if (req.query.id !== undefined && state.data[req.query.id.toLowerCase()] !== undefined) {
            var element = state.data[req.query.id.toLowerCase()];
            element = JSON.parse(JSON.stringify(element));

            finaliseGraph(element.nounGraph);
            finaliseGraph(element.verbGraph);

            // Reorder the data

            res.send(element);
            console.log('client requests analysis of ' + req.query.id.toLowerCase());
        } else {
            console.log('No query matching ' + req.query.id.toLowerCase());
            res.send(state.data);
        }
    } catch (error) {
        res.send(createError(400));
    }
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
