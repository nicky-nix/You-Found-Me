import os
from PIL import Image

TILE_SIZE = 32
TILE_COLORS = [
    (0x1a, 0x3d, 0x52),  # 0: Deep water
    (0x3d, 0x6b, 0x35),  # 1: Overgrown grass
    (0x1e, 0x3d, 0x17),  # 2: Dense forest wall
    (0x5a, 0x8f, 0x45),  # 3: Wildflowers
    (0x9a, 0x8a, 0x6a),  # 4: Dirt path / Sand
    (0x6b, 0x5a, 0x45),  # 5: Ruins floor
    (0x84, 0x5e, 0x3a),  # 6: Wooden Bridge
]

img_width = len(TILE_COLORS) * TILE_SIZE
img = Image.new("RGB", (img_width, TILE_SIZE))

for i, color in enumerate(TILE_COLORS):
    tile = Image.new("RGB", (TILE_SIZE, TILE_SIZE), color)
    img.paste(tile, (i * TILE_SIZE, 0))

img.save("tileset_colors.png")
print("Success! 'tileset_colors.png' generated cleanly using Python.")