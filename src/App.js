import "./App.css";
import React from "react";
import ThreejsGalaxy from "./Galaxy/ThreejsGalaxy";
import ThreejsSea from "./ThreejsSea";
import ThreejsGalaxyAnimated from "./Galaxy/ThreejsGalaxyAnimated";

function App() {
  return (
    <div className="App">
      {/* <ThreejsGalaxy/> */}
      <ThreejsGalaxyAnimated />
      {/* <ThreejsSea/> */}
    </div>
  );
}

export default App;
