var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
  clientId: global.config.spotify.oauth2.client_id,
  clientSecret: global.config.spotify.oauth2.client_secret,
  redirectUri: global.config.http_server.public_url + '/auth/spotify/callback'
});

var token_expiry = 0;

module.exports.data = {}

module.exports.generateAuthorizationURL = function () {
  return spotifyApi.createAuthorizeURL(global.config.spotify.oauth2.scopes, "mirror")
}

module.exports.setRefreshToken = async function (refresh_token) {
  spotifyApi.setRefreshToken(refresh_token);
  module.exports.refreshAccessToken();
  
}

module.exports.refreshAccessToken = function(){
  spotifyApi.refreshAccessToken().then(
    function (data) {
      spotifyApi.setAccessToken(data.body.access_token);
      token_expiry = Math.floor(new Date().getTime() / 1000) + 3480;
    });

}

module.exports.storeTokensFromCode = async function (code) {
  await spotifyApi.authorizationCodeGrant(code).catch(console.error).then((response) => {
    spotifyApi.setAccessToken(response.body.access_token);
    spotifyApi.setRefreshToken(response.body.refresh_token);
    console.log('Spotify Access Token: ' + response.body.access_token);
    console.log('Spotify Refresh Token: ' + response.body.refresh_token);
    token_expiry = Math.floor(new Date().getTime() / 1000) + 3480;
    
  });
}

module.exports.checkTokenExpiry = function(){
  if(Math.floor(new Date().getTime() / 1000) >= token_expiry){
    console.log("REFRESHED SPOTIFY TOKEN")
    console.log(Math.floor(new Date().getTime() / 1000)+" -- "+token_expiry)
    module.exports.refreshAccessToken()
  }
}

module.exports.getCurrentlyPlaying = async function () {
  module.exports.checkTokenExpiry()
  spotifyApi.getMyCurrentPlaybackState().catch(console.error).then(function (data) {
      module.exports.data = data.body
    });
}
