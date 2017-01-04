import React, { Component } from 'react';
import '../styling/start.css';

var lightningBoltImage = require('../imgs/lightningBolt.png')

class Start extends Component {


    beginPowerHour () {          // when clicked, the start button activates the <Button /> component's onClick function
        this.props.onClick();
    }

    render() {      // trying to insert  <img src={require('../imgs/lightning bolt.png')} but it's not working
        return (
            <button className="myB" onClick={this.beginPowerHour.bind(this)}>
                  <img src={lightningBoltImage} alt=""/>
            </button>
        )
    };
};

export default Start;
