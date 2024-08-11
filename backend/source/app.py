from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import base64

app = Flask(__name__)
CORS(app)

@app.route('/segment-single-image', methods=['POST'])
def process_image():
    print("got image!", flush=True)
    print(f"form: {request.form}", flush=True)
    for field in ['image', 'positive-points', 'negative-points']:
        if field not in request.form:
            return f"field {field} not in request", 400

    # form = request.form
    print(f"positive points: {request.form['positive-points']}", flush=True)

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

    # Process the image (example: convert to grayscale)
    processed_img = image.convert('L')

    # Save the processed image to a bytes buffer
    img_io = io.BytesIO()
    processed_img.save(img_io, image_format)
    img_io.seek(0)

    return jsonify({'image': f"{image_header},{base64.b64encode(img_io.getvalue()).decode('utf-8')}"})

if __name__ == '__main__':
    app.run(debug=True)