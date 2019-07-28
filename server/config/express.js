/**
 * Express configuration
 */

import express from 'express';
import favicon from 'serve-favicon';
import morgan from 'morgan';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import path from 'path';
import lusca from 'lusca';
import config from './environment';
import passport from 'passport';
import session from 'express-session';
import mongoose from 'mongoose';
import connectMongo from 'connect-mongo';
import raven from 'raven';
const MongoStore = connectMongo(session);
raven.config(config.sentry.dsn).install();

export default function(app) {
    var env = app.get('env');

    app.use(raven.requestHandler());
    app.set('views', `${config.root}/server/views`);
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.set('appPath', path.join(config.root, 'client'));
    app.use(compression());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(cookieParser());
    app.use(passport.initialize());

    // Persist sessions with mongoStore
    // We need to enable sessions for Lusca
    app.use(session({
        secret: config.secrets.session,
        resave: true,
        saveUninitialized: true,
        store: new MongoStore({
            mongooseConnection: mongoose.connection,
            db: 'aksite'
        })
    }));

    /**
     * Lusca - express server security
     * https://github.com/krakenjs/lusca
     */
    app.use(lusca({
        csrf: {
            angular: true
        },
        xframe: 'SAMEORIGIN',
        hsts: {
            maxAge: 31536000, //1 year, in seconds
            includeSubDomains: true,
            preload: true
        },
        xssProtection: true
    }));

    if(env === 'production') {
        app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
        app.use(express.static(path.join(config.root, 'client')));
        app.set('appPath', `${config.root}/client`);
        app.use(morgan('combined'));
        app.use(raven.errorHandler());
    }

    if(env === 'development' || env === 'test') {
        app.use(express.static(path.join(config.root, '.tmp')));
        app.use(express.static(app.get('appPath')));
        app.use(morgan('dev'));
        app.use(errorHandler()); // Error handler - has to be last
    }
}
