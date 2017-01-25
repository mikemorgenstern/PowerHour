import React, { Component } from 'react';
import '../styling/timer.css';

var _this;

class Timer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            minute: 0,
            zero: 0,
            second: 0
        };
        this.tick = this.tick.bind(this);
        setTimeout(this.tick, 1000);
        _this = this;
    };

    tick () {
        this.setState( {
            minute: this.state.minute,
            zero: this.state.zero,
            second: this.state.second + 1
        });
        if (this.state.second === 60) { //asynchronous beware
            this.setState({
                minute: this.state.minute + 1,
                zero: 0,
                second: 0
            });
        };
        if (this.state.second >= 10) {
          this.setState({
            zero: ""
          })
        }


        setTimeout(this.tick, 1000);
    };

    componentWillMount () {

    }

    render () {
        return (
            <div className="timer">
                <div className="minute">
                {this.state.minute}:
                {this.state.zero}
                {this.state.second}
                </div>
            </div>
            
        );
    }
}

export default Timer;
