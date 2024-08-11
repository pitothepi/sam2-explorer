import React, { useState, useRef, useEffect } from 'react';
import Switch from "react-switch";
import axios from "axios";
import "./imageUpload.css"

export default function ImageUpload() {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [positivePoints, setPositivePoints] = useState([]);
    const [negativePoints, setNegativePoints] = useState([]);
    const [positivePointMode, setPositivePointMode] = useState(true);

    const canvasRef = useRef(null);
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

    // handles user setting a point on the canvas
    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Save the circle coordinates
        if (positivePointMode) {
            setPositivePoints(points => [...points, [x, y]]);
        } else {
            setNegativePoints(points => [...points, [x, y]]);
        }
    };

    // redraws canvas whenever points change
    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = canvas.getBoundingClientRect().width;
        canvas.height = canvas.getBoundingClientRect().height;

        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'green';
        for (const point of positivePoints) {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 10, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.fillStyle = 'red';
        for (const point of negativePoints) {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 10, 0, 2 * Math.PI);
            ctx.fill();
        }
    }, [positivePoints, negativePoints]);

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
                setUploadedImage(response.data['image']);
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
            });
    };

    return (
        <div className="centeredBox"
            style={uploadedImage ?
                { width: "fit-content", height: "fit-content" } :
                { width: "fit-content", height: "fit-content", minWidth: "640px" }}>
            <div className="frame">
                <div className="flexColumn">
                    <div style={{ width: "100%" }}>
                        <input type="file" onChange={handleImageUpload} />
                    </div>
                    <div class="flexColumn" style={uploadedImage ? {} : { display: "none" }}>
                        <div className="stacker">
                            <img src={uploadedImage} ref={imageRef} alt="Uploaded" />
                            <canvas ref={canvasRef} onClick={handleCanvasClick}></canvas>
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