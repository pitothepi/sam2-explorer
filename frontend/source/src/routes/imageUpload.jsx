import React, { useState, useRef } from 'react';
import Switch from "react-switch";
import axios from "axios";
import PointSelector from "../components/pointSelector.jsx"
import "./imageUpload.css"

export default function ImageUpload() {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    const [positivePoints, setPositivePoints] = useState([]);
    const [negativePoints, setNegativePoints] = useState([]);
    const [positivePointMode, setPositivePointMode] = useState(true);
    const [processing, setProcessing] = useState(false);

    const imageRef = useRef(null);

    // gets image from user's computer
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setUploadedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // clear the result and points
    const handleReset = () => {
        setResultImage(null);
        setPositivePoints([]);
        setNegativePoints([]);
    };

    // helper function to make the point locations relative to the actual size of the image
    // (since the display size of the image is different from the file size, the points clicked
    // on the canvas aren't necessairly correct)
    const remapPixelCoordinates = (points) => {
        const xMultiplier = imageRef.current.naturalWidth / imageRef.current.width;
        const yMultiplier = imageRef.current.naturalHeight / imageRef.current.height;
        return points.map( point => [ point[0] * xMultiplier, point[1] * yMultiplier ] );
    }

    // sends the image and points to the backend for segmentation and displays the result
    const handleSegment = () => {
        setProcessing(true);
        const formData = new FormData();
        formData.append('image', uploadedImage);
        formData.append('positive-points', JSON.stringify(remapPixelCoordinates(positivePoints)));
        formData.append('negative-points', JSON.stringify(remapPixelCoordinates(negativePoints)));

        axios.post('http://192.168.0.102:5000/segment-single-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then((response) => {
                console.log('File uploaded successfully.');
                setResultImage(response.data['image']);
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
            })
            .finally(() => {
                setProcessing(false);
            });
    };

    return (
        <div className="centeredBox"
            style={uploadedImage ?
                { width: "fit-content", height: "fit-content" } :
                { width: "fit-content", height: "fit-content", minWidth: "min(640px, 70vw)" }}>
            <div className={processing ? "fastFrame" : "frame"}>
                <div className="flexColumn">
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <input type="file" onChange={handleImageUpload} />
                        <button 
                        onClick={handleReset} 
                        style={resultImage || positivePoints.length > 0 || negativePoints.length > 0 ? {} : { display: "none" }}>Reset</button>
                    </div>
                    <div class="flexColumn" style={uploadedImage ? {} : { display: "none" }}>
                        <div className="stacker">
                            <img src={resultImage ? resultImage : uploadedImage} ref={imageRef} alt="Uploaded" />
                            <PointSelector 
                                positivePoints = {positivePoints}
                                setPositivePoints = {setPositivePoints}
                                negativePoints = {negativePoints}
                                setNegativePoints = {setNegativePoints}
                                positivePointMode = {positivePointMode}
                            />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <div className="flexRow" style={{ alignContent: "baseline" }}>
                                <p>negative point</p>
                                <Switch
                                    checked={positivePointMode}
                                    onChange={(checked) => setPositivePointMode(checked)}
                                    offColor='#ff0000'
                                    onColor='#008000'
                                    uncheckedIcon={false}
                                    checkedIcon={false}
                                ></Switch>
                                <p>positive point</p>
                            </div>
                            <button onClick={handleSegment}>Segment</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};