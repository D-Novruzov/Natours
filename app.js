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
const bookingRouter = require('./routes/bookingRoutes');
const compression = require('compression');
const viewRouter = require('./routes/viewRoutes');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorControllers');
//using the middleware.
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//1) GLOBAL MIDDLEWARES
app.use(express.static(path.join(__dirname, 'public')));
//set security http heaaders
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://js.stripe.com',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

//set security http headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'blob:'],
      scriptSrc: [
        "'self'",
        'https://js.stripe.com',
        'https://unpkg.com',
        "'unsafe-inline'",
        "'unsafe-eval'",
      ],
      styleSrc: ["'self'", 'https://unpkg.com', "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      connectSrc: ["'self'", 'https://api.stripe.com', 'https://*.stripe.com'],
      objectSrc: ["'none'"],
    },
  }),
);

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
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
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
app.use(compression());
//3) ROUTES

//mounting, middleware on specific url
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

//4) hanfling the undefined routes.
app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);
//4) start the server
module.exports = app;
