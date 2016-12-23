import fetch from 'isomorphic-fetch'

function checkStatus(response) {
  if(response.ok) {
    return response;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

function enhancedFetch(url, options) {
  options.headers = Object.assign({
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }, options.headers);
  if(typeof options.body !== 'string') {
    options.body = JSON.stringify(options.body);
  }
  return fetch(url, options)
    .then(checkStatus)
    .then(parseJSON);
}

var spotifyData = {
  songs:[
    {name:'amazing', artist:'Kanye', popularity:53, id: 2934385},
    {name:'Roses', Artist: 'OutKast',popularity:60, id: 4589015}
  ],
  playlists:[]
}

//bearerToken will be aquired through regex & window.hash
var bearerToken = 'BQDjfod-EoFrM4hFk6d-0g5uVkDo6EY3NVhqZMp2RfehyH40PCYrtdXQGRRsaSkqMqmLCPvmbk6sIDN6sIApgLqdepgkStYH3hrtp6uUVHad8yfjmMI8dOcLvy-m3rAPybF0HX-384xGA3FZPac3yQc0HdeJTNgoer0DMUfW1-zQupM4Aq6pjLI'

//returns json format of users playlists
var getPlaylists = function () {
    return fetch('https://api.spotify.com/v1/me/playlists', {
      method: 'get',
      headers: {
        'Authorization': 'Bearer '  // + , ??
        },
      }).then(function(res) {
          return res.json()
        })
      }

//saves playlists and playlist ids to spotifyData
var storePlaylists = function (playListData) {
 for (var i=0;i<playListData.items.length;i++) {
  var id = playListData.items[i].id
  var name = playListData.items[i].name
  var songs = playListData.items[i].tracks.href
  spotifyData.playlists.push({name:name,id:id,songs:songs})
 }
 return spotifyData
}

//makes api call for songs each playlist and then runs a for loop through each promise to retrieve song info
var getSongs = function (spotifydata) {

  for (var i = 0 ; i < spotifydata.playlists.length ; i++) {

    enhancedFetch(spotifydata.playlists[i].songs, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer '+ bearerToken,
        },
      }).then(function(res) {
        for (var j = 0; j<res.items.length; j++) {
          var name = res.items[j].track.name
          var popularity = res.items[j].track.popularity
          var artist = res.items[j].track.artists[0].name
          var id = res.items[j].track.id
          spotifyData.songs.push({ name:name, artist:artist, popularity:popularity, id:id })
        }
      })
    }
  }

//calculates average popularity of users songs
var getAvgPopularity = function (playlist) {
  var popsum = 0
  for (var i = 0; i < playlist.length; i++) {
      popsum += playlist[i].popularity;
  };
  return (popsum / playlist.length)
}

//{eventually will} filter out unpopular songs from users spotifyData
var getNewPlaylist = function(playlist) {
  var popcutoff = getAvgPopularity(playlist) + 10
  for (var i = (playlist.length-1); i >= 0; i--) {
    if (playlist[i].popularity < popcutoff) {
        playlist.splice(i, 1)
      }
  }
  return playlist
}

//retrieves info like energy and bpm for each track in newly filtered song list
var getTrackInfo = function () {
    return fetch('https://api.spotify.com/v1/audio-features/?ids=2gZUPNdnz5Y45eiGxpHGSc', {
      method: 'get',
      headers: {
        'Authorization': 'Bearer '+ bearerToken,
        },
      }).then(function(res) {
          return res.json()
        })
      }
      
//sets off all previous calls
getPlaylists().then(function(data) {
  var spotifydata = storePlaylists(data);
  getSongs(spotifydata);
  var newPlaylist = getNewPlaylist(spotifyData.songs);
  //final action is to collect track info on newPlaylist through the getTrackInfo funciton
})
