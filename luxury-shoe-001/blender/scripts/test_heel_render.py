import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix, Euler

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0

# ---------------------------------------------------------------------------
# 1. LOCKED PROPORTIONS
# ---------------------------------------------------------------------------
L = 0.080           # 80.0 mm reference heel length
W = 0.850 * L        # 68.0 mm width
H_lift = 0.044 * L  # 3.52 mm thickness
H_bottom = 0.088 * L# 7.04 mm thickness
gap = 0.00008       # 0.08 mm physical gap

y_front = 0.475 * L
y_rear = -0.525 * L
y_seam = y_front - 0.450 * L   # 0.450 from front
y_apex = y_front - 0.575 * L   # 0.575 from front
w_tooth = 0.260 * W

Rx = W / 2.0
Ry = abs(0.0 - y_rear)

sin_seam = abs(y_seam - 0.0) / Ry
th_seam = math.asin(sin_seam)
w_seam = Rx * math.cos(th_seam)

num_arc = 36

def get_horseshoe_contour(scale=1.0, jitter_seed=0):
    s_Rx = Rx * scale
    s_Ry = Ry * scale
    s_yf = y_front * scale
    
    pts = [(s_Rx, s_yf), (-s_Rx, s_yf), (-s_Rx, 0.0)]
    for i in range(1, num_arc):
        ang = math.pi - (i / float(num_arc)) * math.pi
        px = s_Rx * math.cos(ang)
        py = -s_Ry * math.sin(ang)
        if jitter_seed != 0:
            px += 0.00004 * math.sin(3 * i + 2.5 * jitter_seed)
            py += 0.00004 * math.cos(4 * i + 1.8 * jitter_seed)
        pts.append((px, py))
    pts.append((s_Rx, 0.0))
    return pts

def get_bottom_layer_contours(scale=1.0):
    s_Rx = Rx * scale
    s_Ry = Ry * scale
    s_yf = y_front * scale
    s_ys = y_seam * scale
    s_ya = y_apex * scale
    s_wt = (w_tooth / 2.0) * scale
    
    sin_s = min(1.0, abs(s_ys - 0.0) / s_Ry)
    th_s = math.asin(sin_s)
    s_wsh = s_Rx * math.cos(th_s)

    p5 = [(s_Rx, s_yf), (-s_Rx, s_yf), (-s_Rx, 0.0)]
    n_sub = max(4, int(num_arc * (th_s / math.pi)))
    for i in range(1, n_sub):
        ang = math.pi - (i / float(n_sub)) * th_s
        p5.append((s_Rx * math.cos(ang), -s_Ry * math.sin(ang)))
    p5.append((-s_wsh, s_ys))
    p5.append((-s_wt, s_ys))
    p5.append((0.0, s_ya))
    p5.append((s_wt, s_ys))
    p5.append((s_wsh, s_ys))
    for i in range(n_sub - 1, 0, -1):
        ang = (i / float(n_sub)) * th_s
        p5.append((s_Rx * math.cos(ang), -s_Ry * math.sin(ang)))
    p5.append((s_Rx, 0.0))

    p6 = [
        (s_wsh, s_ys),
        (s_wt, s_ys),
        (0.0, s_ya),
        (-s_wt, s_ys),
        (-s_wsh, s_ys)
    ]
    n_rear = max(16, num_arc - 2 * n_sub)
    for i in range(1, n_rear):
        t = i / float(n_rear)
        ang = (math.pi - th_s) - t * (math.pi - 2 * th_s)
        p6.append((s_Rx * math.cos(ang), -s_Ry * math.sin(ang)))

    return p5, p6

def build_heel_lift_mesh(pts_bot, pts_top, z_bot, z_top, name="Lift"):
    bm = bmesh.new()
    n = len(pts_bot)
    v_bot = [bm.verts.new((x, y, z_bot)) for x, y in pts_bot]
    v_top = [bm.verts.new((x, y, z_top)) for x, y in pts_top]
    
    for i in range(n):
        i_next = (i + 1) % n
        f = bm.faces.new((v_bot[i], v_bot[i_next], v_top[i_next], v_top[i]))
        f.material_index = 1
        
    bot_edges = [bm.edges.get((v_bot[i], v_bot[(i+1)%n])) for i in range(n) if bm.edges.get((v_bot[i], v_bot[(i+1)%n]))]
    top_edges = [bm.edges.get((v_top[i], v_top[(i+1)%n])) for i in range(n) if bm.edges.get((v_top[i], v_top[(i+1)%n]))]
    
    res_bot = bmesh.ops.triangle_fill(bm, use_beauty=True, edges=bot_edges)
    for f in res_bot.get("geom", []):
        if isinstance(f, bmesh.types.BMFace):
            f.material_index = 0
            
    res_top = bmesh.ops.triangle_fill(bm, use_beauty=True, edges=top_edges)
    for f in res_top.get("geom", []):
        if isinstance(f, bmesh.types.BMFace):
            f.material_index = 0
            
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    
    for p in mesh.polygons:
        p.use_smooth = True
        
    obj = bpy.data.objects.new(name, mesh)
    bev = obj.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.0003
    bev.segments = 3
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(35)
    bev.harden_normals = True
    
    bpy.context.scene.collection.objects.link(obj)
    return obj

# ---------------------------------------------------------------------------
# 2. PBR SHADERS
# ---------------------------------------------------------------------------
def create_vegtan_face_material(name, col_base):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.42
    bsdf.inputs["IOR"].default_value = 1.45
    bsdf.inputs["Specular IOR Level"].default_value = 0.55
    bsdf.inputs["Coat Weight"].default_value = 0.28
    bsdf.inputs["Coat Roughness"].default_value = 0.22

    tc = nodes.new("ShaderNodeTexCoord")

    noise_macro = nodes.new("ShaderNodeTexNoise")
    noise_macro.inputs["Scale"].default_value = 100.0
    noise_macro.inputs["Detail"].default_value = 5.0
    noise_macro.inputs["Roughness"].default_value = 0.65
    links.new(tc.outputs["Object"], noise_macro.inputs["Vector"])

    cr_macro = nodes.new("ShaderNodeValToRGB")
    cr_macro.color_ramp.elements[0].position = 0.20
    cr_macro.color_ramp.elements[0].color = (col_base[0] * 0.75, col_base[1] * 0.70, col_base[2] * 0.65, 1.0)
    cr_macro.color_ramp.elements[1].position = 0.80
    cr_macro.color_ramp.elements[1].color = (min(1.0, col_base[0] * 1.25), min(1.0, col_base[1] * 1.20), min(1.0, col_base[2] * 1.15), 1.0)
    links.new(noise_macro.outputs["Fac"], cr_macro.inputs["Fac"])
    links.new(cr_macro.outputs["Color"], bsdf.inputs["Base Color"])

    noise_grain = nodes.new("ShaderNodeTexNoise")
    noise_grain.inputs["Scale"].default_value = 2400.0
    noise_grain.inputs["Detail"].default_value = 8.0
    noise_grain.inputs["Roughness"].default_value = 0.70
    links.new(tc.outputs["Object"], noise_grain.inputs["Vector"])

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.10
    bump.inputs["Distance"].default_value = 0.0001
    links.new(noise_grain.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

def create_vegtan_cut_edge_material(name, col_edge):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.35
    bsdf.inputs["Coat Weight"].default_value = 0.52
    bsdf.inputs["Coat Roughness"].default_value = 0.16
    bsdf.inputs["Coat Tint"].default_value = (1.0, 0.95, 0.90, 1.0)

    tc = nodes.new("ShaderNodeTexCoord")

    map_fiber = nodes.new("ShaderNodeMapping")
    map_fiber.inputs["Scale"].default_value = (80.0, 80.0, 8500.0)
    links.new(tc.outputs["Object"], map_fiber.inputs["Vector"])

    noise_fiber = nodes.new("ShaderNodeTexNoise")
    noise_fiber.inputs["Scale"].default_value = 1.0
    noise_fiber.inputs["Detail"].default_value = 6.0
    noise_fiber.inputs["Roughness"].default_value = 0.75
    links.new(map_fiber.outputs["Vector"], noise_fiber.inputs["Vector"])

    cr_edge = nodes.new("ShaderNodeValToRGB")
    cr_edge.color_ramp.elements[0].position = 0.20
    cr_edge.color_ramp.elements[0].color = (col_edge[0] * 0.65, col_edge[1] * 0.60, col_edge[2] * 0.55, 1.0)
    cr_edge.color_ramp.elements[1].position = 0.80
    cr_edge.color_ramp.elements[1].color = (min(1.0, col_edge[0] * 1.35), min(1.0, col_edge[1] * 1.30), min(1.0, col_edge[2] * 1.20), 1.0)
    links.new(noise_fiber.outputs["Fac"], cr_edge.inputs["Fac"])
    links.new(cr_edge.outputs["Color"], bsdf.inputs["Base Color"])

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.15
    bump.inputs["Distance"].default_value = 0.0001
    links.new(noise_fiber.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

def create_vulcanized_rubber_material():
    mat = bpy.data.materials.new(name="M_Vulcanized_Pebble_Rubber")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.016, 0.016, 0.018, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.70
    bsdf.inputs["Specular IOR Level"].default_value = 0.45
    bsdf.inputs["Coat Weight"].default_value = 0.0

    tc = nodes.new("ShaderNodeTexCoord")

    noise_stipple = nodes.new("ShaderNodeTexNoise")
    noise_stipple.inputs["Scale"].default_value = 4500.0
    noise_stipple.inputs["Detail"].default_value = 8.0
    noise_stipple.inputs["Roughness"].default_value = 0.85
    links.new(tc.outputs["Object"], noise_stipple.inputs["Vector"])

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.20
    bump.inputs["Distance"].default_value = 0.0001
    links.new(noise_stipple.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

def create_paper_ground_material():
    mat = bpy.data.materials.new(name="PBR_Studio_Paper_Floor")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.78, 0.77, 0.75, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.96

    tc = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2000.0
    noise.inputs["Detail"].default_value = 8.0
    links.new(tc.outputs["Object"], noise.inputs["Vector"])

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.012
    bump.inputs["Distance"].default_value = 0.0001
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

# ---------------------------------------------------------------------------
# 3. BUILD 6 PIECES
# ---------------------------------------------------------------------------
c_f1 = (0.16, 0.075, 0.028)
c_e1 = (0.08, 0.034, 0.012)
c_f2 = (0.18, 0.085, 0.032)
c_e2 = (0.09, 0.038, 0.014)
c_f3 = (0.15, 0.070, 0.026)
c_e3 = (0.075, 0.032, 0.011)
c_f4 = (0.19, 0.090, 0.036)
c_e4 = (0.095, 0.040, 0.015)
c_f5 = (0.17, 0.080, 0.030)
c_e5 = (0.085, 0.036, 0.013)

# Layer 1
z1_bot = 0.01792
z1_top = z1_bot + H_lift
p1_bot = get_horseshoe_contour(0.992, jitter_seed=1)
p1_top = get_horseshoe_contour(1.000, jitter_seed=1)
p1 = build_heel_lift_mesh(p1_bot, p1_top, z1_bot, z1_top, "Heel_Lift_01_Top_Leather")
p1.data.materials.append(create_vegtan_face_material("M_Face_01", c_f1))
p1.data.materials.append(create_vegtan_cut_edge_material("M_Edge_01", c_e1))

# Layer 2
z2_bot = 0.01432
z2_top = z2_bot + H_lift
p2_bot = get_horseshoe_contour(0.984, jitter_seed=2)
p2_top = get_horseshoe_contour(0.992, jitter_seed=2)
p2 = build_heel_lift_mesh(p2_bot, p2_top, z2_bot, z2_top, "Heel_Lift_02_Mid_A_Leather")
p2.data.materials.append(create_vegtan_face_material("M_Face_02", c_f2))
p2.data.materials.append(create_vegtan_cut_edge_material("M_Edge_02", c_e2))

# Layer 3
z3_bot = 0.01072
z3_top = z3_bot + H_lift
p3_bot = get_horseshoe_contour(0.976, jitter_seed=3)
p3_top = get_horseshoe_contour(0.984, jitter_seed=3)
p3 = build_heel_lift_mesh(p3_bot, p3_top, z3_bot, z3_top, "Heel_Lift_03_Mid_B_Leather")
p3.data.materials.append(create_vegtan_face_material("M_Face_03", c_f3))
p3.data.materials.append(create_vegtan_cut_edge_material("M_Edge_03", c_e3))

# Layer 4
z4_bot = 0.00712
z4_top = z4_bot + H_lift
p4_bot = get_horseshoe_contour(0.968, jitter_seed=4)
p4_top = get_horseshoe_contour(0.976, jitter_seed=4)
p4 = build_heel_lift_mesh(p4_bot, p4_top, z4_bot, z4_top, "Heel_Lift_04_Mid_C_Leather")
p4.data.materials.append(create_vegtan_face_material("M_Face_04", c_f4))
p4.data.materials.append(create_vegtan_cut_edge_material("M_Edge_04", c_e4))

# Layer 5A
z5_bot = 0.00000
z5_top = z5_bot + H_bottom
p5_bot, p6_bot = get_bottom_layer_contours(scale=0.960)
p5_top, p6_top = get_bottom_layer_contours(scale=0.968)

p5 = build_heel_lift_mesh(p5_bot, p5_top, z5_bot, z5_top, "Heel_Lift_05_Bottom_Leather_Dovetail")
p5.data.materials.append(create_vegtan_face_material("M_Face_05", c_f5))
p5.data.materials.append(create_vegtan_cut_edge_material("M_Edge_05", c_e5))

# Layer 5B
p6 = build_heel_lift_mesh(p6_bot, p6_top, z5_bot, z5_top, "Heel_Lift_06_Rubber_Strike_Dovetail")
mat_rubber = create_vulcanized_rubber_material()
p6.data.materials.append(mat_rubber)
p6.data.materials.append(mat_rubber)

# ---------------------------------------------------------------------------
# 4. STUDIO ENVIRONMENT
# ---------------------------------------------------------------------------
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 95

scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.05

world = bpy.data.worlds.new("StudioWorld")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0.76, 0.75, 0.73, 1.0)
    bg.inputs["Strength"].default_value = 0.22

mesh_ground = bpy.data.meshes.new("Ground_Plane")
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=4, y_segments=4, size=2.0)
bm.to_mesh(mesh_ground)
bm.free()
ground_obj = bpy.data.objects.new("Ground_Plane", mesh_ground)
ground_obj.data.materials.append(create_paper_ground_material())
ground_obj.location = (0, 0, -0.015)
scene.collection.objects.link(ground_obj)

# Lights
l_key = bpy.data.lights.new("Key_Light", "AREA")
l_key.energy = 3.6
l_key.size = 0.45
l_key.color = (1.0, 0.98, 0.95)
o_key = bpy.data.objects.new("Key_Light", l_key)
o_key.location = (-0.16, -0.14, 0.22)
o_key.rotation_euler = (math.radians(45), math.radians(-25), math.radians(-45))
scene.collection.objects.link(o_key)

l_fill = bpy.data.lights.new("Fill_Light", "AREA")
l_fill.energy = 1.3
l_fill.size = 0.50
l_fill.color = (0.95, 0.97, 1.0)
o_fill = bpy.data.objects.new("Fill_Light", l_fill)
o_fill.location = (0.20, -0.08, 0.16)
o_fill.rotation_euler = (math.radians(50), math.radians(35), math.radians(55))
scene.collection.objects.link(o_fill)

l_rim = bpy.data.lights.new("Rim_Light", "AREA")
l_rim.energy = 2.5
l_rim.size = 0.25
l_rim.color = (1.0, 1.0, 0.98)
o_rim = bpy.data.objects.new("Rim_Light", l_rim)
o_rim.location = (0.0, 0.18, 0.18)
o_rim.rotation_euler = (math.radians(-50), 0, math.radians(180))
scene.collection.objects.link(o_rim)

# Parent
heel_parent = bpy.data.objects.new("Heel_Assembly", None)
scene.collection.objects.link(heel_parent)
for p in [p1, p2, p3, p4, p5, p6]:
    p.parent = heel_parent

# EXACT ORIENTATION TO SHOW WALKING SURFACE & 5-TIER STACKED EDGE
# In media_1789393237116.jpg:
# Heel rests floating tilted:
# Breast on left, rubber on right
# Walking surface (-Z) facing camera
# Stack (+Z) pointing up/back
heel_parent.rotation_euler = (math.radians(-28), math.radians(12), math.radians(65))
heel_parent.location = (0.005, 0.0, 0.035)

# Camera positioned slightly below the heel, looking up and in:
cam_data = bpy.data.cameras.new("Macro_Cam")
cam_data.lens = 85.0
cam_data.clip_start = 0.0005
cam_obj = bpy.data.objects.new("Macro_Cam", cam_data)
cam_obj.location = (0.015, -0.27, 0.012)
scene.collection.objects.link(cam_obj)

tgt = bpy.data.objects.new("Cam_Target", None)
tgt.location = (0.005, 0.0, 0.035)
scene.collection.objects.link(tgt)

track = cam_obj.constraints.new("TRACK_TO")
track.target = tgt
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis = "UP_Y"

scene.camera = cam_obj

out_dir = r"c:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001\renders\pieces\heel_lifts"
os.makedirs(out_dir, exist_ok=True)
out_file = os.path.join(out_dir, "test_assembled_v8.jpg")
scene.render.filepath = out_file
bpy.ops.render.render(write_still=True)
print("Render completed successfully:", out_file)
