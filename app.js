const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorControllers');
//using the middleware.
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//1) GLOBAL MIDDLEWARES
app.use(express.static(path.join(__dirname, 'public')));
//set security http heaeders
app.use(helmet());
//development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many request from this IP, please try again in an hour',
});
//limit requests from save IP
app.use('/api', limiter);
//body parser, reading data fromthe body into req.body
app.use(express.json({ limit: '10kb' }));
//data sanitization agains NoSQL query injection
app.use(mongoSanitize());
//data sanitization against XSS
app.use(xss());
//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
//serving static files
//app.use(express.static(`${__dirname}/public`));

//3) ROUTES

//mounting, middleware on specific url
app.get('/', (req, res) => {
  res.status(200).render('base', { tour: 'The Forest Tiger', user: 'Jonas' });
});
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
//4) hanfling the undefined routes.
app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);
//4) start the server
module.exports = app;
