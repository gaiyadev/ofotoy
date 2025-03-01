var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const config = require('config');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/api/users');
var photographersRouter = require('./routes/api/photographer');
var adminsRouter = require('./routes/api/admin');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/photographers', photographersRouter);
app.use('/api/admins', adminsRouter);

module.exports = app;
