var createError = require('http-errors');
var express = require('express');

require('dotenv').config()
var path = require('path');
var cookieParser = require('cookie-parser');
// var logger = require('morgan');
var hbs = require('express-handlebars')
var fileupload = require('express-fileupload')
var db = require('./config/connection')
var collection = require('./config/collection')
var session = require('express-session')
// const Handlebars = require('handlebars');



var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
// const { accountSid, authToken } = require('./config/collection');
// const client = require('twilio')(accountSid,authToken)
const paypal = require('paypal-rest-sdk')
// var helpers = require('handlebars-helpers')();

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.client_id,
  'client_secret': process.env.client_secret
});


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({
  extname:'hbs',defaultLayout:'layout',
  layoutsDir:__dirname+'/views/layout/',
  partialsDir:__dirname+'/views/partials/',
  // helpers:{
  //   eq:(state,value,options)=>{
  //     if(state==value){
  //       return options.fn(this)
  //     }
  //     return  options.inverse(this);
  //   }
  // }
}))


// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileupload())
app.use(session({secret:'key',cookie:{maxAge:6000000}}));

// Handlebars.registerHelper('eq',function(state, value, options)
// {
//   return (state == value) ? options.fn(this) : options.inverse(this);
// })


db.connect((err)=>{
  if(err)
  console.log("database not connected due to error "+err)
  else
  console.log("database connected")
})
app.use(function(req, res, next) { 
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
   next();
 });

app.use('/admin', adminRouter);
app.use('/', userRouter);


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
