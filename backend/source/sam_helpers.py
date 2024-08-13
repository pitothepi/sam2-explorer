import torch
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor
import io
import os


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
def draw_masks_image(image, masks, scores, imageFormat, point_coords=None, box_coords=None, input_labels=None, borders=True):
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
        fig.savefig(buf, format=imageFormat, bbox_inches='tight', pad_inches=0)
        buf.seek(0)
        
        # Convert the bytes buffer to a PIL Image
        img = Image.open(buf)
        figs.append(img)
        
        # Close the figure to free up memory
        plt.close(fig)
    
    return figs


# adapted from facebook demo
# draws the masks for all the objects on one frame
def draw_masks_video(frameSegments, frameName, videoDirectory):
    frameImage = Image.open(os.path.join(videoDirectory, frameName))
    
    # Get the dimensions of the input image
    height, width = frameImage.shape[:2]
    # configurable to make stuff look good
    dpi = 96

    # make the figure to draw on
    fig, ax = plt.subplots(figsize=(width/dpi, height/dpi), dpi=dpi)

    # determine if we need multiple colors for multiple masks
    randomColor = len(videoFrameSegments.items()) > 1

    def draw_individual_object_mask(mask, obj_id=None): # TODO: this should be merged with show_mask above
        if randomColor:
            color = np.concatenate([np.random.random(3), np.array([0.6])], axis=0)
        else:
            cmap = plt.get_cmap("tab10")
            cmap_idx = 0 if obj_id is None else obj_id
            color = np.array([*cmap(cmap_idx)[:3], 0.6])
        h, w = mask.shape[-2:]
        mask_image = mask.reshape(h, w, 1) * color.reshape(1, 1, -1)
        ax.imshow(mask_image)

    # draw the masks for all objects found in video
    for out_obj_id, out_mask in videoFrameSegments.items():
        show_mask(out_mask, plt.gca(), obj_id=out_obj_id)

    plt.axis('off')
    
    # Save the figure to a bytes buffer
    buf = io.BytesIO()
    fig.savefig(buf, format=imageFormat, bbox_inches='tight', pad_inches=0)
    buf.seek(0)
    
    # Convert the bytes buffer to a PIL Image
    img = Image.open(buf)
    
    # Close the figure to free up memory
    plt.close(fig)

    return img
    


# return a list of images with segmentation masks drawn on them 
# format both ways is PIL Image object
# point arguments should be lists of lists [[x,y],[x.y]]
def segment_single_image(image, positivePoints, negativePoints, imageFormat, multimask=False):
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

    return draw_masks_image(numpy_image, masks, scores, point_coords=point_coords, input_labels=point_labels, borders=True, imageFormat=imageFormat)


# return a list of images with segmentation masks drawn on them 
# format out is list of PIL Image object
# point arguments should be lists of lists [[x,y],[x.y]]
def segment_image_directory(framesDirectory, positivePoints, negativePoints, multimask=False):
    point_coords = np.array(positivePoints + negativePoints)
    point_labels = np.array([1] * len(positivePoints) + [0] * len(negativePoints))

    # scan all the JPEG frame names in the video directory
    frame_names = [
        p for p in os.listdir(framesDirectory)
        if os.path.splitext(p)[-1] in [".jpg", ".jpeg", ".JPG", ".JPEG"]
    ]
    frame_names.sort(key=lambda p: int(os.path.splitext(p)[0]))

    sam2_checkpoint = "/cachedRepos/segment-anything-2/checkpoints/sam2_hiera_large.pt"
    model_cfg = "sam2_hiera_l.yaml"

    predictor = build_sam2_video_predictor(model_cfg, sam2_checkpoint)

    inference_state = predictor.init_state(video_path=framesDirectory)

    ann_frame_idx = 0  # the frame index we interact with
    ann_obj_id = 1  # give a unique id to each object we interact with (it can be any integers)

    # for labels, `1` means positive click and `0` means negative click
    labels = np.array([1], np.int32)
    _, out_obj_ids, out_mask_logits = predictor.add_new_points_or_box(
        inference_state=inference_state,
        frame_idx=ann_frame_idx,
        obj_id=ann_obj_id,          # TODO: here is where I will need to add code for segmenting multiple objects
        points=point_coords,
        labels=point_labels,
    )

    # run propagation throughout the video and collect the results in a dict
    video_segments = {}  # video_segments contains the per-frame segmentation results
    for out_frame_idx, out_obj_ids, out_mask_logits in predictor.propagate_in_video(inference_state):
        video_segments[out_frame_idx] = {
            out_obj_id: (out_mask_logits[i] > 0.0).cpu().numpy()
            for i, out_obj_id in enumerate(out_obj_ids)
        }

    # render the segmentation results every frame
    resultFrames = []
    for out_frame_idx in range(0, len(frame_names), 1):
        resultFrames.append(draw_masks_video(video_segments[out_frame_idx], frame_names[out_frame_idx], framesDirectory))

    return resultFrames