// Basic Nodejs Modules
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const zlib = require('zlib');

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
            },
            animation: {
                duration: 0
            }
        }
    };
}

const poller = require('./poller.js');
const analysis = require('./analysis.js');
poller.initialise(twitter, secrets);

// Poll for top 10 trends
doWork();

if (process.argv.indexOf('-norepoll') !== -1)
    setInterval(function(){
        doWork(); // I need to not poll very often
        // I need to poll for trends, then close the streams of things i no longer need. Not necessary for demo.
    }, 1000 * 1000);


function doWork() {
    poller.pollTrends(25, function(trends) {
        state.trends = trends;

        // Put trends to lower case and remove hashtag, so that they resolve to state.data[] correctly
        for (var x=0; x<trends.length; x++) {
            if(trends[x].charAt(0) === '#')
            {
                trends[x] = trends[x].substr(1);
            }
            trends[x] = trends[x].toLowerCase();
        }

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
if (process.argv.indexOf('-notraffic') === -1){generateTraffic();}

function finaliseGraph(graphData) {
    analysis.sortGraph(graphData.data.labels, graphData.data.datasets[0].data);
    graphData.data.labels = graphData.data.labels.slice(0, 30);
    graphData.data.datasets[0].data = graphData.data.datasets[0].data.slice(0, 30);
}

var mem = "";
var cpu;
function generateTraffic() {
    for(var i=0; i<= 1e5; i++) { // about 40 mb
        mem += ('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n');
    }
    if (cpu !== undefined)
        clearInterval(cpu);
    cpu = setInterval(function(){

        console.log('Compressing 40 MB: ' + mem.length);
        // Compress 40 mb 20 times every 25 seconds
        for(var x=0; x<20; x++) {
            zlib.gzip(mem, function (error, result) {
                console.log('Compressed 40 MB');
            })
        }
        //zlib.inflate(zlib.deflate(new Buffer(mem, 'utf-8')))
    }, 25000);
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
            } else {
                console.log('no tweets for '+state.trends[x]);
            }
        }
        res.send(clientTrends);
    } catch (error) {
        res.send(createError(400));
    }
});

app.use('/api/rawtrends', function(req,res,next) {
    try {
        console.log('Sending raw trends to client');
        res.send(state.trends);
    } catch (error) {
        res.send(createError(400));
    }
});

app.use('/api/state', function(req,res,next) {
    try {
        console.log('Sending state to client');
        res.send(state);
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

app.use('/api/unhealthy', function(req,res,next) {
    if (process.argv.indexOf('-noscale') !== -1) {
        res.send(createError(403));
    }
    // else let it timeout, make server think it's unhealthy
});

app.use('/api/traffic', function(req,res,next) {
    generateTraffic();
});

app.use('/api/stoptraffic', function(req,res,next) {
    try {
        if (cpu !== undefined)
            clearInterval(cpu);
        res.send('success');
    } catch (e){ res.send('failure'); }
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
