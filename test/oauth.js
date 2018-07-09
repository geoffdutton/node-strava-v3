/**
 * Created by austin on 9/22/14.
 */

var should = require('should')
    , sinon = require('sinon')
    , sandbox = sinon.createSandbox()
    , authenticator = require('../lib/authenticator')
    , querystring = require('querystring')
    , strava = require('../');

var _tokenExchangeCode = 'a248c4c5dc49e71336010022efeb3a268594abb7';

describe('oauth_test', function () {
    var requestStub;
    var clientId = 'test-client-id';
    var clientSecret = 'test-client-secret';
    var redirectUri = 'http:://something.com';

    beforeEach(function () {
        requestStub = sandbox.stub(strava.oauth, 'request');
        sandbox.stub(authenticator, 'getClientId').returns(clientId);
        sandbox.stub(authenticator, 'getClientSecret').returns(clientSecret);
        sandbox.stub(authenticator, 'getRedirectUri').returns(redirectUri);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#getRequestAccessURL()', function () {
        it('should return the full request access url', function () {
            var targetUrl = 'https://www.strava.com/oauth/authorize?' +
                querystring.stringify({
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    response_type: 'code',
                    scope: 'view_private,write'
                });

            var url = strava.oauth.getRequestAccessURL({
                scope: 'view_private,write'
            });

            url.should.be.exactly(targetUrl);
        });
    });

    describe('#deauthorize()', function () {
        it('Should have method deauthorize', function () {
            strava.oauth.should.have.property('deauthorize');
        });

        it('Should return 401 with invalid token', function (done) {
            requestStub.resolves({ message: 'Authorization Error' });

            strava.oauth.deauthorize({access_token: 'BOOM'}, function (err, payload) {
                (payload).should.have.property('message').eql('Authorization Error');
                sinon.assert.calledWith(requestStub, {
                    url: '/oauth/deauthorize',
                    method: 'POST',
                    json: true,
                    simple: false,
                    headers: {
                        Authorization: 'Bearer BOOM'
                    }
                });
                done();
            });
        });

        it('Should return 401 with invalid token (Promise API)', function () {
            requestStub.resolves({ message: 'Authorization Error' });

            return strava.oauth.deauthorize({access_token: 'BOOM'}).then(function (payload) {
                (payload).should.have.property('message').eql('Authorization Error');
                sinon.assert.calledWith(requestStub, {
                    url: '/oauth/deauthorize',
                    method: 'POST',
                    json: true,
                    simple: false,
                    headers: {
                        Authorization: 'Bearer BOOM'
                    }
                });
            });
        });
        // Not sure how to test since we don't have a token that we
        // want to deauthorize
    });

    describe('#getToken()', function () {
        it('should return an access_token', function (done) {
            requestStub.callsFake(function (opt, cb) {
                cb(null, { access_token: 'blah' });
            });
            strava.oauth.getToken(_tokenExchangeCode, function (err, payload) {
                should(err).be.null();
                payload.should.eql({ access_token: 'blah' });
                sinon.assert.calledWith(requestStub, {
                    url: '/api/v3/oauth/token',
                    method: 'POST',
                    json: true,
                    form: {
                        code: _tokenExchangeCode,
                        client_secret: clientSecret,
                        client_id: clientId
                    }
                }, sinon.match.func);
                done();
            });
        });
    });
});
