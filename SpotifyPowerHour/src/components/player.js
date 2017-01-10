import React, { Component } from 'react';
import '../styling/player.css';

class Player extends Component {

        render(){

            return (
                    <div className="playbox-border">
                        <div className="playbox" width="50%" height="30px">
                            <div className="nowplaying">
                              <img src = {this.props.albumArt} id="sImage"/>
                            </div>
                            <div className = "song-details"> {this.props.song} <br/> <div className ="grey">{this.props.artist}</div>
                                <iframe allowFullScreen="" frameBorder="0" height="0" src={this.props.url} width="200"></iframe>
                            </div>
                        </div>
                    </div>
            )
        }
    };

export default Player;
