import React, { Component } from 'react';
import '../styling/player.css';

class Player extends Component {


/*
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
*/      
        componentWillMount () {
            console.log(this.props.url);
        }

        goNext () {
            this.props.onChange()
        }

        render(){
            setTimeout(this.goNext.bind(this), 10000)
            return (
                    <div className="playbox-border">
                        <div className="playbox" width="50%" height="30px">
                            <div className="nowplaying"><b><u>Now playing</u> :</b>
                            </div>
                            <div className="song-details"> {this.props.song} by  {this.props.artist}
                                <iframe allowFullScreen="" frameBorder="0" height="0" src={this.props.url} width="0"></iframe>
                            </div>
                        </div>
                    </div>
            )
        }
    };


export default Player;
