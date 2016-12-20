import React, { Component } from 'react';
import '../styling/main.css';
import Start from './start.js';
import Player from './player.js';

class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            buttonPressed: false
        }
        
    };

    beginPH(){
        console.log("Spotify Authorization");
        console.log("Fetching Library...")
        this.setState({
            buttonPressed: true
        })
    }

    render() {
        if (this.state.buttonPressed) {
            return (
                <div id="background">
                    <div className="page">
                        <h1>PowerHour</h1>
                        <Player />
                    </div>
                </div>
            )
        } else {
            return (
                <div id="background">
                    <div className="page">
                        <h1>PowerHour</h1>
                        <Start onClick={this.beginPH.bind(this)}/>
                    </div>
                </div>
            )
        };
    };
};

export default Main;