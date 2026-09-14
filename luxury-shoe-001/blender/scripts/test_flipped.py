import bpy
import bmesh
import math
import os

OUTPUT_DIR = os.path.abspath("luxury-shoe-001/renders/pieces/outsole")

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

from test_render_bottom import build_outsole, setup_studio

clean_scene()
setup_studio()
outsole = build_outsole()

# Flip outsole so bottom faces UP towards +Z
outsole.rotation_euler = (math.radians(180), 0, math.radians(90))
outsole.location = (0.0, 0.0, 0.045) # raise slightly above cyclorama

scene = bpy.context.scene

# Orthographic camera from above
cam_data = bpy.data.cameras.new("Cam_Bottom_TopDown")
cam_data.type = "ORTHO"
cam_data.ortho_scale = 0.33
cam_data.clip_start = 0.001
cam = bpy.data.objects.new("Cam_Bottom_TopDown", cam_data)
cam.location = (0.0, 0.0, 0.45)
cam.rotation_euler = (0, 0, 0)
scene.collection.objects.link(cam)
scene.camera = cam

out_file = os.path.join(OUTPUT_DIR, "test_outsole_bottom_flipped.jpg")
scene.render.filepath = out_file
bpy.ops.render.render(write_still=True)
print("Rendered flipped bottom view!")
