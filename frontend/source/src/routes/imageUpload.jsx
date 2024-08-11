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

    const handleSegment = () => {
        const formData = new FormData();
        formData.append('image', uploadedImage);

        axios.post('http://192.168.0.102:5000/segment-single-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            responseType: 'arraybuffer'
        })
            .then((response) => {
                console.log('File uploaded successfully:', response.data);
                // convert base64 image representation to proper data url
                const base64 = btoa(
                    new Uint8Array(response.data).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        '',
                    ),
                );
                setUploadedImage(`data:image/jpeg;base64,${base64}`);
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
                            <img src={uploadedImage} alt="Uploaded" />
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