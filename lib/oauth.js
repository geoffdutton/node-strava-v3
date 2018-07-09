/**
 * Created by austin on 9/22/14.
 */

var authenticator = require('./authenticator')
    , Promise = require('bluebird')
    , request = require('request-promise')
    , querystring = require('querystring');

var Oauth = function () {
    this.request = request.defaults({
        baseUrl : 'https://www.strava.com',
        headers: {
            'User-Agent': 'node-strava-v3'
        },
        json: true
    });
};

Oauth.prototype.getRequestAccessURL = function(args) {

    var url = 'https://www.strava.com/oauth/authorize?'
        , oauthArgs = {
            client_id: authenticator.getClientId()
            , redirect_uri: authenticator.getRedirectUri()
            , response_type: 'code'
        };

    if(args.scope)
        oauthArgs.scope = args.scope;
    if(args.state)
        oauthArgs.state = args.state;
    if(args.approval_prompt)
        oauthArgs.approval_prompt = args.approval_prompt;

    var qs = querystring.stringify(oauthArgs);

    url += qs;
    return url;
};

Oauth.prototype.getToken = function(code,done) {
    return this.request({
      method: 'POST'
      , url: '/api/v3/oauth/token'
      , json: true
      , form : {
            code: code
            , client_secret: authenticator.getClientSecret()
            , client_id: authenticator.getClientId()
        }
    }, done);

};

Oauth.prototype.deauthorize = function(args,done) {

    var endpoint = '/oauth/deauthorize';

    var url = endpoint
        , options = {
            url: url
            , method: 'POST'
            , json: true
              // We want to consider some 30x responses valid as well
              // 'simple' would only consider 2xx responses successful
            , simple: false
            , headers: {
                Authorization: 'Bearer ' + args.access_token
            }
        };

    // Promise.resolve is used to convert the promise returned
    // to a Bluebird promise
    // tapCatch is used to log errors without stopping the promise flow.
    // asCallback is used to support both Promise and callback-based APIs
    return Promise.resolve(this.request(options)).
        tapCatch(function(err) {
          console.log('api call error');
          console.log(err);
        }).asCallback(done);
};

module.exports = Oauth;
