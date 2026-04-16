import os
from PIL import Image

source_dir = "ezgif-38211703915cee03-jpg"
target_dir = "assets/hero_scroll"
if not os.path.exists(target_dir):
    os.makedirs(target_dir)

total_frames = 240
target_frame_count = 30
step = total_frames // target_frame_count

for i in range(1, target_frame_count + 1):
    frame_index = (i - 1) * step + 1 
    if frame_index > total_frames:
        frame_index = total_frames
        
    filename = f"ezgif-frame-{frame_index:03d}.jpg"
    path = os.path.join(source_dir, filename)
    
    if os.path.exists(path):
        img = Image.open(path)
        # Resize to max 1920 width to save space if it's larger
        width, height = img.size
        # To maintain high quality we save as JPG, optimizing it slightly.
        if width > 1920:
            new_height = int((1920 / width) * height)
            img = img.resize((1920, new_height), Image.Resampling.LANCZOS)
        
        target_path = os.path.join(target_dir, f"frame_{i:03d}.jpg")
        img.save(target_path, "JPEG", quality=85, optimize=True)
        print(f"Saved {target_path}")
    else:
        print(f"File not found: {path}")

print("Done converting frames.")
