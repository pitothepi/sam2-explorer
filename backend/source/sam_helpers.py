import torch
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor
import io


if torch.cuda.get_device_properties(0).major >= 8:
    # turn on tfloat32 for Ampere GPUs (https://pytorch.org/docs/stable/notes/cuda.html#tensorfloat-32-tf32-on-ampere-devices)
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True

# direct from facebook demo
def show_mask(mask, ax, random_color=False, borders = True):
    if random_color:
        color = np.concatenate([np.random.random(3), np.array([0.6])], axis=0)
    else:
        color = np.array([30/255, 144/255, 255/255, 0.6])
    h, w = mask.shape[-2:]
    mask = mask.astype(np.uint8)
    mask_image =  mask.reshape(h, w, 1) * color.reshape(1, 1, -1)
    if borders:
        import cv2
        contours, _ = cv2.findContours(mask,cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE) 
        # Try to smooth contours
        contours = [cv2.approxPolyDP(contour, epsilon=0.01, closed=True) for contour in contours]
        mask_image = cv2.drawContours(mask_image, contours, -1, (1, 1, 1, 0.5), thickness=2) 
    ax.imshow(mask_image)

# direct from facebook demo
def show_points(coords, labels, ax, marker_size=375):
    pos_points = coords[labels==1]
    neg_points = coords[labels==0]
    ax.scatter(pos_points[:, 0], pos_points[:, 1], color='green', marker='*', s=marker_size, edgecolor='white', linewidth=1.25)
    ax.scatter(neg_points[:, 0], neg_points[:, 1], color='red', marker='*', s=marker_size, edgecolor='white', linewidth=1.25)   

# direct from facebook demo
def show_box(box, ax):
    x0, y0 = box[0], box[1]
    w, h = box[2] - box[0], box[3] - box[1]
    ax.add_patch(plt.Rectangle((x0, y0), w, h, edgecolor='green', facecolor=(0, 0, 0, 0), lw=2))


# adapted from facebook's demo code
# draws the masks and points onto an array of PIL images
def draw_masks(image, masks, scores, image_format, point_coords=None, box_coords=None, input_labels=None, borders=True):
    figs = []

    # Get the dimensions of the input image
    height, width = image.shape[:2]
    # configurable to make stuff look good
    dpi = 96

    for i, (mask, score) in enumerate(zip(masks, scores)):
        fig, ax = plt.subplots(figsize=(width/dpi, height/dpi), dpi=dpi)

        # want axis to fill entire figure
        ax.set_position([0,0,1,1])

        ax.imshow(image)
        show_mask(mask, ax, borders=borders)

        # if point_coords is not None:
        #     assert input_labels is not None
        #     show_points(point_coords, input_labels, plt.gca())

        if box_coords is not None:
            show_box(box_coords, plt.gca())

        if len(scores) > 1:
            plt.title(f"Mask {i+1}, Score: {score:.3f}", fontsize=18)

        plt.axis('off')
        
        # Save the figure to a bytes buffer
        buf = io.BytesIO()
        fig.savefig(buf, format=image_format, bbox_inches='tight', pad_inches=0)
        buf.seek(0)
        
        # Convert the bytes buffer to a PIL Image
        img = Image.open(buf)
        figs.append(img)
        
        # Close the figure to free up memory
        plt.close(fig)
    
    return figs


# return a list of images with segmentation masks drawn on them 
# format both ways is PIL Image object
# point arguments should be lists of lists [[x,y],[x.y]]
def segment_single_image(image, positivePoints, negativePoints, image_format, multimask=False):
    numpy_image = np.array(image.convert("RGB"))

    sam2_checkpoint = "/cachedRepos/segment-anything-2/checkpoints/sam2_hiera_large.pt"
    model_cfg = "sam2_hiera_l.yaml"

    sam2_model = build_sam2(model_cfg, sam2_checkpoint, device="cuda")

    predictor = SAM2ImagePredictor(sam2_model)

    predictor.set_image(numpy_image)

    point_coords = np.array(positivePoints + negativePoints)
    point_labels = np.array([1] * len(positivePoints) + [0] * len(negativePoints))

    masks, scores, logits = predictor.predict(
        point_coords = point_coords,
        point_labels = point_labels,
        multimask_output = multimask
    )

    return draw_masks(numpy_image, masks, scores, point_coords=point_coords, input_labels=point_labels, borders=True, image_format=image_format)