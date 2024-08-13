from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import base64
import json

import sam_helpers

app = Flask(__name__)
CORS(app)

@app.route('/segment-single-image', methods=['POST'])
def process_image():
    print("got image!", flush=True)

    for field in ['image', 'positive-points', 'negative-points']:
        if field not in request.form:
            return f"field {field} not in request", 400

    imageDataURL = request.form['image']
    
    # split up the data url (which looks like "data:image/jpeg;base64,XXXXX")
    image_header = imageDataURL.split(',')[0]
    image_data = imageDataURL.split(',')[1]
    image_format = image_header.split('/')[-1].split(';')[0]
    print(f"image header: {image_header}", flush=True)
    print(f"image format: {image_format}", flush=True)
    
    # Decode the base64 string
    image_bytes = base64.b64decode(image_data)
    
    # Use PIL to open the image from the bytes data
    image = Image.open(io.BytesIO(image_bytes))

    # get the points
    positive_points = json.loads(request.form['positive-points'])
    negative_points = json.loads(request.form['negative-points'])

    # segment the image
    segmented_images = sam_helpers.segment_single_image(image, positive_points, negative_points, imageFormat = image_format)

    # Save the segmented image to a bytes buffer
    img_io = io.BytesIO()
    segmented_images[0].save(img_io, image_format)
    img_io.seek(0)
    
    return jsonify({'image': f"{image_header},{base64.b64encode(img_io.getvalue()).decode('utf-8')}"})

if __name__ == '__main__':
    app.run(debug=True)