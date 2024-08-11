from flask import Flask, request, send_file
from flask_cors import CORS
from PIL import Image
import io
import base64

app = Flask(__name__)
CORS(app)

@app.route('/segment-single-image', methods=['POST'])
def process_image():
    print("got image!")

    if 'image' not in request.form:
        return 'No image file found', 400

    imageDataURL = request.form['image']
    
    # Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
    image_data = imageDataURL.split(',')[1]
    
    # Decode the base64 string
    image_bytes = base64.b64decode(image_data)
    
    # Use PIL to open the image from the bytes data
    image = Image.open(io.BytesIO(image_bytes))

    # Process the image (example: convert to grayscale)
    processed_img = image.convert('L')

    # Save the processed image to a bytes buffer
    img_io = io.BytesIO()
    processed_img.save(img_io, 'JPEG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/jpeg')

if __name__ == '__main__':
    app.run(debug=True)