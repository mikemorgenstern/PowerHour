import React, { Component } from 'react';
import '../styling/main.css';
import Start from './start.js';
import Player from './player.js';
import Button from './button.js';

class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            buttonPressed: false,   //indicates whether start button is pressed, will render player if it is
            energy: 0               //energy level of playlist, changes with user inpus
        };
    };

    beginPH(){                     //activates with button click, will start spotify api calls and create playlist
        console.log("Spotify Authorization");
        console.log("Fetching Library...");
        this.setState({
            buttonPressed: true,
            energy: this.state.energy
        });
    };

    changeEnergy (change) {        //using clicks on component 'Button', this increases or decreases energy level of playlist
        this.setState({
            buttonPressed: this.state.buttonPressed,
            energy: this.state.energy += change        //change is prop passed to button (1 for up, -1 for down)
        });
        console.log(this.state.energy)
    };

    render() {
        if (this.state.buttonPressed) {       // renders player and energy buttons if button is pressed
            return (
                <div id="background">
                    <div className="page">
                        <h1>PowerHour</h1>
                        <Player /><br />
                        <div className='buttons'>
                            <Button onClick={this.changeEnergy.bind(this)} value="turn up" change={1}/>
                            <Button onClick={this.changeEnergy.bind(this)} value="chill out" change={-1}/>
                        </div>
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