"""
Master Builder & Multi-Shot Studio Suite for Piece 03: Leather Rand (Complete Master Suite)
Recreates media_1789396807239.jpg with exact framing, rich antique mahogany patina, and macro details.
Also includes assembly context with Piece 02 (Heel Lifts) and exports GLB.
"""

import bpy
import bmesh
import math
import os
import shutil
from mathutils import Vector, Matrix, Euler

# ---------------------------------------------------------------------------
# 1. PARAMETRIC CONSTANTS
# ---------------------------------------------------------------------------
L = 0.080           # 80.0 mm reference heel length
W = 0.850 * L       # 68.0 mm heel width (ratio 0.850)
Rx = W / 2.0        # 34.0 mm half-width
y_front = 0.475 * L # +38.0 mm breast line
y_rear = -0.525 * L # -42.0 mm rear apex
Ry = abs(y_rear)    # 42.0 mm rear radius

# Rand dimensions
H_rand = 0.0068        # 6.8 mm height
h_chamfer = 0.0010     # 1.0 mm top chamfer
dx_slope = 0.0004      # 0.4 mm subtle outer slope
dx_chamfer = 0.0007    # 0.7 mm top chamfer inward
w_rim = 0.0015         # 1.5 mm top flat rim
w_base = 0.0028        # 2.8 mm base width

num_stations = 140

# Heel Lift constants for Assembly Context
H_lift = 0.044 * L     # 3.52 mm per lift
H_bottom = 0.088 * L   # 7.04 mm bottom layer
H_total_heel = 4 * H_lift + H_bottom # 21.12 mm
y_seam = y_front - 0.450 * L
y_apex = y_front - 0.575 * L
w_tooth = 0.260 * W

OUTPUT_DIR = os.path.abspath("luxury-shoe-001/renders/pieces/leather_rand")
WEB_DIR = os.path.abspath("web/public/pieces/leather_rand")
MASTER_PIECE_IMG = os.path.abspath("luxury-shoe-001/renders/pieces/Piece_03_Leather_Rand.jpg")
WEB_PIECE_IMG = os.path.abspath("web/public/pieces/Piece_03_Leather_Rand.jpg")
MODEL_DIR = os.path.abspath("luxury-shoe-001/models/pieces")
WEB_MODEL_DIR = os.path.abspath("web/public/models/pieces")

for d in [OUTPUT_DIR, WEB_DIR, MODEL_DIR, WEB_MODEL_DIR]:
    os.makedirs(d, exist_ok=True)

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

# ---------------------------------------------------------------------------
# 2. PBR MATERIALS
# ---------------------------------------------------------------------------
def create_materials():
    # 1. Antique Mahogany / Chestnut Bridle Leather (Exact match to media_1789396807239.jpg)
    mat_grain = bpy.data.materials.new(name="M_Rand_Grain")
    mat_grain.use_nodes = True
    nodes = mat_grain.node_tree.nodes
    links = mat_grain.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.30
    bsdf.inputs["Specular IOR Level"].default_value = 0.65
    bsdf.inputs["Coat Weight"].default_value = 0.85
    bsdf.inputs["Coat Roughness"].default_value = 0.12
    bsdf.inputs["Subsurface Weight"].default_value = 0.04
    bsdf.inputs["Subsurface Radius"].default_value = (0.0015, 0.0008, 0.0003)

    tc = nodes.new("ShaderNodeTexCoord")

    voro_pores = nodes.new("ShaderNodeTexVoronoi")
    voro_pores.feature = "DISTANCE_TO_EDGE"
    voro_pores.inputs["Scale"].default_value = 2400.0
    links.new(tc.outputs["Object"], voro_pores.inputs["Vector"])

    noise_grain = nodes.new("ShaderNodeTexNoise")
    noise_grain.inputs["Scale"].default_value = 1200.0
    noise_grain.inputs["Detail"].default_value = 8.0
    noise_grain.inputs["Roughness"].default_value = 0.72
    links.new(tc.outputs["Object"], noise_grain.inputs["Vector"])

    noise_patina = nodes.new("ShaderNodeTexNoise")
    noise_patina.inputs["Scale"].default_value = 100.0
    noise_patina.inputs["Detail"].default_value = 5.0
    noise_patina.inputs["Roughness"].default_value = 0.50
    links.new(tc.outputs["Object"], noise_patina.inputs["Vector"])

    mix_noise = nodes.new("ShaderNodeMix")
    mix_noise.data_type = "FLOAT"
    mix_noise.inputs["Factor"].default_value = 0.35
    links.new(noise_patina.outputs["Fac"], mix_noise.inputs["A"])
    links.new(noise_grain.outputs["Fac"], mix_noise.inputs["B"])

    cr_color = nodes.new("ShaderNodeValToRGB")
    cr_color.color_ramp.elements[0].position = 0.20
    cr_color.color_ramp.elements[0].color = (0.018, 0.005, 0.0015, 1.0)
    cr_color.color_ramp.elements[1].position = 0.80
    cr_color.color_ramp.elements[1].color = (0.075, 0.022, 0.006, 1.0)
    links.new(mix_noise.outputs["Result"], cr_color.inputs["Fac"])
    links.new(cr_color.outputs["Color"], bsdf.inputs["Base Color"])

    bump_pores = nodes.new("ShaderNodeBump")
    bump_pores.inputs["Strength"].default_value = 0.35
    bump_pores.inputs["Distance"].default_value = 0.00012
    links.new(voro_pores.outputs["Distance"], bump_pores.inputs["Height"])

    bump_grain = nodes.new("ShaderNodeBump")
    bump_grain.inputs["Strength"].default_value = 0.25
    bump_grain.inputs["Distance"].default_value = 0.00015
    links.new(noise_grain.outputs["Fac"], bump_grain.inputs["Height"])
    links.new(bump_pores.outputs["Normal"], bump_grain.inputs["Normal"])
    links.new(bump_grain.outputs["Normal"], bsdf.inputs["Normal"])

    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    # 2. Suede Inner Wall
    mat_suede = bpy.data.materials.new(name="M_Rand_Flesh_Suede")
    mat_suede.use_nodes = True
    nodes2 = mat_suede.node_tree.nodes
    links2 = mat_suede.node_tree.links
    nodes2.clear()

    out2 = nodes2.new("ShaderNodeOutputMaterial")
    bsdf2 = nodes2.new("ShaderNodeBsdfPrincipled")
    bsdf2.inputs["Base Color"].default_value = (0.16, 0.075, 0.030, 1.0)
    bsdf2.inputs["Roughness"].default_value = 0.92
    bsdf2.inputs["Specular IOR Level"].default_value = 0.25
    bsdf2.inputs["Subsurface Weight"].default_value = 0.12

    tc2 = nodes2.new("ShaderNodeTexCoord")
    noise_suede = nodes2.new("ShaderNodeTexNoise")
    noise_suede.inputs["Scale"].default_value = 4500.0
    noise_suede.inputs["Detail"].default_value = 8.0
    links2.new(tc2.outputs["Object"], noise_suede.inputs["Vector"])

    cr_suede = nodes2.new("ShaderNodeValToRGB")
    cr_suede.color_ramp.elements[0].position = 0.20
    cr_suede.color_ramp.elements[0].color = (0.10, 0.045, 0.018, 1.0)
    cr_suede.color_ramp.elements[1].position = 0.80
    cr_suede.color_ramp.elements[1].color = (0.18, 0.085, 0.038, 1.0)
    links2.new(noise_suede.outputs["Fac"], cr_suede.inputs["Fac"])
    links2.new(cr_suede.outputs["Color"], bsdf2.inputs["Base Color"])

    bump_suede = nodes2.new("ShaderNodeBump")
    bump_suede.inputs["Strength"].default_value = 0.40
    bump_suede.inputs["Distance"].default_value = 0.00018
    links2.new(noise_suede.outputs["Fac"], bump_suede.inputs["Height"])
    links2.new(bump_suede.outputs["Normal"], bsdf2.inputs["Normal"])
    links2.new(bsdf2.outputs["BSDF"], out2.inputs["Surface"])

    # 3. Cut End Material
    mat_cut = bpy.data.materials.new(name="M_Rand_Cut_End")
    mat_cut.use_nodes = True
    nodes3 = mat_cut.node_tree.nodes
    links3 = mat_cut.node_tree.links
    nodes3.clear()
    out3 = nodes3.new("ShaderNodeOutputMaterial")
    bsdf3 = nodes3.new("ShaderNodeBsdfPrincipled")
    bsdf3.inputs["Base Color"].default_value = (0.065, 0.022, 0.008, 1.0)
    bsdf3.inputs["Roughness"].default_value = 0.65
    links3.new(bsdf3.outputs["BSDF"], out3.inputs["Surface"])

    return mat_grain, mat_suede, mat_cut

def create_cyclorama_material():
    mat = bpy.data.materials.new(name="PBR_Cyclorama_Clean")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.82, 0.81, 0.79, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.95
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

def create_heel_lift_materials():
    # Leather Lift Face
    m_face = bpy.data.materials.new("M_VegTan_Face")
    m_face.use_nodes = True
    bsdf = m_face.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.28, 0.11, 0.04, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.38
    bsdf.inputs["Specular IOR Level"].default_value = 0.55

    # Leather Cut Edge
    m_edge = bpy.data.materials.new("M_VegTan_CutEdge")
    m_edge.use_nodes = True
    bsdf_e = m_edge.node_tree.nodes["Principled BSDF"]
    bsdf_e.inputs["Base Color"].default_value = (0.16, 0.06, 0.02, 1.0)
    bsdf_e.inputs["Roughness"].default_value = 0.45
    bsdf_e.inputs["Coat Weight"].default_value = 0.40

    # Rubber Strike
    m_rub = bpy.data.materials.new("M_Vulcanized_Rubber")
    m_rub.use_nodes = True
    bsdf_r = m_rub.node_tree.nodes["Principled BSDF"]
    bsdf_r.inputs["Base Color"].default_value = (0.018, 0.018, 0.020, 1.0)
    bsdf_r.inputs["Roughness"].default_value = 0.72
    bsdf_r.inputs["Specular IOR Level"].default_value = 0.45

    return m_face, m_edge, m_rub

# ---------------------------------------------------------------------------
# 3. GEOMETRY GENERATION
# ---------------------------------------------------------------------------
def build_smooth_leather_rand():
    mesh = bpy.data.meshes.new("Mesh_Piece_03_Leather_Rand")
    bm = bmesh.new()
    mat_grain, mat_suede, mat_cut = create_materials()

    pts_2d = []
    for i in range(num_stations):
        u = -1.0 + 2.0 * (i / float(num_stations - 1))
        sign_u = -1.0 if u < 0 else 1.0
        abs_u = abs(u)

        if abs_u < 0.55:
            theta = (abs_u / 0.55) * (math.pi / 2.0)
            x = sign_u * Rx * math.sin(theta)
            y = y_rear + Ry * (1.0 - math.cos(theta))
        else:
            t_side = (abs_u - 0.55) / 0.45
            x = sign_u * (Rx + 0.0004 * math.sin(t_side * math.pi))
            y_base = y_rear + Ry
            y = y_base + t_side * (y_front - y_base)

        pts_2d.append((x, y))

    stations = []
    n = len(pts_2d)
    for i in range(n):
        if i == 0:
            dx = pts_2d[1][0] - pts_2d[0][0]
            dy = pts_2d[1][1] - pts_2d[0][1]
        elif i == n - 1:
            dx = pts_2d[n-1][0] - pts_2d[n-2][0]
            dy = pts_2d[n-1][1] - pts_2d[n-2][1]
        else:
            dx = pts_2d[i+1][0] - pts_2d[i-1][0]
            dy = pts_2d[i+1][1] - pts_2d[i-1][1]
        
        dist = math.sqrt(dx*dx + dy*dy)
        tx = dx / dist if dist > 0 else 0
        ty = dy / dist if dist > 0 else 1
        stations.append((pts_2d[i][0], pts_2d[i][1], -ty, tx))

    station_rings = []
    for (gx, gy, in_x, in_y) in stations:
        v0 = bm.verts.new((gx, gy, 0.0))
        v1 = bm.verts.new((gx + in_x * dx_slope, gy + in_y * dx_slope, H_rand - h_chamfer))
        v2 = bm.verts.new((gx + in_x * (dx_slope + dx_chamfer), gy + in_y * (dx_slope + dx_chamfer), H_rand))
        v3 = bm.verts.new((gx + in_x * (dx_slope + dx_chamfer + w_rim), gy + in_y * (dx_slope + dx_chamfer + w_rim), H_rand))
        v4 = bm.verts.new((gx + in_x * w_base, gy + in_y * w_base, 0.0))
        station_rings.append([v0, v1, v2, v3, v4])

    bm.verts.ensure_lookup_table()

    for i in range(len(station_rings) - 1):
        rA = station_rings[i]
        rB = station_rings[i + 1]

        f_slope = bm.faces.new((rA[0], rB[0], rB[1], rA[1]))
        f_slope.material_index = 0
        f_slope.smooth = True

        f_chamf = bm.faces.new((rA[1], rB[1], rB[2], rA[2]))
        f_chamf.material_index = 0
        f_chamf.smooth = True

        f_rim = bm.faces.new((rA[2], rB[2], rB[3], rA[3]))
        f_rim.material_index = 0
        f_rim.smooth = True

        f_inner = bm.faces.new((rA[3], rB[3], rB[4], rA[4]))
        f_inner.material_index = 1
        f_inner.smooth = True

        f_bot = bm.faces.new((rA[4], rB[4], rB[0], rA[0]))
        f_bot.material_index = 1
        f_bot.smooth = True

    start_r = station_rings[0]
    f_start = bm.faces.new((start_r[0], start_r[1], start_r[2], start_r[3], start_r[4]))
    f_start.material_index = 2

    end_r = station_rings[-1]
    f_end = bm.faces.new((end_r[4], end_r[3], end_r[2], end_r[1], end_r[0]))
    f_end.material_index = 2

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("Piece_03_Leather_Rand", mesh)
    obj.data.materials.append(mat_grain)
    obj.data.materials.append(mat_suede)
    obj.data.materials.append(mat_cut)

    bev = obj.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.00015
    bev.segments = 2
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(35)
    bev.harden_normals = True

    return obj

def build_heel_lifts_underneath():
    # Builds the 5-layer stacked heel directly beneath the rand (Z from -H_total_heel to 0)
    m_face, m_edge, m_rub = create_heel_lift_materials()
    heel_objs = []

    # Outer perimeter points for lifts 1-4
    pts = [(Rx, y_front), (-Rx, y_front), (-Rx, 0.0)]
    for i in range(1, 36):
        ang = math.pi - (i / 36.0) * math.pi
        pts.append((Rx * math.cos(ang), -Ry * math.sin(ang)))
    pts.append((Rx, 0.0))

    # Lifts 1-4 (Leather)
    for l_idx in range(4):
        z_top = -l_idx * H_lift
        z_bot = z_top - H_lift + 0.00008

        mesh = bpy.data.meshes.new(f"Lift_{l_idx+1}")
        bm = bmesh.new()
        v_bot = [bm.verts.new((x, y, z_bot)) for x, y in pts]
        v_top = [bm.verts.new((x, y, z_top)) for x, y in pts]
        n_pts = len(pts)
        for i in range(n_pts):
            ni = (i + 1) % n_pts
            f = bm.faces.new((v_bot[i], v_bot[ni], v_top[ni], v_top[i]))
            f.material_index = 1
            f.smooth = True
        bm.faces.new(v_bot).material_index = 0
        bm.faces.new(list(reversed(v_top))).material_index = 0
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()

        obj = bpy.data.objects.new(f"Heel_Lift_{l_idx+1}", mesh)
        obj.data.materials.append(m_face)
        obj.data.materials.append(m_edge)
        bev = obj.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.0002
        bev.segments = 2
        bev.limit_method = "ANGLE"
        bev.harden_normals = True
        heel_objs.append(obj)

    # Layer 5: Dovetail Bottom (Leather front + Rubber rear)
    z_top5 = -4 * H_lift
    z_bot5 = z_top5 - H_bottom + 0.00008
    sin_s = min(1.0, abs(y_seam) / Ry)
    th_s = math.asin(sin_s)
    w_sh = Rx * math.cos(th_s)
    wt = w_tooth / 2.0

    # Front Leather
    p5 = [(Rx, y_front), (-Rx, y_front), (-Rx, 0.0)]
    n_sub = max(4, int(36 * (th_s / math.pi)))
    for i in range(1, n_sub):
        ang = math.pi - (i / float(n_sub)) * th_s
        p5.append((Rx * math.cos(ang), -Ry * math.sin(ang)))
    p5.extend([(-w_sh, y_seam), (-wt, y_seam), (0.0, y_apex), (wt, y_seam), (w_sh, y_seam)])
    for i in range(n_sub - 1, 0, -1):
        ang = (i / float(n_sub)) * th_s
        p5.append((Rx * math.cos(ang), -Ry * math.sin(ang)))
    p5.append((Rx, 0.0))

    mesh5 = bpy.data.meshes.new("Lift_5_Leather")
    bm5 = bmesh.new()
    vb5 = [bm5.verts.new((x, y, z_bot5)) for x, y in p5]
    vt5 = [bm5.verts.new((x, y, z_top5)) for x, y in p5]
    np5 = len(p5)
    for i in range(np5):
        ni = (i + 1) % np5
        bm5.faces.new((vb5[i], vb5[ni], vt5[ni], vt5[i])).material_index = 1
    bm5.faces.new(vb5).material_index = 0
    bm5.faces.new(list(reversed(vt5))).material_index = 0
    bmesh.ops.recalc_face_normals(bm5, faces=bm5.faces)
    bm5.to_mesh(mesh5)
    bm5.free()
    o5 = bpy.data.objects.new("Heel_Lift_5_Leather", mesh5)
    o5.data.materials.append(m_face)
    o5.data.materials.append(m_edge)
    heel_objs.append(o5)

    # Rear Rubber
    p6 = [(-w_sh, y_seam)]
    for i in range(n_sub, 36 - n_sub + 1):
        ang = math.pi - (i / 36.0) * math.pi
        p6.append((Rx * math.cos(ang), -Ry * math.sin(ang)))
    p6.extend([(w_sh, y_seam), (wt, y_seam), (0.0, y_apex), (-wt, y_seam)])

    mesh6 = bpy.data.meshes.new("Lift_6_Rubber")
    bm6 = bmesh.new()
    vb6 = [bm6.verts.new((x, y, z_bot5)) for x, y in p6]
    vt6 = [bm6.verts.new((x, y, z_top5)) for x, y in p6]
    np6 = len(p6)
    for i in range(np6):
        ni = (i + 1) % np6
        bm6.faces.new((vb6[i], vb6[ni], vt6[ni], vt6[i])).material_index = 0
    bm6.faces.new(vb6).material_index = 0
    bm6.faces.new(list(reversed(vt6))).material_index = 0
    bmesh.ops.recalc_face_normals(bm6, faces=bm6.faces)
    bm6.to_mesh(mesh6)
    bm6.free()
    o6 = bpy.data.objects.new("Heel_Lift_6_Rubber", mesh6)
    o6.data.materials.append(m_rub)
    heel_objs.append(o6)

    return heel_objs

# ---------------------------------------------------------------------------
# 4. STUDIO CYCLORAMA & LIGHTS
# ---------------------------------------------------------------------------
def setup_studio():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 96

    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.04

    world = bpy.data.worlds.new("RandWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.78, 0.77, 0.75, 1.0)
        bg.inputs["Strength"].default_value = 0.14

    mesh_cyc = bpy.data.meshes.new("Cyclorama")
    bm = bmesh.new()
    w = 2.0
    hw = w / 2.0
    profile = [(-0.8, -0.025), (-0.4, -0.025), (-0.1, -0.025), (0.2, -0.025), (0.35, -0.025)]
    cy = 0.35
    cz = 0.35 - 0.025
    r = 0.35
    for i in range(1, 10):
        t = i / 10.0
        ang = -math.pi / 2.0 + t * (math.pi / 2.0)
        profile.append((cy + r * math.cos(ang), cz + r * math.sin(ang)))
    for z in [0.7, 1.4]:
        profile.append((cy + r, z))
    verts_l = [bm.verts.new((-hw, y, z)) for y, z in profile]
    verts_r = [bm.verts.new((hw, y, z)) for y, z in profile]
    for i in range(len(profile) - 1):
        bm.faces.new((verts_l[i], verts_r[i], verts_r[i+1], verts_l[i+1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh_cyc)
    bm.free()
    for p in mesh_cyc.polygons:
        p.use_smooth = True
    cyc_obj = bpy.data.objects.new("Cyclorama", mesh_cyc)
    cyc_obj.data.materials.append(create_cyclorama_material())
    scene.collection.objects.link(cyc_obj)

    # Key light: high top-right
    l_key = bpy.data.lights.new("Key_Light", "AREA")
    l_key.energy = 4.2
    l_key.size = 0.38
    l_key.color = (1.0, 0.98, 0.95)
    o_key = bpy.data.objects.new("Key_Light", l_key)
    o_key.location = (0.16, -0.12, 0.22)
    o_key.rotation_euler = (math.radians(48), math.radians(18), math.radians(35))
    scene.collection.objects.link(o_key)

    # Fill light: soft front-left
    l_fill = bpy.data.lights.new("Fill_Light", "AREA")
    l_fill.energy = 0.75
    l_fill.size = 0.50
    l_fill.color = (0.95, 0.97, 1.0)
    o_fill = bpy.data.objects.new("Fill_Light", l_fill)
    o_fill.location = (-0.18, -0.08, 0.16)
    o_fill.rotation_euler = (math.radians(45), math.radians(-25), math.radians(-45))
    scene.collection.objects.link(o_fill)

    # Rim kick light: catches top bevel
    l_rim = bpy.data.lights.new("Rim_Light", "AREA")
    l_rim.energy = 3.2
    l_rim.size = 0.22
    l_rim.color = (1.0, 1.0, 0.98)
    o_rim = bpy.data.objects.new("Rim_Light", l_rim)
    o_rim.location = (0.0, 0.15, 0.18)
    o_rim.rotation_euler = (math.radians(-52), 0, math.radians(180))
    scene.collection.objects.link(o_rim)

def setup_camera(name, loc, target_loc, lens=85.0):
    scene = bpy.context.scene
    if scene.camera:
        old_cam = scene.camera
        tgt = old_cam.constraints.get("Track")
        if tgt and tgt.target:
            bpy.data.objects.remove(tgt.target, do_unlink=True)
        bpy.data.objects.remove(old_cam, do_unlink=True)
        
    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = lens
    cam_data.clip_start = 0.001
    cam_data.dof.use_dof = False # Clean tack-sharp focus
    cam_obj = bpy.data.objects.new(name, cam_data)
    cam_obj.location = loc
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    
    empty = bpy.data.objects.new(f"{name}_Target", None)
    empty.location = target_loc
    scene.collection.objects.link(empty)
    
    track = cam_obj.constraints.new(type="TRACK_TO")
    track.target = empty
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    bpy.context.view_layer.update()
    return cam_obj

# ---------------------------------------------------------------------------
# 5. RENDER SUITE EXECUTION
# ---------------------------------------------------------------------------
def render_full_suite():
    clean_scene()
    setup_studio()

    rand_obj = build_smooth_leather_rand()
    bpy.context.scene.collection.objects.link(rand_obj)

    # Shots 1-5: Standalone Leather Rand
    shots = [
        {
            "filename": "Leather_Rand_Piece_03_Hero_Reference.jpg",
            "desc": "Hero portrait faithfully matching media_1789396807239.jpg",
            "cam_loc": (0.0, -0.140, 0.095),
            "target": (0.0, -0.005, 0.003),
            "lens": 85.0
        },
        {
            "filename": "Leather_Rand_Piece_03_Macro_CrossSection.jpg",
            "desc": "Extreme macro close-up of breast end cut and beveled facet",
            "cam_loc": (-0.068, 0.015, 0.028),
            "target": (-Rx, y_front - 0.005, H_rand / 2.0),
            "lens": 115.0
        },
        {
            "filename": "Leather_Rand_Piece_03_Rear_Curvature_Macro.jpg",
            "desc": "Macro close-up on curved outer heel perimeter highlighting grain & carnauba wax sheen",
            "cam_loc": (0.022, -0.088, 0.025),
            "target": (0.005, y_rear + 0.005, H_rand / 2.0),
            "lens": 105.0
        },
        {
            "filename": "Leather_Rand_Piece_03_Top_Blueprint.jpg",
            "desc": "Orthographic top-down plan showing exact 80mm x 68mm perimeter curve",
            "cam_loc": (0.0, -0.002, 0.280),
            "target": (0.0, -0.002, H_rand / 2.0),
            "lens": 75.0
        },
        {
            "filename": "Piece_03_Leather_Rand.jpg",
            "desc": "Master catalog portrait for web application and documentation",
            "cam_loc": (-0.020, -0.138, 0.095),
            "target": (0.0, -0.005, 0.003),
            "lens": 85.0
        }
    ]

    for idx, s in enumerate(shots):
        fname = s["filename"]
        out_path = os.path.join(OUTPUT_DIR, fname)
        print(f"[{idx+1}/{len(shots)+1}] Rendering {fname}...")
        setup_camera(f"Cam_{idx}", s["cam_loc"], s["target"], s["lens"])
        bpy.context.scene.render.filepath = out_path
        bpy.ops.render.render(write_still=True)
        print(f"Rendered -> {out_path}")

        web_path = os.path.join(WEB_DIR, fname)
        shutil.copy2(out_path, web_path)

        if fname == "Piece_03_Leather_Rand.jpg":
            shutil.copy2(out_path, MASTER_PIECE_IMG)
            shutil.copy2(out_path, WEB_PIECE_IMG)
            print(f"Copied master piece image -> {MASTER_PIECE_IMG}")

    # Shot 6: Heel Assembly Context (Rand + 5-Layer Stacked Heel underneath)
    print(f"[{len(shots)+1}/{len(shots)+1}] Rendering Leather_Rand_Piece_03_Heel_Assembly_Context.jpg...")
    heel_objs = build_heel_lifts_underneath()
    for ho in heel_objs:
        bpy.context.scene.collection.objects.link(ho)
    bpy.context.view_layer.update()

    setup_camera("Cam_Assembly", (-0.11, -0.14, 0.085), (0.0, -0.005, -0.006), lens=85.0)
    assembly_out = os.path.join(OUTPUT_DIR, "Leather_Rand_Piece_03_Heel_Assembly_Context.jpg")
    bpy.context.scene.render.filepath = assembly_out
    bpy.ops.render.render(write_still=True)
    web_assembly = os.path.join(WEB_DIR, "Leather_Rand_Piece_03_Heel_Assembly_Context.jpg")
    shutil.copy2(assembly_out, web_assembly)
    print(f"Rendered Assembly Context -> {assembly_out}")

    # Remove heel objects before GLB export
    for ho in heel_objs:
        bpy.data.objects.remove(ho, do_unlink=True)

    # Export Standalone GLB model
    bpy.ops.object.select_all(action="DESELECT")
    rand_obj.select_set(True)
    bpy.context.view_layer.objects.active = rand_obj
    glb_out = os.path.join(MODEL_DIR, "Piece_03_Leather_Rand.glb")
    web_glb_out = os.path.join(WEB_MODEL_DIR, "Piece_03_Leather_Rand.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_out,
        use_selection=True,
        export_format="GLB",
        export_apply=True
    )
    shutil.copy2(glb_out, web_glb_out)
    print(f"Exported Leather Rand GLB -> {glb_out}")

if __name__ == "__main__":
    print("=== STARTING PIECE 03 LEATHER RAND MASTER SUITE BUILD & RENDER ===")
    render_full_suite()
    print("=== PIECE 03 LEATHER RAND MASTER SUITE FINISHED SUCCESSFULLY ===")
