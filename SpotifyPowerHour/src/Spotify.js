import fetch from 'isomorphic-fetch';
import { bearerToken } from './components/main.js'
var lightningBoltImage = require('./imgs/lightningBolt.png')
//var bearerToken = 'BQD8nYLkvDWrOBfx5nOuKS3wRZFw5E_v23_qIGczL6F3Kx1FK778a1Zj8c2hgaU1ZMTDXlMMJdUjYY-PCwAM0v6W_jG55c3yv8NyBboYbwqwaIOlBtfmVL21BmOJKGd1mASu784qJXo8a2Uk5WKD6KzklSunwAxPrTIaB0MhKEhV9ZSWu3GoL0k'
function checkStatus(response) {
  if (response.ok) {
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
  if (typeof options.body !== 'string') {
    options.body = JSON.stringify(options.body);
  }
  return fetch(url, options)
    .then(checkStatus)
    .then(parseJSON);
}

//end data sctructure
var spotifyData = {
  songs: [],
  playlists: []
}

exports.exportedSpotifyData = spotifyData

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

//returns json format of users playlists
var getPlaylists = function () {
  return fetch('https://api.spotify.com/v1/me/playlists', {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
    },
  }).then(function (res) {
    return res.json()
  })
}

//saves playlists and playlist ids to spotifyData
var storePlaylists = function (playListData) {
  for (var i = 0; i < playListData.items.length; i++) {
    var id = playListData.items[i].id
    var name = playListData.items[i].name
    var songs = playListData.items[i].tracks.href
    spotifyData.playlists.push({ name: name, id: id, songs: songs })
  }
  return spotifyData
}

//makes api call for songs each playlist and then runs a for loop through each promise to retrieve song info
var getSongs = function (data) {
  return Promise.all(data.playlists.map(function (playlist) {
    return enhancedFetch(playlist.songs, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + bearerToken,
      },
    })
  })).then(function (resolvedSongLists) {
    resolvedSongLists.forEach(function (resolvedSongs) {
      spotifyData.songs = spotifyData.songs.concat(resolvedSongs.items.map((song) => ({
        name: song.track.name,
        popularity: song.track.popularity,
        artist: song.track.artists[0].name,
        id: song.track.id,
        albumArt: song.track.album.images[0] ? song.track.album.images[0].url : "http://static.tumblr.com/qmraazf/ps5mjrmim/unknown-album.png"
      })));
    })
    return spotifyData;
  });
}


//calculates average popularity of users songs
var getAvgPopularity = function (data) {
  var popsum = 0
  for (var i = 0; i < data.songs.length; i++) {
    popsum += data.songs[i].popularity;
  };
  return (popsum / data.songs.length)
}

//{eventually will} filter out unpopular songs from users spotifyData
var getNewPlaylist = function (data) {
  var popcutoff = getAvgPopularity(data) + 10
  for (var i = (data.songs.length - 1); i >= 0; i--) {
    if (data.songs[i].popularity < popcutoff) {
      data.songs.splice(i, 1)
    }
  }
  spotifyData.songs.splice(200)
  spotifyData.songs = shuffle(spotifyData.songs)
}

//retrieves info like energy and bpm for each track in newly filtered song list
var getTrackInfo1 = function (data) {
  var link = 'https://api.spotify.com/v1/audio-features/?ids='

  for (var i = 0; i < 100; i++) {
    if (i === 0) {
      link = link + data.songs[i].id
    }
    else {
      link = link + "," + data.songs[i].id
    }
  }

  fetch(link, {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
    },
  }).then(function (res) {
    return (res.json())
  }).then(function (json) {
    for (var j = 0; j < 100; j++) {
      var energy = json.audio_features[j].energy
      data.songs[j].energy = energy
    }
  })
}

var getTrackInfo2 = function (data) {
  var link = 'https://api.spotify.com/v1/audio-features/?ids='

  for (var i = 100; i < 200; i++) {
    if (i === 100) {
      link = link + data.songs[i].id
    }
    else {
      link = link + "," + data.songs[i].id
    }
  }

  fetch(link, {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
    },
  }).then(function (res) {
    return (res.json())
  }).then(function (json) {
    for (var j = 0; j < 100; j++) {
      var energy = json.audio_features[j].energy
      data.songs[j + 100].energy = energy
    }
  })
}

var sortEnergy = function (data) {
  data.songs.energy.sort(function (a, b) {
    return parseFloat(a.price) - parseFloat(b.price);
  });
}

var promise = new Promise(function (resolve, reject) {
  resolve(spotifyData);
})

//sets off all previous calls
exports.retrieveData = function () {
  getPlaylists().then(function (data) {

    storePlaylists(data)
    return promise

  }).then(function (data) {

    return getSongs(data)
    return promise

  }).then(function (data) {

    getNewPlaylist(data)
    return promise

  }).then(function (data) {

    getTrackInfo1(data)
    getTrackInfo2(data)
    return promise

  }).then(function (data) {
    var energyRange = []
    setTimeout(function(){
    for (var i = 0; i < data.songs.length; i++) {  //change here
      energyRange.push(data.songs[i].energy)
    }
    console.log(energyRange)
    exports.minEnergy = Math.min.apply(null, energyRange)
    var maxEnergy = Math.max.apply(null, energyRange)
    exports.energyScale = (maxEnergy - exports.minEnergy) / 20
    console.log(exports.minEnergy, maxEnergy, exports.energyScale)
    }, 500)
  })
}

exports.songShuffle = function(array) {
  shuffle(array)
}

/*.then(function(data) {

sortEnergy(data)
return promsie
})
*/

//setTimeout(function () {console.log(spotifyData.songs)},10000)
