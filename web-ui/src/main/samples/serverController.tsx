import React, {useState} from 'react';
import * as API from "../editor/api";

function ServerController() {
  const [running, setRunning] = useState(true);
  return <button onClick={() => {
    API.shutdownServer().catch(() => setRunning(true));
    setRunning(false);
  }} disabled={!running}>Shutdown the Server</button>
}

export default ServerController;