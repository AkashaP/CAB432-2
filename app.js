// Basic Nodejs Modules
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// API modules
const Twitter = require('twitter');
const TwitterStreamChannels = require('twitter-stream-channels');

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

// Instance and utility modules


// ---== Routing ==---

// Internal API setup

app.use('/api/trends', function(req,res,next) {
    console.log('Sending trends to client');
    res.send(trends);
});

app.use('/api/analysis', function(req,res,next) {
    console.log('client requests analysis of '+req.params);
    if (req.params !== undefined && analysis[req.params.query] !== undefined) {
        res.send(analysis[req.params.query]);
        console.log('client requests analysis of '+req.params);
    } else {
        console.log('No query matching '+req.params);
        res.send(analysis);
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
