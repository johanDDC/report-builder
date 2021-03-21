onmessage = event => {
    let execution = new Function(event.data);
    let result = execution();
    postMessage(result);
}