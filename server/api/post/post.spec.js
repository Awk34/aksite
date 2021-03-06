/*eslint-env mocha*/

var app = require('../../app').default;
var request = require('supertest');

describe('GET /api/posts', function() {
    it('should respond with JSON array', function(done) {
        request(app)
            .get('/api/posts')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if(err) return done(err);
                res.body.should.be.instanceof(Object);
                res.body.items.should.be.instanceof(Array);
                done();
            });
    });
});
