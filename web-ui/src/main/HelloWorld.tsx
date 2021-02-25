import React from "react";
// @ts-ignore
import axios from "axios"

interface State {
    message: string,
    time: string
}

class HelloWorld extends React.Component<object, State> {
    constructor(props: object) {
        super(props);
        this.state = {
            message: "loading",
            time: "",
        };
        this.requestState();
    }

    requestState = () => {
        axios.get('/rest/api/v1/helloWorld/')
            .then(response => {
                if (response.status == 200) {
                    this.setState({
                        message: response.data.message,
                        time: response.data.time.toString(),
                    });
                } else {
                    console.log(response.status, response.statusText);
                }
            }).catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <h1>Message: {this.state.message}</h1>
                <h1>Time: {this.state.time}</h1>
            </div>
        );
    }
}

export default HelloWorld;
