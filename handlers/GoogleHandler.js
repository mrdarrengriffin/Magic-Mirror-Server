const {google} = require('googleapis');
var moment = require('moment');


var oauth2client = new google.auth.OAuth2(
    global.config.google_api.oauth2.client_id,
    global.config.google_api.oauth2.client_secret,
    global.config.http_server.public_url+'/auth/google/callback'
)

var google_calendar = google.calendar({version:'v3',auth:oauth2client})

module.exports.data = {};

module.exports.tokens;

module.exports.generateAuthorizationURL = function(){
    return oauth2client.generateAuthUrl({access_type: 'offline',scope:global.config.google_api.oauth2.scopes})
}

module.exports.storeTokensFromCode = async function(code){
    await oauth2client.getToken(code).catch(console.error).then((response) => {
        if (response.tokens.refresh_token != undefined) {
            console.log("Google Refresh Token: " + response.tokens.refresh_token);
            oauth2Client.setCredentials({
                refresh_token: response.tokens.refresh_token
            });
            return response.tokens;
        }
    });
}

module.exports.setRefreshToken = function(refresh_token){
    oauth2client.setCredentials({refresh_token: refresh_token})
}

module.exports.getCalendarEvents = async function(){
    google_calendar.events.list({calendarId:global.config.google_calendar.calendar_id,orderBy:"startTime",timeMin:(new Date()).toISOString(),singleEvents:true}).then((response) => {
        var data = response.data;
        for(var i in data.items){
            data.items[i].startTimestamp = moment(data.items[i].start.dateTime).unix();
            data.items[i].endTimestamp = moment(data.items[i].end.dateTime).unix();
            data.items[i].started = (Math.floor(Date.now() / 1000) > data.items[i].startTimestamp)
            data.items[i].finished = (Math.floor(Date.now() / 1000) > data.items[i].endTimestamp)
        }
        module.exports.data.google_calendar = data;
    });
}
