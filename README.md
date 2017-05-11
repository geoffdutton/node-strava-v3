
# strava-v3: Simple Node wrapper for Strava's v3 API

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]

[npm-image]: https://img.shields.io/npm/v/strava-v3.svg?style=flat
[npm-url]: https://npmjs.org/package/strava-v3
[downloads-image]: https://img.shields.io/npm/dm/strava-v3.svg?style=flat
[downloads-url]: https://npmjs.org/package/strava-v3
[travis-image]: https://travis-ci.org/UnbounDev/node-strava-v3.svg?branch=master&style=flat
[travis-url]: https://travis-ci.org/UnbounDev/node-strava-v3

### Status
Supports API functionality for all API endpoints from `oauth` to `uploads`:

* `oauth`
* `athlete`
* `athletes`
* `activities`
* `clubs`
* `gear`
* `running_races`
* `routes`
* `segments`
* `segment_efforts`
* `streams`
* `uploads`

## Installation

```bash
npm install strava-v3
```

## Quick start

* Create an application at [strava.com/settings/api](https://www.strava.com/settings/api) and make note of your `access_token`
* from the root of your node application: `$ npm install strava-v3`
* `$ mkdir data`
* `$ cp node_modules/strava-v3/strava_config data/strava_config`
* Open `data/strava_config` in your favorite text editor and supply your applications `access_token` to the `access_token` field
* Use it!

```js
var strava = require('strava-v3');
strava.athlete.get({},function(err,payload,limits) {
    if(!err) {
        console.log(payload);
    }
    else {
        console.log(err);
    }
});
```

## Resources

* [Strava Developers Center](http://www.strava.com/developers)
* [Strava API Reference](http://strava.github.io/api/)

## Usage

### OAuth configuration

If you are writting an app that other Strava users will authorize against their
own account, you'll need to use the OAuth flow. This requires that you provide
a `client_id`, `client_secret` and `redirect_uri` that ultimately result in
getting back an `access_token` which can be used for calls on behalf of that
user.

You have two options to configure your OAuth calls:

#### Config File

The template `strava_config` file can be found at the modules root directory and has the following structure

```json
{
    , "client_id"     :"Your apps Client ID (Required for oauth)"
    , "client_secret" :"Your apps Client Secret (Required for oauth)"
    , "redirect_uri"  :"Your apps Authorization Redirection URI (Required for oauth)"
}
```

##### Environment variables

You may alternatively supply the values via environment variables named following the convention `STRAVA_<keyName>`, so

- `STRAVA_ACCESS_TOKEN` = `access_token`
- `STRAVA_CLIENT_ID` = `client_id`
- `STRAVA_CLIENT_SECRET` = `client_secret`
- `STRAVA_REDIRECT_URI` = `redirect_uri`

<!--
You may also use explicit configuration, will override both the config file and the environment variables:

```js
var strava = require('strava-v3')
strava.config({
    "access_token"    :"Your apps access token (Required for Quickstart)"
    , "client_id"     :"Your apps Client ID (Required for oauth)"
    , "client_secret" :"Your apps Client Secret (Required for oauth)"
    , "redirect_uri"  :"Your apps Authorization Redirection URI (Required for oauth)"
});
```
-->

### General

API access is designed to be as closely similar in layout as possible to Strava's own architecture,
with the general call definition being

```js
var strava = require('strava-v3')
strava.<api endpoint>.<api endpoint option>(args,callback)
```

Example usage:

```js
var strava = require('strava-v3');
strava.athletes.get({id:12345},function(err,payload,limits) {
    //do something with your payload, track rate limits
});
```

### Overriding the default `access_token`

You'll probably want to do this with every call once your app is in production,
using an `access_token` specific to a validated user allows for detailed
athlete information, as well as the option for additional `PUT`/`POST`/`DELETE`
privileges.

Use app-specific logic to retrieve the access\_token for a particular user, then create a Strava client for that user, with their token:

```js
var stravaApi = require('strava-v3');

// ... get access_token from somewhere
strava = stravaApi.client(access_token);

strava.athlete.get(function(err,payload,limits) {
    //do something with your payload, track rate limits
});
```

Less conveniently, you can also explictly pass an access\_token to API calls:

Example usage:

```js
var strava = require('strava-v3');
strava.athlete.get({'access_token':'abcde'},function(err,payload,limits) {
    //do something with your payload, track rate limits
});
```

### Dealing with pagination

For those API calls that support pagination, you can control both the `page` being retrieved and the number of responses to return `per_page` by adding the corresponding properties to `args`.

Example usage:

```js
var strava = require('strava-v3');
strava.athlete.listFollowers({
    'page':1
    , 'per_page':2
},function(err,payload,limits) {
    //do something with your payload, track rate limits
});
```

### Uploading files
To upload a file you'll have to pass in the `data_type` as specified in Strava's API reference as well as a string `file` designating the `<filepath>/<filename>`. If you want to get updates on the status of your upload pass in `statusCallback` along with the rest of your `args` - the wrapper will check on the upload once a second until complete.

Example usage:

```js
var strava = require('strava-v3');
strava.uploads.post({
    'data_type':'gpx'
    , 'file': 'data/your_file.gpx'
    , 'name': 'Epic times'
    , 'statusCallback': function(err,payload) {
        //do something with your payload
    }
},function(err,payload,limits) {
    //do something with your payload, track rate limits
});
```

### Rate limits
According to Strava's API each response contains information about rate limits.
For more details see: [Rate Limiting](https://strava.github.io/api/#rate-limiting)

Returns `null` if `X-Ratelimit-Limit` or `X-RateLimit-Usage` headers are not provided

#### Callback interface

```js
var strava = require('strava-v3');
strava.athlete.get({'access_token':'abcde'},function(err,payload,limits) {
    //do something with your payload, track rate limits
    console.log(limits);
    /*
    output:
    {
       shortTermUsage: 3,
       shortTermLimit: 600,
       longTermUsage: 12,
       longTermLimit: 30000
    }
    */
});
```
#### Global status

In our promise API, only the response body "payload" value is returned as a
[Bluebird promise](https://bluebirdjs.com/docs/api-reference.html). To track
rate limiting we use a global counter accessible through `strava.rateLimiting`.
 The rate limiting status is updated with each request.


    // returns true if the most recent request exceeded the rate limit
    strava.rateLimiting.exceeded()

    // returns the current decimal fraction (from 0 to 1) of rate used. The greater of the short and long term limits.
    strava.rateLimiting.fractionReached();

### Supported API Endpoints

Oauth:

* `strava.oauth.getRequestAccessURL(args)`
* `strava.oauth.getToken(code,done)`
* `strava.oauth.deauthorize(args,done)`

Athlete:

* `strava.athlete.get(args,done)`
* `strava.athlete.update(args,done)`
* `strava.athlete.listFriends(args,done)`
* `strava.athlete.listFollowers(args,done)`
* `strava.athlete.listActivities(args,done)` *Get list of activity summaries*
* `strava.athlete.listRoutes(args,done)`
* `strava.athlete.listClubs(args,done)`
* `strava.athlete.listZones(args,done)`

Athletes:

* `strava.athletes.get(args,done)` *Get a single activity. args.id is required*
* `strava.athletes.listFriends(args,done)`
* `strava.athletes.listFollowers(args,done)`
*	`strava.athletes.stats(args,done)`
* `strava.athletes.listKoms(args,done)`
* `strava.athletes.stats(args,done)`

Activities:

* `strava.activities.get(args,done)`
* `strava.activities.create(args,done)`
* `strava.activities.update(args,done)`
* `strava.activities.delete(args,done)`
* `strava.activities.listFriends(args,done)`
* `strava.activities.listZones(args,done)`
* `strava.activities.listLaps(args,done)`
* `strava.activities.listComments(args,done)`
* `strava.activities.listKudos(args,done)`
* `strava.activities.listPhotos(args,done)`
* `strava.activities.listRelated(args,done)`

Clubs:
* `strava.clubs.get(args,done)`
* `strava.clubs.listMembers(args,done)`
* `strava.clubs.listActivities(args,done)`
* `strava.clubs.listAnnouncements(args,done)`
* `strava.clubs.listEvents(args,done)`
* `strava.clubs.listAdmins(args,done)`
* `strava.clubs.joinClub(args,done)`
* `strava.clubs.leaveClub(args,done)`

Gear:
* `strava.gear.get(args,done)`

Running Races:
* `strava.runningRaces.get(args,done)`
* `strava.runningRaces.listRaces(args,done)`

Routes:
* `strava.routes.get(args,done)`

Segments:
* `strava.segments.get(args,done)`
* `strava.segments.listStarred(args,done)`
* `strava.segments.listEfforts(args,done)`
* `strava.segments.listLeaderboard(args,done)`
* `strava.segments.explore(args,done)`

Segment Efforts:
* `strava.segmentEfforts.get(args,done)`

Streams:
* `strava.streams.activity(args,done)`
* `strava.streams.effort(args,done)`
* `strava.streams.segment(args,done)`

Uploads:
* `strava.uploads.post(args,done)`

## Development

This package includes a full test suite runnable via `grunt jshint simplemocha` or `npm test`,
and will both delint and run shallow tests on API endpoints.

### Running the tests

You'll first need to supply `data/strava_config` with an `access_token` that has both private read and write permissions:

* Make sure you've filled out all the fields in `data/strava_config`.
* Use `strava.oauth.getRequestAccessURL({scope:"view_private,write"})` to generate the request url and query it via your browser.
* Strava will prompt you (the user) to allow access, say yes and you'll be sent to your Authorization Redirection URI - the parameter `code` will be included in the redirection url.
* Exchange the `code` for a new `access_token`:

```js
strava.oauth.getToken(code,function(err,payload,limits) {
    // access_token is at payload.access_token
    console.log(payload);
});
```

Finally, the test suite has some expectations about the Strava account that it
connects for the tests to pass. The following should be true about the Strava
data in the account:

 * Must have at least one activity posted on Strava
 * Must have joined at least one club
 * Must have added at least one piece of gear (bike or shoes)
 * Must have created at least one route
 * Most recent activity with an achievement should also contain a segment

(Contributions to make the test suite more self-contained and robust are welcome!)

* You're done! Paste the new `access_token` to `data/strava_config` and go run some tests:

`grunt jshint simplemocha` or `npm test`.

### How the tests work

Using the provided `access_token` tests will access each endpoint individually:

* (For all `GET` endpoints) checks to ensure the correct type has been returned from the Strava.
* (For `PUT` in `athlete.update`) changes some athlete properties, then changes them back.
* (For `POST/PUT/DELETE` in `activities.create/update/delete`) first creates an activity, runs some operations on it, then deletes it.
