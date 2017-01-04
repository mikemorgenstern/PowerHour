import React, { Component } from 'react';
import '../styling/main.css';
import { GetSongUrl } from '../GetSongUrl.js';
import Start from './start.js';
import Player from './player.js';
import Button from './button.js';
import Timer from './timer.js';
import Queue from './queue.js';
import { retrieveData } from '../Spotify.js';
import { exportedSpotifyData } from '../Spotify.js'
var spotifylogin = require('../imgs/SpotifyLogin.png')
var lightningBoltImage = require('../imgs/lightningBolt.png')

class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            startButtonPressed: false,   //indicates whether start button is pressed, will render player if it is //indicates whether spotify login has been initiated
            energy: 0,                    //energy level of playlist, changes with user inputs
            songCounter: 0,
            artist: 'rick astley',
            song: 'never going to give you up',
            albumArt: 'http://static.tumblr.com/qmraazf/ps5mjrmim/unknown-album.png',
            songUrl: ""
        };
    };

    changeEnergy (change) {        //using clicks on component 'Button', this increases or decreases energy level of playlist
        this.setState(Object.assign({}, this.state , {energy: this.state.energy + change}));
        console.log(this.state.energy)
    };

    queueSong (song) {
        console.log(song);
        exportedSpotifyData.songs.splice(this.state.songCounter +1, 0,
        {name: song, artist: "", albumArt: 'http://static.tumblr.com/qmraazf/ps5mjrmim/unknown-album.png'})
    };

    nextSong () {    // next song is trigged by a setTimout, so it runs every minute
            var thisCount = this.state.songCounter + 1
            this.setState(Object.assign({}, this.state, {
                songCounter: thisCount,
                song: exportedSpotifyData.songs[thisCount].name,
                artist: exportedSpotifyData.songs[thisCount].artist,
                albumArt: exportedSpotifyData.songs[thisCount].albumArt
            }));
            var urlPromise = GetSongUrl(this.state.song, this.state.artist);
            urlPromise.then(function (url) {
                this.setState(Object.assign({}, this.state, {songUrl: url}));
            }.bind(this));
            console.log(thisCount)
            console.log("DRINK UP!!!");
        };

    beginPH(){                     //activates with button click, will start spotify api calls and create playlist
        setInterval(this.nextSong.bind(this), 15000);
        setTimeout(this.nextSong.bind(this), 1)         // should skip first song (never gonna give you up), does not
        this.setState(Object.assign({}, this.state , {startButtonPressed: true}));
        };

    getToken () {
      var beginToken = window.location.hash.indexOf('=')
      var endToken = window.location.hash.indexOf('&')
      exports.bearerToken = window.location.hash.substr(beginToken + 1, endToken - 14)
    }

    componentWillMount () {
        this.setState(Object.assign({}, this.state, {songUrl: GetSongUrl("never going to give you up", "rick astely ")
        }));
    }

    render() {
        if (this.state.startButtonPressed) {       // renders player and energy buttons if button is pressed
            return (
                <div id="background">
                    <div className="page">
                      <div className="shadow">
                        <h1>PowerHour</h1>
                        <Timer />
                      </div>
                        <Player artist={this.state.artist} song={this.state.song} url={this.state.songUrl} albumArt={this.state.albumArt}/><br />
                        <div className='buttons'>
                            <Button onClick={this.changeEnergy.bind(this)} value="turn up" change={1}/>
                            <Button onClick={this.changeEnergy.bind(this)} value="chill out" change={-1}/>
                        </div>
                        <Queue onChange={this.queueSong.bind(this)}/>

                    </div>
                </div>
            )
        }
         if (window.location.hash !== ''){                             // only renders start button if not
            this.getToken()
            retrieveData()
            return (
                <div id="background">
                    <div className="page">
                      <div className="shadow">
                      <h1>PowerHour</h1>
                      <Start onClick={this.beginPH.bind(this)}/>
                      </div>
                    </div>
                </div>
            );
        };
        if (window.location.hash == '') {
           return (
             <div id = "background">
               <div className = "notPage">
                  <a href = 'https://accounts.spotify.com/en/authorize?client_id=66f2f11387dc4b4abf5505a9cd4873c2&redirect_uri=http://localhost:3000&scope=playlist-read-private%20user-library-read&response_type=token'>
                    <img id = 'sImage' src = {spotifylogin} width = "100" height = '100' />
                  </a>
               </div>
             </div>
          )
        }
    };
};

export default Main;
// skip first song, factor in energy for filter
// make turn up and chill out buttons work
