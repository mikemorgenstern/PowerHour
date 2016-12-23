import React, { Component } from 'react';
import '../styling/main.css';
import { GetSongUrl } from '../GetSongUrl.js';
import Start from './start.js';
import Player from './player.js';
import Button from './button.js';
import Timer from './timer.js';
import Queue from './queue.js';
//import SpotifyData from '../Spotify.js';


// mock data to use in player until spotify data is linked up
var SpotifyData = [
    {name: "never gonna give you up enver gonna let you down", artist: "rick astley", popularity: 50},
    {name: "coco butter kisses", artist: "chance the rapper", popularity: 80},
    {name: "otis", artist: "kanye", popularity: 60},
    {name: "everybody", artist: "backstreet boys", popularity: 40},
    {name: "gangnam style", artist: "psy", popularity: 75},
    {name: "in the air tonight", artist: "phil collins", popularity: 45},
    {name: "let it snow", artist: "michael buble", popularity: 30},
    {name: "last resort", artist: "papa roach", popularity: 50},
    {name: "never gonna give you up enver gonna let you down", artist: "rick astley", popularity: 50},
    {name: "coco butter kisses", artist: "chance the rapper", popularity: 80},
    {name: "otis", artist: "kanye", popularity: 60},
    {name: "everybody", artist: "backstreet boys", popularity: 40},
    {name: "gangnam style", artist: "psy", popularity: 75},
    {name: "in the air tonight", artist: "phil collins", popularity: 45},
    {name: "let it snow", artist: "michael buble", popularity: 30},
    {name: "last resort", artist: "papa roach", popularity: 50},
    {name: "never gonna give you up enver gonna let you down", artist: "rick astley", popularity: 50},
    {name: "coco butter kisses", artist: "chance the rapper", popularity: 80},
    {name: "otis", artist: "kanye", popularity: 60},
    {name: "everybody", artist: "backstreet boys", popularity: 40},
    {name: "gangnam style", artist: "psy", popularity: 75},
    {name: "in the air tonight", artist: "phil collins", popularity: 45},
    {name: "let it snow", artist: "michael buble", popularity: 30},
    {name: "last resort", artist: "papa roach", popularity: 50},
    {name: "never gonna give you up enver gonna let you down", artist: "rick astley", popularity: 50},
    {name: "coco butter kisses", artist: "chance the rapper", popularity: 80},
    {name: "otis", artist: "kanye", popularity: 60},
    {name: "everybody", artist: "backstreet boys", popularity: 40},
    {name: "gangnam style", artist: "psy", popularity: 75},
    {name: "in the air tonight", artist: "phil collins", popularity: 45},
    {name: "let it snow", artist: "michael buble", popularity: 30},
    {name: "last resort", artist: "papa roach", popularity: 50},
    {name: "never gonna give you up enver gonna let you down", artist: "rick astley", popularity: 50},
    {name: "coco butter kisses", artist: "chance the rapper", popularity: 80},
    {name: "otis", artist: "kanye", popularity: 60},
    {name: "everybody", artist: "backstreet boys", popularity: 40},
    {name: "gangnam style", artist: "psy", popularity: 75},
    {name: "in the air tonight", artist: "phil collins", popularity: 45},
    {name: "let it snow", artist: "michael buble", popularity: 30},
    {name: "last resort", artist: "papa roach", popularity: 50},
];

class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            buttonPressed: false,   //indicates whether start button is pressed, will render player if it is
            energy: 0,
            songCounter: 0,
            artist: SpotifyData[0].artist,
            song: SpotifyData[0].name,
            songUrl: ""            //energy level of playlist, changes with user inputs
        };
    };

    beginPH(){                     //activates with button click, will start spotify api calls and create playlist
        console.log("Spotify Authorization");
        console.log("Fetching Library...");
        this.setState(Object.assign({}, this.state , {buttonPressed: true}));
    };

    changeEnergy (change) {        //using clicks on component 'Button', this increases or decreases energy level of playlist
        this.setState(Object.assign({}, this.state , {energy: this.state.energy + change}));
        console.log(this.state.energy)
    };

    queueSong (song) {
        console.log(song);
        SpotifyData.splice(this.state.songCounter +1, 0,
        {name: song, artist: ""})
    };

    nextSong () {    // next song is trigged by a setTimout, so it runs every minute
            var thisCount = this.state.songCounter + 1
            this.setState(Object.assign({}, this.state, {
                songCounter: thisCount,
                song: SpotifyData[thisCount].name,
                artist: SpotifyData[thisCount].artist
            }));
            var urlPromise = GetSongUrl(this.state.song, this.state.artist);
            urlPromise.then(function (url) {
                this.setState(Object.assign({}, this.state, {songUrl: url}));
            }.bind(this));
            console.log("DRINK UP!!!");
        };

    componentWillMount () {
        this.setState(Object.assign({}, this.state, {songUrl: GetSongUrl(SpotifyData[this.state.songCounter].name, SpotifyData[this.state.songCounter].artist)
        }));
    }

    render() {
        if (this.state.buttonPressed) {       // renders player and energy buttons if button is pressed
            return (
                <div id="background">
                    <div className="page">
                        <h1>PowerHour</h1>
                        <Timer />
                        <Player onChange={this.nextSong.bind(this)} artist={this.state.artist} song={this.state.song} url={this.state.songUrl}/><br />
                        <div className='buttons'>
                            <Button onClick={this.changeEnergy.bind(this)} value="turn up" change={1}/>
                            <Button onClick={this.changeEnergy.bind(this)} value="chill out" change={-1}/>
                        </div>
                        <Queue onChange={this.queueSong.bind(this)}/>
                    </div>
                </div>
            )
        } else {                             // only renders start button if not
            return (
                <div id="background">
                    <div className="page">
                        <h1>PowerHour</h1>
                        <Start onClick={this.beginPH.bind(this)}/>  
                    </div>
                </div>
            );
        };
    };
};

export default Main;