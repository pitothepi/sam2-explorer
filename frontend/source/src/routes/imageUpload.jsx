import React, { useState, useRef, useEffect } from 'react';
import Switch from "react-switch";
import "./imageUpload.css"

export default function ImageUpload() {
    const [uploadedImage, setUploadedImage] = useState(null); // New state for image URL
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
            // Draw a green circle at the clicked position
            ctx.beginPath();
            ctx.arc(point[0], point[1], 10, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.fillStyle = 'red';
        for (const point of negativePoints) {
            // Draw a green circle at the clicked position
            ctx.beginPath();
            ctx.arc(point[0], point[1], 10, 0, 2 * Math.PI);
            ctx.fill();
        }
    }, [positivePoints, negativePoints]);

    //   const handleUpload = () => {
    //     const formData = new FormData();
    //     formData.append('file', selectedFile);

    //     // Replace with your API endpoint for file upload
    //     axios.post('/upload', formData)
    //       .then((response) => {
    //         console.log('File uploaded successfully:', response.data);
    //         setImageUrl(response.data.url); // Set the image URL
    //       })
    //       .catch((error) => {
    //         console.error('Error uploading file:', error);
    //       });
    //   };

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
                            <button>Segment</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};