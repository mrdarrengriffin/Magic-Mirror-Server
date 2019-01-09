global.config = require('./config.json')
const express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')

var settings = {
    route:'/layout-b'
};

var GoogleHandler = require('./handlers/GoogleHandler.js');
var SpotifyHandler = require('./handlers/SpotifyHandler.js');

// Discord integration coming soon
//var DiscordHandler = require('./handlers/DiscordHandler.js');

if (global.config.google_api.oauth2.refresh_token != undefined) {
    GoogleHandler.setRefreshToken(global.config.google_api.oauth2.refresh_token);
}

if (global.config.spotify.oauth2.refresh_token != undefined) {
    SpotifyHandler.setRefreshToken(global.config.spotify.oauth2.refresh_token);
}

/* Timed API Calls */
setTimeout(() => {
    GoogleHandler.getCalendarEvents();
    SpotifyHandler.getCurrentlyPlaying();
    setInterval(function () {
        SpotifyHandler.getCurrentlyPlaying()
    }, global.config.spotify.oauth2.request_interval);
    setInterval(function () {
        GoogleHandler.getCalendarEvents()
    }, global.config.google_api.oauth2.request_interval);
},2000);


const app = express();
app.listen(global.config.http_server.port)

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


app.get('/', (req, res) => {
    SpotifyHandler.getCurrentlyPlaying();
});

app.get('/settings', (req, res) => {
    res.json(settings);
});
app.post('/settings/route', (req, res) => {
    settings.route = req.body.route
});

app.get('/auth/google', (req, res) => {
    res.redirect(GoogleHandler.generateAuthorizationURL())
});

app.get('/auth/spotify', (req, res) => {
    res.redirect(SpotifyHandler.generateAuthorizationURL())
});

app.get('/auth/google/callback', (req, res) => {
    GoogleHandler.storeTokensFromCode(req.query.code).then((tokens) => {
        res.end("OK")
    }).catch(() => {
        res.end("NOT OK")
    });
});

app.get('/auth/spotify/callback', (req, res) => {
    SpotifyHandler.storeTokensFromCode(req.query.code).then((tokens) => {
        res.end("OK")
    }).catch(() => {
        res.end("NOT OK")
    });
});

app.get('/google/calendar/events', (req, res) => {
    res.json(GoogleHandler.data)
});

app.get('/spotify/playing', (req, res) => {
    res.json(SpotifyHandler.data)
});

