import React, { Component } from 'react';
import { GetSongUrl } from '../GetSongUrl.js';
import '../styling/player.css';

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
];

var songCounter = 0;  //keeps track of index of song we're playing

class Player extends Component {
    constructor(props) {
        super(props);
        this.state = {   // the state updates to the song playing, so needs the URL, the song, and the artist
            songUrl: [],
            song: [],
            artist: []
        };
    };
    componentWillMount() {    //the spotify data will run before the component mounts
        console.log("launch spotify queries");
        return SpotifyData;
    };

    componentDidMount(data) {
        var song = SpotifyData[songCounter].name;
        var artist = SpotifyData[songCounter].artist;
        var urlPromise = GetSongUrl(song, artist);   // fetches song URL using imported function
        urlPromise.then(function (url) {
            this.setState({
                songUrl: url,
                song: song,
                artist: artist
            });
            console.log(this.state.songUrl);
        }.bind(this));
    };

        nextSong () {    // next song is trigged by a setTimout, so it runs every minute
            songCounter += 1;
            var song = SpotifyData[songCounter].name;
            var artist = SpotifyData[songCounter].artist;
            var urlPromise = GetSongUrl(song, artist);
            urlPromise.then(function (url) {
                this.setState({
                    songUrl: url,
                    song: song,
                    artist: artist
                });
            }.bind(this));
        };

        render(){
            setTimeout(this.nextSong.bind(this), 60000);
            return (
                    <div className="playbox-border">
                        <div className="playbox" width="50%" height="30px">
                            <div className="nowplaying"><b><u>Now playing</u> :</b>
                            </div>
                            <div className="song-details"> {this.state.song} by  {this.state.artist}
                                <iframe allowFullScreen="" frameBorder="0" height="1" src={this.state.songUrl} width="1"></iframe>
                            </div>
                        </div>
                    </div>
            )
        }
    };


export default Player;
