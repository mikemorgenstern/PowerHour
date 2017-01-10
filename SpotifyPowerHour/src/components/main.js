import React, { Component } from 'react';
import '../styling/main.css';
import { GetSongUrl } from '../GetSongUrl.js';
import Start from './start.js';
import Player from './player.js';
import Button from './button.js';
import Timer from './timer.js';
import Queue from './queue.js';
import { retrieveData, exportedSpotifyData, songShuffle, energyScale, minEnergy } from '../Spotify.js';
var spotifylogin = require('../imgs/SpotifyLogin.png')
var lightningBoltImage = require('../imgs/lightningBolt.png')

// var energyScale = 0.04
// console.log(energyRange, minEnergy, maxEnergy, energyScale)  //makes sure we have numbers for scale calculation and energy level
 // songs list that will be trimmed as songs are excluded (already played or out of range)

class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            startButtonPressed: false,   //indicates whether start button is pressed, will render player if it is //indicates whether spotify login has been initiated
            energy: 0.15,                    //energy level of playlist, changes with user inputs
            songCounter: 0,
            artist: 'rick astley',
            song: 'never going to give you up',
            albumArt: 'http://static.tumblr.com/qmraazf/ps5mjrmim/unknown-album.png',
            songUrl: ""
        };
    };

    changeEnergy(change) {        //using clicks on component 'Button', this increases or decreases energy level of playlist
        if (change === 1) {
            if (this.state.energy === 20) {
            } else {
                this.setState(Object.assign({}, this.state, { energy: this.state.energy + energyScale }))
            }
        }
        if (change === -1) {
            if (this.state.energy === 0) {
            } else {
                this.setState(Object.assign({}, this.state, { energy: this.state.energy - energyScale }))
            }
        }
        console.log(this.state.energy)
    };

    queueSong(song) {
        console.log(song);
        exportedSpotifyData.songs.splice(this.state.songCounter + 1, 0,
            { name: song, artist: "", albumArt: 'http://static.tumblr.com/qmraazf/ps5mjrmim/unknown-album.png' })
    };

    nextSong() {    // next song is trigged by a setTimout, so it runs every minute
        var thisCount = this.state.songCounter + 1
        if (this.state.songCounter % 3 === 0) {
            this.setState(Object.assign({}, this.state, { energy: this.state.energy + energyScale }))
        }
        let music = exportedSpotifyData
        var availableSongs = []  //make sure assignment doesn't make music = [] here
        for (var i = 0; i < music.length; i++) {
            if (music[i].energy < this.state.energy + 2 * energyScale && music[i].energy > this.state.energy - 2 * energyScale) {
                availableSongs.push(music[i])  // add to available songs
            }
        }
        songShuffle(availableSongs)
        this.setState(Object.assign({}, this.state, {
            songCounter: thisCount,
            song: music.songs[0].name,
            artist: music.songs[0].artist,
            albumArt: music.songs[0].albumArt
        }));
        var urlPromise = GetSongUrl(this.state.song, this.state.artist);
        urlPromise.then(function (url) {
            this.setState(Object.assign({}, this.state, { songUrl: url }));
        }.bind(this));
        exportedSpotifyData.songs.splice(0, 1)
        console.log(thisCount)
        console.log("DRINK UP!!!")
        console.log(this.state.energy, availableSongs);
    };

    beginPH() {                     //activates with button click, will start spotify api calls and create playlist
        setInterval(this.nextSong.bind(this), 10000);
        setTimeout(this.nextSong.bind(this), 1)         // should skip first song (never gonna give you up), does not
        this.setState(Object.assign({}, this.state, { startButtonPressed: true}));
        console.log(this.state.energy, energyScale, minEnergy)
    };

    getToken() {
        var beginToken = window.location.hash.indexOf('=')
        var endToken = window.location.hash.indexOf('&')
        exports.bearerToken = window.location.hash.substr(beginToken + 1, endToken - 14)
    }

    componentWillMount() {
        this.setState(Object.assign({}, this.state, {
            songUrl: GetSongUrl("never going to give you up", "rick astely ")
        }));
        // var background = document.getElementById("background");   //inserts random background picture into background div
        // console.log(background)
        // background.style.backgroundImage = 'url(../imgs/'+Math.floor(Math.random() * 7).toString()+'.jpg)';
    }

    render() {
        if (this.state.startButtonPressed) {       // renders player and energy buttons if button is pressed
            if (this.state.songCounter >= 60) {
                return (
                    <div id="background">
                        <div className="page">
                            <div className="shadow">
                                <h1>PowerHour</h1>
                            </div>
                            <h5> Congratulations, you've finished PowerHour! </h5>
                            <Timer style="display: none" />
                            <Player artist={this.state.artist} song={this.state.song} url={this.state.songUrl} albumArt={this.state.albumArt} /><br />
                            <Queue onChange={this.queueSong.bind(this)} />
                        </div>
                    </div>
                )
            } else {
                return (
                    <div id="background">
                        <div className="page">
                            <div className="shadow">
                                <h1>PowerHour</h1>
                                <Timer />
                            </div>
                            <Player artist={this.state.artist} song={this.state.song} url={this.state.songUrl} albumArt={this.state.albumArt} /><br />
                            <div className='buttons'>
                                <Button onClick={this.changeEnergy.bind(this)} value="turn up" change={1} />
                                <Button onClick={this.changeEnergy.bind(this)} value="chill out" change={-1} />
                            </div>
                            <Queue onChange={this.queueSong.bind(this)} />
                        </div>
                    </div>
                )
            }
        }
        if (window.location.hash !== '' && this.state.startButtonPressed === false){ // only renders start button if not
            this.getToken()
            retrieveData()
            return (
                <div id="background">
                    <div className="page">
                        <div className="shadow">
                            <h1>PowerHour</h1>
                            <Start onClick={this.beginPH.bind(this)} />
                        </div>
                    </div>
                </div>
            );
        };
        if (window.location.hash === '') {
            return (
                <div id="background">
                    <div className="page">
                        <div className="shadow">
                            <h1>PowerHour</h1>
                        </div>
                        <div className="authorization">
                            <a href='https://accounts.spotify.com/en/authorize?client_id=66f2f11387dc4b4abf5505a9cd4873c2&redirect_uri=http://localhost:3000&scope=playlist-read-private%20user-library-read&response_type=token'>
                                <img id='sImage' src={spotifylogin} width="100" height='100' />
                            </a>
                        </div>
                    </div>
                </div>
                // add if statement for songcounter == 60, display "Congrats! You've finished PowerHour."
            )
        }
    };
};

export default Main;
// skip first song, factor in energy for filter
// make turn up and chill out buttons work
