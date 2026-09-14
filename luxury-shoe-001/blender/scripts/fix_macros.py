import bpy
import bmesh
import math
import os
import shutil

L = 0.080
W = 0.850 * L
Rx = W / 2.0
y_front = 0.475 * L
y_rear = -0.525 * L
Ry = abs(y_rear)

H_rand = 0.0068
h_chamfer = 0.0010
dx_slope = 0.0004
dx_chamfer = 0.0007
w_rim = 0.0015
w_base = 0.0028
num_stations = 140

OUTPUT_DIR = os.path.abspath("luxury-shoe-001/renders/pieces/leather_rand")
WEB_DIR = os.path.abspath("web/public/pieces/leather_rand")

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

def create_materials():
    mat_grain = bpy.data.materials.new(name="M_Rand_Grain")
    mat_grain.use_nodes = True
    bsdf = mat_grain.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.30
    bsdf.inputs["Coat Weight"].default_value = 0.85
    bsdf.inputs["Coat Roughness"].default_value = 0.12
    tc = mat_grain.node_tree.nodes.new("ShaderNodeTexCoord")

    voro_pores = mat_grain.node_tree.nodes.new("ShaderNodeTexVoronoi")
    voro_pores.feature = "DISTANCE_TO_EDGE"
    voro_pores.inputs["Scale"].default_value = 2400.0
    mat_grain.node_tree.links.new(tc.outputs["Object"], voro_pores.inputs["Vector"])

    noise_grain = mat_grain.node_tree.nodes.new("ShaderNodeTexNoise")
    noise_grain.inputs["Scale"].default_value = 1200.0
    noise_grain.inputs["Detail"].default_value = 8.0
    noise_grain.inputs["Roughness"].default_value = 0.72
    mat_grain.node_tree.links.new(tc.outputs["Object"], noise_grain.inputs["Vector"])

    noise_patina = mat_grain.node_tree.nodes.new("ShaderNodeTexNoise")
    noise_patina.inputs["Scale"].default_value = 100.0
    mat_grain.node_tree.links.new(tc.outputs["Object"], noise_patina.inputs["Vector"])

    mix_noise = mat_grain.node_tree.nodes.new("ShaderNodeMix")
    mix_noise.data_type = "FLOAT"
    mix_noise.inputs["Factor"].default_value = 0.35
    mat_grain.node_tree.links.new(noise_patina.outputs["Fac"], mix_noise.inputs["A"])
    mat_grain.node_tree.links.new(noise_grain.outputs["Fac"], mix_noise.inputs["B"])

    cr_color = mat_grain.node_tree.nodes.new("ShaderNodeValToRGB")
    cr_color.color_ramp.elements[0].position = 0.20
    cr_color.color_ramp.elements[0].color = (0.018, 0.005, 0.0015, 1.0)
    cr_color.color_ramp.elements[1].position = 0.80
    cr_color.color_ramp.elements[1].color = (0.075, 0.022, 0.006, 1.0)
    mat_grain.node_tree.links.new(mix_noise.outputs["Result"], cr_color.inputs["Fac"])
    mat_grain.node_tree.links.new(cr_color.outputs["Color"], bsdf.inputs["Base Color"])

    bump_pores = mat_grain.node_tree.nodes.new("ShaderNodeBump")
    bump_pores.inputs["Strength"].default_value = 0.35
    bump_pores.inputs["Distance"].default_value = 0.00012
    mat_grain.node_tree.links.new(voro_pores.outputs["Distance"], bump_pores.inputs["Height"])

    bump_grain = mat_grain.node_tree.nodes.new("ShaderNodeBump")
    bump_grain.inputs["Strength"].default_value = 0.25
    bump_grain.inputs["Distance"].default_value = 0.00015
    mat_grain.node_tree.links.new(noise_grain.outputs["Fac"], bump_grain.inputs["Height"])
    mat_grain.node_tree.links.new(bump_pores.outputs["Normal"], bump_grain.inputs["Normal"])
    mat_grain.node_tree.links.new(bump_grain.outputs["Normal"], bsdf.inputs["Normal"])

    # Suede
    mat_suede = bpy.data.materials.new(name="M_Rand_Flesh_Suede")
    mat_suede.use_nodes = True
    bsdf2 = mat_suede.node_tree.nodes["Principled BSDF"]
    bsdf2.inputs["Base Color"].default_value = (0.16, 0.075, 0.030, 1.0)
    bsdf2.inputs["Roughness"].default_value = 0.92

    # Cut End
    mat_cut = bpy.data.materials.new(name="M_Rand_Cut_End")
    mat_cut.use_nodes = True
    bsdf3 = mat_cut.node_tree.nodes["Principled BSDF"]
    bsdf3.inputs["Base Color"].default_value = (0.065, 0.022, 0.008, 1.0)

    return mat_grain, mat_suede, mat_cut

def build_mesh():
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
    profile = [(-0.8, -0.0005), (-0.4, -0.0005), (-0.1, -0.0005), (0.2, -0.0005), (0.35, -0.0005)]
    cy = 0.35
    cz = 0.35 - 0.0005
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
    
    mat_cyc = bpy.data.materials.new("PBR_Cyc")
    mat_cyc.use_nodes = True
    mat_cyc.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.82, 0.81, 0.79, 1.0)
    mat_cyc.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.95
    cyc_obj.data.materials.append(mat_cyc)
    scene.collection.objects.link(cyc_obj)

    l_key = bpy.data.lights.new("Key_Light", "AREA")
    l_key.energy = 4.2
    l_key.size = 0.38
    l_key.color = (1.0, 0.98, 0.95)
    o_key = bpy.data.objects.new("Key_Light", l_key)
    o_key.location = (0.16, -0.12, 0.22)
    o_key.rotation_euler = (math.radians(48), math.radians(18), math.radians(35))
    scene.collection.objects.link(o_key)

    l_fill = bpy.data.lights.new("Fill_Light", "AREA")
    l_fill.energy = 0.75
    l_fill.size = 0.50
    l_fill.color = (0.95, 0.97, 1.0)
    o_fill = bpy.data.objects.new("Fill_Light", l_fill)
    o_fill.location = (-0.18, -0.08, 0.16)
    o_fill.rotation_euler = (math.radians(45), math.radians(-25), math.radians(-45))
    scene.collection.objects.link(o_fill)

    l_rim = bpy.data.lights.new("Rim_Light", "AREA")
    l_rim.energy = 3.2
    l_rim.size = 0.22
    l_rim.color = (1.0, 1.0, 0.98)
    o_rim = bpy.data.objects.new("Rim_Light", l_rim)
    o_rim.location = (0.0, 0.15, 0.18)
    o_rim.rotation_euler = (math.radians(-52), 0, math.radians(180))
    scene.collection.objects.link(o_rim)

def render_two_macros():
    clean_scene()
    setup_studio()
    rand_obj = build_mesh()
    bpy.context.scene.collection.objects.link(rand_obj)

    scene = bpy.context.scene

    # Macro 1: Cross-Section at Left Breast Cut
    cam_data1 = bpy.data.cameras.new("Cam_CS")
    cam_data1.lens = 95.0
    cam_data1.dof.use_dof = False
    cam_data1.clip_start = 0.001
    cam1 = bpy.data.objects.new("Cam_CS", cam_data1)
    # Breast cut is at (-0.034, 0.038, 0.0034)
    # Position camera slightly in front of breast cut (+Y) and outside (-X), looking down-back at it
    cam1.location = (-0.052, 0.058, 0.022)
    scene.collection.objects.link(cam1)
    scene.camera = cam1

    tgt1 = bpy.data.objects.new("Tgt_CS", None)
    tgt1.location = (-0.034, 0.035, 0.0034)
    scene.collection.objects.link(tgt1)
    track1 = cam1.constraints.new(type="TRACK_TO")
    track1.target = tgt1
    track1.track_axis = "TRACK_NEGATIVE_Z"
    track1.up_axis = "UP_Y"

    out1 = os.path.join(OUTPUT_DIR, "Leather_Rand_Piece_03_Macro_CrossSection.jpg")
    scene.render.filepath = out1
    bpy.ops.render.render(write_still=True)
    shutil.copy2(out1, os.path.join(WEB_DIR, "Leather_Rand_Piece_03_Macro_CrossSection.jpg"))
    print("Rendered Cross-Section Macro")

    # Macro 2: Rear Curvature
    bpy.data.objects.remove(cam1, do_unlink=True)
    bpy.data.objects.remove(tgt1, do_unlink=True)

    cam_data2 = bpy.data.cameras.new("Cam_Rear")
    cam_data2.lens = 90.0
    cam_data2.dof.use_dof = False
    cam_data2.clip_start = 0.001
    cam2 = bpy.data.objects.new("Cam_Rear", cam_data2)
    # Rear curve is at (0.0, -0.042, 0.0034)
    cam2.location = (0.0, -0.092, 0.034)
    scene.collection.objects.link(cam2)
    scene.camera = cam2

    tgt2 = bpy.data.objects.new("Tgt_Rear", None)
    tgt2.location = (0.0, -0.042, 0.0034)
    scene.collection.objects.link(tgt2)
    track2 = cam2.constraints.new(type="TRACK_TO")
    track2.target = tgt2
    track2.track_axis = "TRACK_NEGATIVE_Z"
    track2.up_axis = "UP_Y"

    out2 = os.path.join(OUTPUT_DIR, "Leather_Rand_Piece_03_Rear_Curvature_Macro.jpg")
    scene.render.filepath = out2
    bpy.ops.render.render(write_still=True)
    shutil.copy2(out2, os.path.join(WEB_DIR, "Leather_Rand_Piece_03_Rear_Curvature_Macro.jpg"))
    print("Rendered Rear Curvature Macro")

render_two_macros()

