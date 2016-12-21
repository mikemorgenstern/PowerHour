import React, { Component } from 'react';
import '../styling/start.css';


class Start extends Component {

    
    beginPowerHour () {          // when clicked, the start button activates the <Button /> component's onClick function
        this.props.onClick();
    }

    render() {      // trying to insert  <img src={require('../imgs/lightning bolt.png')} but it's not working
        return (
            <button className="myButton" onClick={this.beginPowerHour.bind(this)}>
                  start
            </button>
        )
    };
};

export default Start;