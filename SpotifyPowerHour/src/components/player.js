import React, { Component } from 'react';
import { GetSongUrl } from '../GetSongUrl.js'

var SpotifyData = [
    {name: "never gonna give you up", artist: "rick astley", popularity: 50},
    {name: "coco butter kisses", artist: "chance the rapper", popularity: 80},
    {name: "otis", artist: "kanye", popularity: 60},
    {name: "everybody", artist: "backstreet boys", popularity: 40},
    {name: "gangnam style", artist: "psy", popularity: 75},
    {name: "in the air tonight", artist: "phil collins", popularity: 45},
    {name: "let it snow", artist: "michael buble", popularity: 30},
    {name: "last resort", artist: "papa roach", popularity: 50},
]

var songCounter = 0

class Player extends Component {
    constructor(props) {
        super(props);
        this.state = {
            songUrl: [],
            song: [],
            artist: []
        }
    };
    componentWillMount() {
        console.log("launch spotify queries")
        return SpotifyData
    }
    componentDidMount(data) {
        var song = SpotifyData[songCounter].name;
        var artist = SpotifyData[songCounter].artist;
        var urlPromise = GetSongUrl(song, artist);
        urlPromise.then(function (url) {
            console.log(url)
            this.setState({
                songUrl: url,
                song: song,
                artist: artist
            });
            console.log(this.state.songUrl);
        }.bind(this))
    };

        nextSong () {
            console.log("button pushed");
            songCounter += 1
            var song = SpotifyData[songCounter].name;
            var artist = SpotifyData[songCounter].artist;
            var urlPromise = GetSongUrl(song, artist);
            urlPromise.then(function (url) {
                this.setState({
                    songUrl: url,
                    song: song,
                    artist: artist
                });
            }.bind(this))
        };

        render(){
            setTimeout(this.nextSong.bind(this), 12000)
            return (
                    <div className="playbox" width="50%" height="30px">Now playing: {this.state.song} by  {this.state.artist}
                        <br /><iframe allowFullScreen="" frameBorder="0" height="200" src={this.state.songUrl} width="300"></iframe>
                    </div>
            )
        }
    };


export default Player;
