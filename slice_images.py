import cv2
import numpy as np
import os
from PIL import Image
import math

def slice_board(image_path, num_tiles, expected_rows, expected_cols_list, start_idx):
    img = cv2.imread(image_path)
    # The header and footer are roughly 10% of the image at top and bottom.
    h, w = img.shape[:2]
    
    # We crop the image to remove the top header and bottom footer
    # Estimate header is top 12%, footer is bottom 10%
    roi = img[int(h*0.1):int(h*0.9), :]
    
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    # Thresholding. The background is black/dark blue. Tiles are images with brighter content.
    _, thresh = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY)
    
    # Morphological operations to close gaps in images
    kernel = np.ones((15, 15), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    tiles = []
    min_area = (w * h) / (sum(expected_cols_list) * expected_rows * 2) # Rough minimum size
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        if bw * bh > min_area:
            # map y back to original image
            tiles.append((x, y + int(h*0.1), bw, bh))
            
    # Sort tiles
    tiles.sort(key=lambda b: b[1])
    
    rows = []
    current_row = []
    last_y = -1000
    for t in tiles:
        if abs(t[1] - last_y) > 50 and last_y != -1000:
            current_row.sort(key=lambda b: b[0])
            rows.append(current_row)
            current_row = []
        current_row.append(t)
        last_y = t[1]
    if current_row:
        current_row.sort(key=lambda b: b[0])
        rows.append(current_row)
        
    print(f"Board {image_path}: Found {len(rows)} rows. Total tiles: {sum(len(r) for r in rows)}. Expected {num_tiles}.")
    
    if sum(len(r) for r in rows) != num_tiles:
        print("Fallback to naive grid slicing.")
        # Fallback if detection fails
        rows = []
        roi_h = int(h*0.9) - int(h*0.12)
        row_h = roi_h // expected_rows
        for r_idx in range(expected_rows):
            cols_in_row = expected_cols_list[r_idx]
            col_w = w // cols_in_row
            current_row = []
            for c_idx in range(cols_in_row):
                # Add margin heuristics
                bx = c_idx * col_w + 10
                by = int(h*0.12) + r_idx * row_h + 10
                bw = col_w - 20
                bh = row_h - 20
                current_row.append((bx, by, bw, bh))
            rows.append(current_row)

    os.makedirs('public/round2', exist_ok=True)
    
    idx = start_idx
    for row in rows:
        for (x, y, bw, bh) in row:
            # Crop bottom 15% for the caption strip
            crop_h = int(bh * 0.85)
            cropped = img[y:y+crop_h, x:x+bw]
            
            out_path = f'public/round2/q{idx:02d}.webp'
            cv2.imwrite(out_path, cropped, [cv2.IMWRITE_WEBP_QUALITY, 90])
            print(f"Saved {out_path}")
            idx += 1
            
    return idx

idx = 1
idx = slice_board('board1.png', 6, 2, [3, 3], idx)
idx = slice_board('board2.png', 14, 3, [4, 5, 5], idx)

# Create contact sheet
images = [Image.open(f'public/round2/q{i:02d}.webp') for i in range(1, 21)]
w, h = images[0].size
cols = 5
rows = math.ceil(len(images) / cols)
contact_sheet = Image.new('RGB', (cols * w, rows * h), (0, 0, 0))

from PIL import ImageDraw
for i, img in enumerate(images):
    row = i // cols
    col = i % cols
    img = img.resize((w, h)) # force same size for contact sheet
    contact_sheet.paste(img, (col * w, row * h))
    draw = ImageDraw.Draw(contact_sheet)
    draw.text((col * w + 10, row * h + 10), f"Q{i+1:02d}", fill=(255, 255, 255))

contact_sheet.save('public/round2/_contact_sheet.png')
print("Contact sheet created.")
