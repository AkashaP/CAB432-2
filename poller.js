var twitter;
var twitterStreamChannels;
var TwitterStreamChannels = require('twitter-stream-channels');
var twitterStreamChannels;

module.exports.initialise = function(_twitter, secrets) {
    twitter = _twitter;
    twitterStreamChannels = new TwitterStreamChannels(secrets);
}

module.exports.pollTrends = function (amount, callback) {
    twitter.get('trends/place', {id: '23424748'}, function(error, _trends, response) {
        console.log(_trends);
        const result = [];
        for (var x=0; x<_trends[0].trends.length && x < amount; x++) {
            result.push(_trends[0].trends[x].query);
        }

        if (callback !== null && callback !== undefined && _trends !== null  && _trends[0].trends !== undefined && _trends !== undefined && _trends != "") {
            callback(result);
        } else {
            console.log("error, this is not right: "+_trends);
        }
    });
}

module.exports.pollStream = function(channels, callback) {
    const trackNames = channels.join(", ");
    console.log("Streaming for: "+trackNames);
    const stream = twitterStreamChannels.streamChannels({track:channels});

    stream.on('channels',function(tweet){
        if (tweet['$channels'] === undefined || tweet['$channels'].default === undefined || tweet['$channels'].default[0] === undefined) {
            // Filter out random tweets that don't appear to have a channel
            //console.log('no channel '+JSON.stringify(tweet));
            return;
        }
        const channel = tweet['$channels'].default[0];
        console.log(channel);
        callback(channel, tweet.text);
    });

}