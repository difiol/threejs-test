import "./App.css";
import React, { useRef } from "react";
import ThreejsGalaxyAnimated from "./Galaxy/ThreejsGalaxyAnimated";
import { gsap, Power3 } from "gsap";

function App() {
  let textRef = useRef(null);
  let textRevealed = false;

  const revealText = () => {
    if (!textRevealed) {
      gsap.to(textRef, 5, { opacity: 0.85, ease: Power3.easeInOut });
      textRevealed = true;
    }
  };

  return (
    <div className="App">
      <div
        className="title"
        ref={(el) => {
          textRef = el;
        }}
      >
        <h1 className = "texture-text" >Galaxy</h1>
        <p className="subtitle">
          a threejs demo by{" "}
          <a href="https://www.linkedin.com/in/diego-fidalgo-oliveres-aa6b961a1/">
            Diego Fidalgo Oliveres
          </a>
        </p>
      </div>
      <ThreejsGalaxyAnimated revealText={revealText} />
    </div>
  );
}

export default App;
