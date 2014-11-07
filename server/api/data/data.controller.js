'use strict';

var _ = require('lodash');
var Data = require('./data.model');
var config = require('../../config/environment');
var path = require('path');

// Get list of datas
exports.index = function(req, res) {
    Data.find(function(err, datas) {
        if(err) {
            return handleError(res, err);
        }
        return res.json(200, datas);
    });
};

// Get a single data
exports.show = function(req, res) {
    res.sendfile(path.resolve(config.root + '/' + '/data' + req.url));
//    Data.findById(req.params.id, function (err, data) {
//        if (err) {
//            return handleError(res, err);
//        } else if (!data) {
//            return res.send(404);
//        } else {
//            return res.json(data);
//        }
//    });
};

// Creates a new data in the DB.
exports.create = function(req, res) {
    Data.create(req.body, function(err, data) {
        if(err) {
            return handleError(res, err);
        } else {
            return res.json(201, data);
        }
    });
};

// Updates an existing data in the DB.
exports.update = function(req, res) {
    if(req.body._id) {
        delete req.body._id;
    }
    Data.findById(req.params.id, function(err, data) {
        if(err) {
            return handleError(res, err);
        } else if(!data) {
            return res.send(404);
        } else {
            var updated = _.merge(data, req.body);
            updated.save(function(err) {
                if(err) {
                    return handleError(res, err);
                }
                return res.json(200, data);
            });
        }
    });
};

// Deletes a data from the DB.
exports.destroy = function(req, res) {
    Data.findById(req.params.id, function(err, data) {
        if(err) {
            return handleError(res, err);
        } else if(!data) {
            return res.send(404);
        } else {
            data.remove(function(err) {
                if(err) {
                    return handleError(res, err);
                } else {
                    return res.send(204);
                }
            });
        }
    });
};

function handleError(res, err) {
    return res.send(500, err);
}
