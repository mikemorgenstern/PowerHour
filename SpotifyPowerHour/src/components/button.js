import React, { Component } from 'react';
import '../styling/button.css';


class Button extends Component {

    
   changeEnergy () {
        this.props.onClick(this.props.change);
    }

    render() {
        return (
            <button className="myButton" onClick={this.changeEnergy.bind(this)}>
                {this.props.value}
            </button>
        )
    };
};

export default Button;