"""
=============================================================================
MASTER 6-VIEW COMPOSITE REFERENCE SHEET GENERATOR: PIECE 04 OAK-BARK OUTSOLE
Faithfully recreates the 6-panel layout of user reference media_1789403054862.jpg
with high-resolution Cycles photorealistic renders and corrected Top View.
=============================================================================
"""

import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.abspath("luxury-shoe-001")
RENDERS_DIR = os.path.join(BASE_DIR, "renders", "pieces", "outsole")
OUTPUT_PATH = os.path.join(RENDERS_DIR, "Piece_04_Outsole_6_View_Reference_Sheet.jpg")
WEB_OUTPUT_PATH = os.path.join(BASE_DIR, "web", "public", "pieces", "outsole", "Piece_04_Outsole_6_View_Reference_Sheet.jpg")
ARTIFACT_PATH = r"C:\Users\doyen\.gemini\antigravity\brain\2ed145f7-63b4-4eb7-ae5d-17c50948cbc7\Piece_04_Outsole_6_View_Reference_Sheet.jpg"

def generate_reference_sheet():
    # 6 Panels
    panels = [
        # (Filename, Title, Subtitle, col, row)
        ("Outsole_Piece_04_Top_View.jpg", "TOP VIEW", "Foot-facing side (insole side)", 0, 0),
        ("Outsole_Piece_04_Bottom_View.jpg", "BOTTOM VIEW", "Ground-facing side (outsole side)", 1, 0),
        ("Outsole_Piece_04_Left_Lateral_View.jpg", "LEFT VIEW", "Lateral side profile", 2, 0),
        ("Outsole_Piece_04_Right_Medial_View.jpg", "RIGHT VIEW", "Medial side profile", 0, 1),
        ("Outsole_Piece_04_Front_Toe_View.jpg", "FRONT VIEW", "Toe end view", 1, 1),
        ("Outsole_Piece_04_Back_Heel_View.jpg", "BACK VIEW", "Heel end view", 2, 1),
    ]

    # Total Canvas: 2400 x 1600
    canvas_w = 2400
    canvas_h = 1600
    header_h = 130
    footer_h = 20

    # Background color matching studio environment: (210, 208, 204)
    bg_color = (210, 208, 204)
    canvas = Image.new("RGB", (canvas_w, canvas_h), bg_color)
    draw = ImageDraw.Draw(canvas)

    # Grid calculations
    cols = 3
    rows = 2
    grid_w = canvas_w
    grid_h = canvas_h - header_h - footer_h

    cell_w = grid_w // cols
    cell_h = grid_h // rows

    # Fonts: Classical luxury serif matching reference image
    try:
        font_main_title = ImageFont.truetype("georgia.ttf", 36)
        font_sub_title = ImageFont.truetype("georgia.ttf", 17)
        font_panel_title = ImageFont.truetype("georgia.ttf", 22)
        font_panel_sub = ImageFont.truetype("georgia.ttf", 16)
    except:
        font_main_title = ImageFont.load_default()
        font_sub_title = ImageFont.load_default()
        font_panel_title = ImageFont.load_default()
        font_panel_sub = ImageFont.load_default()

    # Draw Master Header
    title_text = "OAK-BARK OUTSOLE"
    sub_text = "FULL-LENGTH LEATHER SOLE WITH FIDDLEBACK WAIST SPINE"

    t_bbox = draw.textbbox((0, 0), title_text, font=font_main_title)
    t_w = t_bbox[2] - t_bbox[0]
    draw.text(((canvas_w - t_w) // 2, 34), title_text, fill=(40, 38, 35), font=font_main_title)

    s_bbox = draw.textbbox((0, 0), sub_text, font=font_sub_title)
    s_w = s_bbox[2] - s_bbox[0]
    draw.text(((canvas_w - s_w) // 2, 82), sub_text, fill=(88, 84, 80), font=font_sub_title)

    # Draw Dividers
    line_color = (188, 185, 180)
    # Vertical dividers
    for c in range(1, cols):
        x = c * cell_w
        draw.line([(x, header_h), (x, canvas_h - footer_h)], fill=line_color, width=1)
    # Horizontal divider
    y_mid = header_h + cell_h
    draw.line([(0, y_mid), (canvas_w, y_mid)], fill=line_color, width=1)

    # Paste Panels
    for fname, ptitle, psub, c, r in panels:
        img_path = os.path.join(RENDERS_DIR, fname)
        if not os.path.exists(img_path):
            print(f"Warning: {img_path} not found yet!")
            continue

        p_img = Image.open(img_path).convert("RGB")
        
        # Fit inside cell with margins
        margin_x = 24
        margin_top = 16
        margin_bot = 70 # Space for titles
        avail_w = cell_w - margin_x * 2
        avail_h = cell_h - margin_top - margin_bot

        # Resize preserving aspect ratio
        p_img.thumbnail((avail_w, avail_h), Image.Resampling.LANCZOS)
        pw, ph = p_img.size

        # Center in cell
        x_cell = c * cell_w
        y_cell = header_h + r * cell_h

        x_paste = x_cell + (cell_w - pw) // 2
        y_paste = y_cell + margin_top + (avail_h - ph) // 2
        canvas.paste(p_img, (x_paste, y_paste))

        # Panel Titles
        pt_bbox = draw.textbbox((0, 0), ptitle, font=font_panel_title)
        pt_w = pt_bbox[2] - pt_bbox[0]
        y_text1 = y_cell + cell_h - margin_bot + 12
        draw.text((x_cell + (cell_w - pt_w) // 2, y_text1), ptitle, fill=(45, 42, 38), font=font_panel_title)

        ps_bbox = draw.textbbox((0, 0), psub, font=font_panel_sub)
        ps_w = ps_bbox[2] - ps_bbox[0]
        y_text2 = y_text1 + 26
        draw.text((x_cell + (cell_w - ps_w) // 2, y_text2), psub, fill=(105, 100, 95), font=font_panel_sub)

    # Save Composite Sheet
    canvas.save(OUTPUT_PATH, quality=96)
    if os.path.exists(os.path.dirname(WEB_OUTPUT_PATH)):
        canvas.save(WEB_OUTPUT_PATH, quality=96)
    canvas.save(ARTIFACT_PATH, quality=96)
    print(f"Saved 6-View Reference Sheet -> {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_reference_sheet()
