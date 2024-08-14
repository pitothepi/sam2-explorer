import React, { useState, useRef } from 'react';
import Switch from "react-switch";
import axios from "axios";
import PointSelector from "../components/pointSelector.jsx"
import "./framesUpload.css"

export default function ImageUpload() {
    const [uploadedFrames, setUploadedFrames] = useState([]);
    const [resultFrames, setResultFrames] = useState([]);
    const [positivePoints, setPositivePoints] = useState([]);
    const [negativePoints, setNegativePoints] = useState([]);
    const [positivePointMode, setPositivePointMode] = useState(true);
    const [processing, setProcessing] = useState(false);

    const firstFrameRef = useRef(null);

    // gets image from user's computer
    const handleImageUpload = (e) => {
        for (const file of e.target.files) {
            const reader = new FileReader();
            reader.onload = () => {
                setUploadedFrames(frames => [...frames, reader.result]);
            };
            reader.readAsDataURL(file);
        }
    };

    // clear the result and points
    const handleReset = () => {
        setResultFrames([]);
        setPositivePoints([]);
        setNegativePoints([]);
    };

    // helper function to make the point locations relative to the actual size of the image
    // (since the display size of the image is different from the file size, the points clicked
    // on the canvas aren't necessairly correct)
    const remapPixelCoordinates = (points) => {
        const xMultiplier = firstFrameRef.current.naturalWidth / firstFrameRef.current.width;
        const yMultiplier = firstFrameRef.current.naturalHeight / firstFrameRef.current.height;
        return points.map(point => [point[0] * xMultiplier, point[1] * yMultiplier]);
    }

    // sends the image and points to the backend for segmentation and displays the result
    const handleSegment = () => {
        setProcessing(true);
        const formData = new FormData();
        formData.append('frames', JSON.stringify(uploadedFrames));
        formData.append('positive-points', JSON.stringify(remapPixelCoordinates(positivePoints)));
        formData.append('negative-points', JSON.stringify(remapPixelCoordinates(negativePoints)));

        axios.post('http://192.168.0.102:5000/segment-frames', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then((response) => {
                console.log('File uploaded successfully.');
                setResultFrames(response.data['frames']);
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
            style={uploadedFrames.length > 0 ?
                { width: "fit-content", height: "fit-content" } :
                { width: "fit-content", height: "fit-content", minWidth: "min(640px, 70vw)" }}>

            <div className={processing ? "fastFrame" : "frame"}>

                <div className="flexColumn">

                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <input type="file" onChange={handleImageUpload} multiple="multiple"/>
                        <button
                            onClick={handleReset}
                            style={resultFrames.length > 0 || positivePoints.length > 0 || negativePoints.length > 0 ? {} : { display: "none" }}>Reset</button>
                    </div>

                    <div class="flexColumn" style={uploadedFrames.length > 0 ? {} : { display: "none" }}>

                        <div className="stacker">
                            <img src={resultFrames.length === 0 ? uploadedFrames[0] : resultFrames[0]} ref={firstFrameRef} alt="Uploaded" />
                            <PointSelector
                                positivePoints={positivePoints}
                                setPositivePoints={setPositivePoints}
                                negativePoints={negativePoints}
                                setNegativePoints={setNegativePoints}
                                positivePointMode={positivePointMode}
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

                        {uploadedFrames.length > 1 && resultFrames.length === 0 ? uploadedFrames.slice(-(uploadedFrames.length - 1)).map((frame) => {
                            return (
                                <img src={frame} alt="Uploaded"></img>
                            )
                        }) : <div />}

                        {resultFrames.length > 0 ? resultFrames.slice(-(resultFrames.length - 1)).map((frame) => {
                            return (
                                <img src={frame} alt="Uploaded"></img>
                            )
                        }) : <div />}
                    </div>
                </div>
            </div>
        </div>
    );
};