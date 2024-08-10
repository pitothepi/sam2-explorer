from flask import Flask, request, send_file
from flask_cors import CORS
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

@app.route('/process_image', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return 'No image file found', 400

    file = request.files['image']
    img = Image.open(file.stream)

    # Process the image (example: convert to grayscale)
    processed_img = img.convert('L')

    # Save the processed image to a bytes buffer
    img_io = io.BytesIO()
    processed_img.save(img_io, 'JPEG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/jpeg')

if __name__ == '__main__':
    app.run(debug=True)