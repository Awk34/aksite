/**
 * Main application file
 */

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development'; // eslint-disable-line no-process-env

import express from 'express';
import mongoose from 'mongoose';
import config from './config/environment';
import Grid from 'gridfs-stream';
import raven from 'raven';
import http from 'http';
import {initWebSocketServer} from './config/websockets';
import expressConfig from './config/express';
import registerRoutes from './routes';
import { seed } from './config/seed';
import {mongooseConnectionPromise} from './mongoose.connection';

if(config.sentry.dsn) {
    raven.config(config.sentry.dsn).install();
}

// Connect to database
// export const mongooseConnectionPromise = mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', err => {
    console.error(`MongoDB connection error: ${err}`);
    process.exit(-1); // eslint-disable-line no-process-exit
});

// Setup server
const app = express();
expressConfig(app);
registerRoutes(app);
export const server = http.createServer(app);
const wsInitPromise = initWebSocketServer(server);

// Start server
function startServer() {
    console.log(config.ip);
    server.listen(config.port, config.ip, () => {
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });
}

Promise.all([wsInitPromise, mongooseConnectionPromise])
    .then(() => {
        Grid.mongo = mongoose.mongo;
        // Populate DB with sample data
        if(config.seedDB) {
            // wait for DB seed
            return seed()
                .then(() => {
                    startServer();
                });
        } else {
            return startServer();
        }
    })
    .catch(err => {
        console.log('Server failed to start due to error:', err);
    });

// Expose app
export default app;
