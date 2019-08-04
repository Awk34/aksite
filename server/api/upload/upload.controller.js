import _ from 'lodash';
import {
    handleError,
    createThumbnail,
    deleteFile,
    isValidObjectId
} from '../../util';
import {Photo} from '../photo/photo.model';
import {Gallery} from '../gallery/gallery.model';
import Project from '../project/project.model';
import User from '../user/user.model';
import config from '../../config/environment';
import gridform from 'gridform';
import {ExifImage} from 'exif';
import gm from 'gm';
import {default as mongoose, model, Schema} from 'mongoose';
import Grid from 'gridfs-stream';

let gridSchema = new Schema({}, {strict: false});
let gridModel = model('gridModel', gridSchema, 'fs.files');
let gfs;
let conn = mongoose.createConnection(config.mongo.uri);

gridform.mongo = mongoose.mongo;
Grid.mongo = mongoose.mongo;

conn.once('open', function(err) {
    if(err) return handleError(err);

    gfs = new Grid(conn.db);
    gridform.db = conn.db;
});

const DEFAULT_PAGESIZE = 10;
const MIN_PAGESIZE = 5;
const MAX_PAGESIZE = 25;

// Get list of files
export function index(req, res) {
    if(req.query.page && req.query.page < 1) return res.status(400).send('Invalid page');

    var pageSize = (req.query.pagesize && req.query.pagesize <= MAX_PAGESIZE && req.query.pagesize > MIN_PAGESIZE) ? req.query.pagesize : DEFAULT_PAGESIZE;
    var page = parseInt(req.query.page, 10) || 0;

    gridModel.count({}, function(err, count) {
        if(err) return handleError(res, err);

        gridModel.find()
            .limit(pageSize)
            .sort('date')
            .skip((req.query.page - 1) * pageSize || 0)//doesn't scale well, I'll worry about it later
            .exec(function(err, files) {
                if(err) return handleError(res, err);

                return res.status(200).json({
                    page,
                    pages: Math.ceil(count / pageSize),
                    items: files,
                    numItems: count
                });
            });
    });
}

// Get a single file
export function show(req, res) {
    if(req.params.id.substring(24) === '.jpg') {
        req.params.id = req.params.id.substring(0, 24);
    }
    if(!isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid ID');
    }
    gfs.exist({_id: req.params.id}, function(err, found) {
        if(err) return handleError(err);
        else if(!found) return res.status(404).end();
        else {
            res.header('Content-Type', 'image/jpeg');
            gfs.createReadStream({ _id: req.params.id })
                .on('error', _.partial(handleError, res))
                .pipe(res);
        }
    });
}

// Get the number of uploads
export function count(req, res) {
    gridModel.count({}, function(err, count) {
        if(err) handleError(res, err);
        else res.status(200).json(count);
    });
}

// Creates a new file in the DB.
export function create(req, res) {
    var form = gridform({db: conn.db, mongo: mongoose.mongo});

    // optionally store per-file metadata
    form.on('fileBegin', function(name, file) {
        file.metadata = {};
    });

    form.parse(req, function(err, fields, files) {
        if(err) return handleError(res, err);

        /**
         * file.name            - the uploaded file name
         * file.type            - file type per [mime](https://github.com/bentomas/node-mime)
         * file.size            - uploaded file size (file length in GridFS) named "size" for compatibility
         * file.path            - same as file.name. included for compatibility
         * file.lastModified    - included for compatibility
         * file.root            - the root of the files collection used in MongoDB ('fs' here means the full collection in mongo is named 'fs.files')
         * file.id              - the ObjectId for this file
         * @type {file}
         */
        var file = files.file;

        if(_.isNull(file) || _.isUndefined(file)) {
            return res.status(400).send(new Error('No file'));
        }

        console.log(`${file.name} -> ${file.id}`);
        //console.log(fields);

        if(!_.isEmpty(fields)) {
            if(fields.name && _.isString(fields.name)) {
                file.name = fields.name;
            }

            if(fields.purpose && _.isString(fields.purpose)) {
                file.purpose = fields.purpose;

                if(fields.purpose.toLowerCase() === 'photo') {
                    var photoModel = {
                        name: file.name,
                        fileId: file.id
                    };
                    if(fields.info && _.isString(fields.purpose)) {
                        photoModel.info = fields.info;
                    }

                    var promises = [
                        getExif(file.id)
                            .then(function(exifData) {
                                if(!exifData) {
                                    photoModel.metadata = {};
                                } else {
                                    photoModel.metadata = { exif: exifData.exif, image: exifData.image, gps: exifData.gps };
                                    console.log(exifData);
                                }
                            }),
                        createThumbnail(file.id, {
                            width: null,
                            height: 400
                        })
                            .then(function(thumbnail) {
                                console.log(`${file.name} -> (thumb)${thumbnail.id}`);
                                photoModel.thumbnailId = thumbnail.id;
                                photoModel.width = thumbnail.originalWidth;
                                photoModel.height = thumbnail.originalHeight;
                            }),
                        createThumbnail(file.id)
                            .then(function(squareThumbnail) {
                                console.log(`${file.name} -> (sqThumb)${squareThumbnail.id}`);
                                photoModel.sqThumbnailId = squareThumbnail.id;
                            })
                    ];

                    Promise.all(promises)
                        .then(function() {
                            Photo.create(photoModel, function(err, photo) {
                                if(err) return handleError(res, err);
                                else return res.status(201).json(photo);
                            });
                        }, function(err) {
                            res.status(400).send(err);
                        });
                }
            }
        } else {
            return res.status(400).end();
        }
    });
}

// Updates an existing file in the DB.
//export function update(req, res) {
//    if(!isValidObjectId(req.params.id)) {
//        return res.status(400).send('Invalid ID');
//    }
//    if(req.body._id) {
//        delete req.body._id;
//    }
//    Upload.findById(req.params.id, function(err, upload) {
//        if(err) {
//            return handleError(res, err);
//        } else if(!upload) {
//            return res.send(404);
//        } else {
//            var updated = _.merge(upload, req.body);
//            updated.save(function(err) {
//                if(err) {
//                    return handleError(res, err);
//                }
//                return res.json(200, upload);
//            });
//        }
//    });
//}

// Deletes a file from the DB.
export function destroy(req, res) {
    if(!isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid ID');
    } else if(!req.params.id) {
        return res.status(404).send(new ReferenceError('File not found.'));
    } else {
        gfs.remove({_id: req.params.id}, function(err) {
            if(err) return handleError(err);
            res.status(200).end();
        });
    }
}

// Finds and cleans orphaned GridFS files
export function clean(req, res) {
    /**
     * This baby plucks all of the GridFS document IDs from all Photos, Projects, and Users.
     * It then compares that list to a list of all documents
     * in GridFS. If the GridFS document isn't used in the first list, it gets deleted.
     */
    Promise.all([
        getIds(gridModel, ['_id']),
        getIds(Photo, ['fileId', 'thumbnailId', 'sqThumbnailId']),
        getIds(Project, ['thumbnailId', 'coverId']),
        getIds(User, ['imageId', 'smallImageId'])
    ])
        .then(function([fileIds, photoIds, projectIds, userIds]) {
            let ids = _.difference(_.invokeMap(fileIds, 'toString'), _.invokeMap(_.union(photoIds, projectIds, userIds), 'toString'));
            return Promise.all(ids.map(id => new Promise((resolve, reject) => {
                gfs.remove({_id: id}, function(err) {
                    if(err) return reject(err);
                    else {
                        console.log('Delete file', id);
                        return resolve();
                    }
                });
            })));
        })
        .catch(console.log);

    /**
     * This little gem generates a list of all the Photos that aren't
     * in a Gallery, and then deletes those photos, along with the three files
     * in GridFS linked to each of them.
     */
    Promise.all([
        getIds(Gallery, ['photos']),
        Photo.find().exec()
    ])
        .then(function([photosInGalleries, allPhotos]) {
            let ids = _.difference(_.invokeMap(_.map(allPhotos, '_id'), 'toString'), _.flatten(photosInGalleries));
            return Promise.all(ids.map(id => Photo.findByIdAndRemove(id).exec()
                .then(function(photo) {
                    console.log('Delete photo', photo._id);
                    return Promise.all([
                        deleteFile({_id: photo.fileId}),
                        deleteFile({_id: photo.thumbnailId}),
                        deleteFile({_id: photo.sqThumbnailId})
                    ]);
                })));
        })
        .catch(console.log);

    res.status(202).end();
}

/**
 * Takes an image from a GridFS document ID, uses GM to stream it to a buffer,
 * and then uses the exif library to extract its EXIF data and return it
 * @param {String} id - ID of the GridFS image file to get EXIF data for
 * @returns {Promise}
 */
function getExif(id) {
    return new Promise((resolve, reject) => {
        gm(gfs.createReadStream({_id: id}).on('error', console.log), id)
            .toBuffer('JPG', function(err, buffer) {
                if(err) return reject(err);

                ExifImage({ image: buffer }, function(error, exifData) {
                    if(error) {
                        if(error.code === 'NO_EXIF_SEGMENT') {
                            resolve();
                        } else {
                            reject(error);
                        }
                    } else {
                        resolve(exifData);
                    }
                });
            });
    });
}

/**
 * Fetches every document of `model`, plucks each property in `properties` out
 * of it, and returns them all in one flattened array
 * @param model         - The mongoose model in which to get all of the documents for
 * @param properties    - An array of model property names, as strings
 * @returns {Promise}
 */
function getIds(model, properties) {
    return model.find({}).exec()
        .then(files => _.flatten(_.map(properties, _.partial(_.map, files))));
}
