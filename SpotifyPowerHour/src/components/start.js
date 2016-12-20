import React, { Component } from 'react';
import '../styling/start.css';

class Start extends Component {

    
    beginPowerHour () {
        this.props.onClick();
    }

    render() {
        return (
            <button className="myButton" onClick={this.beginPowerHour.bind(this)}>
              <img src="imgs/lightning bolt.png" alt="" />
            </button>
        )
    };
};

export default Start;