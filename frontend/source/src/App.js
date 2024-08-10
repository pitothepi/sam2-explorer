import Webcam from "react-webcam";
import {useState} from "react";

// function App() {
//   return (
//     <div className="App">
//       <p>hello</p>
//       <Webcam />
//     </div>
//   );
// }

function App() {
  const [file, setFile] = useState();
  const [cameraStream, setCameraStream] = useState(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }

  function handleCapture() {
    const canvas = document.createElement("canvas");
    const video = document.querySelector("video");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageUrl = canvas.toDataURL("image/png");
    setFile(imageUrl);
    stopCamera();
  }

  return (
    <div className="App">
      <h2>Add Image:</h2>
      {/* <input type="file" onChange={handleChange} /> */}
      <button onClick={startCamera}>Start Camera</button>
      {cameraStream && (
        <div>
          <video autoPlay playsInline ref={(ref) => (ref ? ref.srcObject = cameraStream : null)} />
          <button onClick={handleCapture}>Take Picture</button>
        </div>
      )}
      {file && <img src={file} alt="Preview" />}
    </div>
  );
}

export default App;
