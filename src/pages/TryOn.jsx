import React, { useState, useRef, useEffect } from "react";
import Moveable from "react-moveable";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import html2canvas from "html2canvas";

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
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [message, setMessage] = useState("");


  const imageRef = useRef(null);
  const overlayRef = useRef(null);
  const webcamRef = useRef(null);

  // ✅ Load models once on mount
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(`${MODEL_URL}/tiny_face_detector`),
          faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`),
        ]);
        console.log("✅ Models loaded");
        setModelsLoaded(true);
      } catch (error) {
        console.error("❌ Model loading failed:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      overlayRef.current &&
      !overlayRef.current.contains(event.target)
    ) {
      setTarget(null); // 👈 deselect the hairstyle
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  // ✅ Run face detection
  const runDetection = async (element) => {
  if (!modelsLoaded || !element) return;

  setIsDetecting(true); // Start loading spinner

  try {
    const detection = await faceapi
      .detectSingleFace(element, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (detection) {
      const landmarks = detection.landmarks.positions;
      const leftEye = landmarks[36];   // outer left eye corner
      const rightEye = landmarks[45];  // outer right eye corner
      const nose = landmarks[27];      // nose bridge top

      const centerX = (leftEye.x + rightEye.x) / 2;
      const centerY = nose.y - 60;

      const eyeDistance = rightEye.x - leftEye.x;
      const scale = 2.2; // multiplier to scale hair based on eye distance

      const hairWidth = eyeDistance * scale;
      const hairHeight = hairWidth * 0.8; // Keep natural ratio

      // Update position
      setOverlayPosition({
        left: centerX - hairWidth / 2,
        top: centerY - hairHeight / 2,
      });

      // Update size via inline style
      if (overlayRef.current) {
        overlayRef.current.style.width = `${hairWidth}px`;
        overlayRef.current.style.height = `${hairHeight}px`;
      }

      setMessage("✅ Hairstyle aligned!");
    } else {
      console.warn("⚠️ No face detected.");
      setMessage("⚠️ No face detected.");
    }
  } catch (error) {
    console.error("❌ Detection error:", error);
    setMessage("❌ Error detecting face.");
  }

  setIsDetecting(false); // Stop spinner
};


  // 📸 Upload image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgURL = URL.createObjectURL(file);
    setSelectedImage(imgURL);
    setUseWebcam(false);
    setStatusMessage("📷 Image uploaded. Detecting...");
  };

  // 📷 Capture from webcam
  const capturePhoto = () => {
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    setSelectedImage(screenshot);
    setUseWebcam(false);
    setStatusMessage("📷 Photo captured. Detecting...");
  };

  const handleDownload = () => {
  const preview = document.querySelector(".preview");

  if (!preview) return;

  // ✅ Temporarily hide the moveable frame
  const moveableFrame = document.querySelector(".moveable-control-box");
  if (moveableFrame) moveableFrame.style.display = "none";

  html2canvas(preview, { useCORS: true }).then((canvas) => {
    const link = document.createElement("a");
    link.download = "hairstyle-look.png";
    link.href = canvas.toDataURL("image/png");
    link.click();

    // ✅ Restore the moveable frame
    if (moveableFrame) moveableFrame.style.display = "block";
  });
};


  return (
    <div className="tryon-container">
      <h2>Try On a New Hairstyle</h2>

      <div className="action-buttons">
        <button onClick={() => setUseWebcam(true)}>Use Webcam</button>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {selectedImage && (
          <button onClick={handleDownload}>📥 Download Look</button>
        )}
      </div>

      {statusMessage && (
        <div className="status-message">
          {isDetecting ? (
            <div className="spinner" /> // Add spinner CSS
          ) : null}
          <p>{statusMessage}</p>
        </div>
      )}

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
        {isDetecting && <div className="loading">🔄 Aligning hairstyle to your face...</div>}
{message && <div className="status-message">{message}</div>}
          <div className="preview">
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Your face"
              className="base-face"
              crossOrigin="anonymous"
              onLoad={() => runDetection(imageRef.current)}
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
