import React, { Component } from 'react';
import '../styling/queue.css';

class Queue extends Component {

    constructor(props) {
        super(props);
        this.state = {value: ''};
        this.queue = this.queue.bind(this);
        this.logSong = this.logSong.bind(this)
    };

    logSong (e) {
        this.setState({value: e.target.value})
    };

    queue (e) {
        console.log(this.state.value)
        e.preventDefault();   //prevents redirect with new URL
        var x = document.getElementsByName("search")   //sets value back to black after search enter
            x[0].value = ''
        this.props.onChange(this.state.value)  // need to set this.state.value equal to query in form
    }; 

    render () {
        return (
            <form onSubmit={this.queue} className="searchbox">
                    <input type="search" onChange={this.logSong} name="search" placeholder="add a song...." required="required" className="search" autoComplete="off" spellCheck="false"/>
                    <input type="submit" className="submit" />
            </form>
        )
    }
};

export default Queue;