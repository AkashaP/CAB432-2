// Handles server interaction and transformation/caching of data

// Caches
var trends;
var tweets;

// API routes
const trendsRoute = "/api/trends";
const tweetsRoute = "/api/analysis";
const schedules = [];

/**
* Get the trending tags
*/
function retrieveTrends(callback) {
	$.get(trendsRoute, function(data) {
		trends = data;
		if (callback !== null && callback !== undefined) {
			callback(data);
		}
	});
}

function retrieveTweets(topic, callback) {
	
	$.get(tweetsRoute, {id:topic.toLowerCase()}, function(data) {
		tweets = data;
		if (callback !== null && callback !== undefined) {
			callback(data);
		}
	});
}