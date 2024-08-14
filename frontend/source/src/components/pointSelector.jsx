import React, { useRef, useEffect } from 'react';

export default function PointSelector({positivePoints, setPositivePoints, negativePoints, setNegativePoints, positivePointMode}) {
    const canvasRef = useRef(null);

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
            ctx.arc(point[0], point[1], 2.5, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.fillStyle = 'red';
        for (const point of negativePoints) {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 2.5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }, [positivePoints, negativePoints]);

    return (
        <canvas className = "pointSelector" ref = {canvasRef} onClick = {handleCanvasClick}></canvas>
    );
}