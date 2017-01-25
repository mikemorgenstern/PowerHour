import React, { Component } from 'react';
import '../styling/player.css';

class Player extends Component {

        render(){

            return (
                    <div className="playbox-border">
                        <div className="playbox" width="50%" height="30px">
                            <div className="nowplaying">
                              <img src = {this.props.albumArt}/>
                            </div>
                            <div className = "song-details"> {this.props.song} <br/> <div className ="grey">{this.props.artist}</div>
                                <iframe allowFullScreen="" frameBorder="0" height="0" src={this.props.url} width="200"></iframe>
                            </div>
                            <div className = "energy-display"><h4>Energy: {Math.round(20*this.props.energy)} / 20</h4></div>
                        </div>
                    </div>
            )
        }
    };

export default Player;
