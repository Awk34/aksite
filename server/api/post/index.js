'use strict';
import {Router} from 'express';
var controller = require('./post.controller');
var auth = require('../../auth/auth.service');

var router = new Router();

router.get('/', auth.appendUser(), controller.index);
router.get('/count', auth.hasRole('admin'), controller.count);
router.get('/:id', auth.appendUser(), controller.show);
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
