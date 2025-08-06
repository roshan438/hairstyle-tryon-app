import React, { useState, useRef, useEffect } from "react";
import Moveable from "react-moveable";
import Webcam from "react-webcam";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "./TryOn.scss";

import style1 from "../assets/hairstyles/style1.png";
import style2 from "../assets/hairstyles/style2.png";
import style3 from "../assets/hairstyles/style3.png";

const hairstyles = [
  { id: 1, name: "Style 1", src: style1 },
  { id: 2, name: "Style 2", src: style2 },
  { id: 3, name: "Style 3", src: style3 },
];

function TryOn() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(style1);
  const [target, setTarget] = useState(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });

  const overlayRef = useRef(null);
  const imageRef = useRef(null);
  const webcamRef = useRef(null);

  // Load face detection model
  const loadModelAndDetect = async (imageElement) => {
    const model = await faceLandmarksDetection.load(
      faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );
    const predictions = await model.estimateFaces({
      input: imageElement,
      returnTensors: false,
      flipHorizontal: false,
    });

    if (predictions.length > 0) {
      const keypoint = predictions[0].keypoints[10]; // forehead center
      const { x, y } = keypoint;
      setOverlayPosition({ left: x - 75, top: y - 100 }); // Adjust offset for alignment
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgURL = URL.createObjectURL(file);
    setSelectedImage(imgURL);
    setUseWebcam(false);

    // Delay to allow image to load
    setTimeout(() => {
      if (imageRef.current) {
        loadModelAndDetect(imageRef.current);
      }
    }, 500);
  };

  const capturePhoto = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setSelectedImage(screenshot);
    setUseWebcam(false);

    setTimeout(() => {
      if (imageRef.current) {
        loadModelAndDetect(imageRef.current);
      }
    }, 500);
  };

  return (
    <div className="tryon-container">
      <h2>Try On a New Hairstyle</h2>

      <div className="action-buttons">
        <button onClick={() => setUseWebcam(true)}>Use Webcam</button>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      {useWebcam && (
        <div className="webcam-box">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={300}
            height={300}
            videoConstraints={{ facingMode: "user" }}
          />
          <button onClick={capturePhoto}>📸 Capture Photo</button>
        </div>
      )}

      {selectedImage && (
        <>
          <div className="preview">
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Your face"
              className="base-face"
              crossOrigin="anonymous"
            />

            <img
              src={selectedStyle}
              alt="Hairstyle"
              className="overlay-style"
              ref={overlayRef}
              onClick={() => setTarget(overlayRef.current)}
              style={{
                top: `${overlayPosition.top}px`,
                left: `${overlayPosition.left}px`,
              }}
            />

            {target && (
              <Moveable
                target={target}
                container={null}
                draggable={true}
                resizable={true}
                keepRatio={true}
                onDrag={({ target, left, top }) => {
                  target.style.left = `${left}px`;
                  target.style.top = `${top}px`;
                }}
                onResize={({ target, width, height, drag }) => {
                  target.style.width = `${width}px`;
                  target.style.height = `${height}px`;
                  target.style.left = `${drag.left}px`;
                  target.style.top = `${drag.top}px`;
                }}
              />
            )}
          </div>

          <div className="style-options">
            {hairstyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.src)}
                className={`style-button ${selectedStyle === style.src ? "active" : ""}`}
              >
                {style.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TryOn;
