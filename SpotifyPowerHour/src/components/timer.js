import React, { Component } from 'react';
import '../styling/timer.css';

var _this;

class Timer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            minute: 0,
            second: 0
        };
        this.tick = this.tick.bind(this);
        setTimeout(this.tick, 1000);
        _this = this;
    };

    tick () {
        this.setState( {
            minute: this.state.minute,
            second: this.state.second + 1
        });
        if (this.state.second === 60) { //asynchronous beware
            this.setState({
                minute: this.state.minute + 1,
                second: 0
            });
        };
        setTimeout(this.tick, 1000);        
    };

    componentWillMount () {
          
    }

    render () {
        return (
            <div className="timer">
                <div className="minute">
                {this.state.minute} :
                </div>
                <div className="second">
                {this.state.second}
                </div>
            </div>
        );
    }
}

export default Timer;
