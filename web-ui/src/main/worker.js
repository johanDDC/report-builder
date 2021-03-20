onmessage = event => {
    let execution = new Function(event.data[0]) // FIXME
    let result = execution();
    postMessage(result);
}