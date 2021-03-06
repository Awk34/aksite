/**
 * Main application routes
 */

import {errors} from './components/errors';
import path from 'path';

export default function(app) {
    // Insert routes below
    app.use('/api/gallery', require('./api/gallery'));
    app.use('/api/files', require('./api/file'));
    app.use('/api/upload', require('./api/upload'));
    app.use('/api/projects', require('./api/project'));
    app.use('/api/posts', require('./api/post'));
    app.use('/api/photos', require('./api/photo'));
    app.use('/api/things', require('./api/thing'));
    app.use('/api/users', require('./api/user').default);

    app.use('/auth', require('./auth'));

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|assets)/*')
        .get(errors.get(404));

    const appPath = app.get('appPath');

    // All other routes should redirect to the index.html
    app.route('/')
        .get(function(req, res) {
            res.sendFile(path.resolve(`${appPath}/index.html`));
        });
}
