import bpy
import bmesh
import math
import os
import shutil
from mathutils import Vector, Matrix, Euler

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

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

def create_materials():
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

    # Visible leather pores
    voro_pores = nodes.new("ShaderNodeTexVoronoi")
    voro_pores.feature = "DISTANCE_TO_EDGE"
    voro_pores.inputs["Scale"].default_value = 2400.0
    links.new(tc.outputs["Object"], voro_pores.inputs["Vector"])

    # Fine tumbling grain with dark crevice contrast
    noise_grain = nodes.new("ShaderNodeTexNoise")
    noise_grain.inputs["Scale"].default_value = 1200.0
    noise_grain.inputs["Detail"].default_value = 8.0
    noise_grain.inputs["Roughness"].default_value = 0.72
    links.new(tc.outputs["Object"], noise_grain.inputs["Vector"])

    # Hand-curried leather pull-up patina (deep espresso to rich mahogany)
    noise_patina = nodes.new("ShaderNodeTexNoise")
    noise_patina.inputs["Scale"].default_value = 100.0
    noise_patina.inputs["Detail"].default_value = 5.0
    noise_patina.inputs["Roughness"].default_value = 0.50
    links.new(tc.outputs["Object"], noise_patina.inputs["Vector"])

    # Blend noise grain into color for rich cell crevices
    mix_noise = nodes.new("ShaderNodeMix")
    mix_noise.data_type = "FLOAT"
    mix_noise.inputs["Factor"].default_value = 0.35
    links.new(noise_patina.outputs["Fac"], mix_noise.inputs["A"])
    links.new(noise_grain.outputs["Fac"], mix_noise.inputs["B"])

    cr_color = nodes.new("ShaderNodeValToRGB")
    cr_color.color_ramp.elements[0].position = 0.20
    cr_color.color_ramp.elements[0].color = (0.018, 0.005, 0.0015, 1.0) # Deep espresso burnished edge
    cr_color.color_ramp.elements[1].position = 0.80
    cr_color.color_ramp.elements[1].color = (0.075, 0.022, 0.006, 1.0) # Rich dark chestnut mahogany
    links.new(mix_noise.outputs["Result"], cr_color.inputs["Fac"])
    links.new(cr_color.outputs["Color"], bsdf.inputs["Base Color"])

    # Distinct micro-bump
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

    # Suede inner wall (warm medium tan)
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

    # Cut end material
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

def render_hero():
    clean_scene()
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
        bg.inputs["Strength"].default_value = 0.14 # Low ambient for rich contact shadow

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

    # Dominant Key light from top-right for realistic directional shadow
    l_key = bpy.data.lights.new("Key_Light", "AREA")
    l_key.energy = 4.2
    l_key.size = 0.38
    l_key.color = (1.0, 0.98, 0.95)
    o_key = bpy.data.objects.new("Key_Light", l_key)
    o_key.location = (0.16, -0.12, 0.22)
    o_key.rotation_euler = (math.radians(48), math.radians(18), math.radians(35))
    scene.collection.objects.link(o_key)

    # Soft subtle Fill light
    l_fill = bpy.data.lights.new("Fill_Light", "AREA")
    l_fill.energy = 0.75
    l_fill.size = 0.50
    l_fill.color = (0.95, 0.97, 1.0)
    o_fill = bpy.data.objects.new("Fill_Light", l_fill)
    o_fill.location = (-0.18, -0.08, 0.16)
    o_fill.rotation_euler = (math.radians(45), math.radians(-25), math.radians(-45))
    scene.collection.objects.link(o_fill)

    # Rim kick light: sharp top edge reflection
    l_rim = bpy.data.lights.new("Rim_Light", "AREA")
    l_rim.energy = 3.2
    l_rim.size = 0.22
    l_rim.color = (1.0, 1.0, 0.98)
    o_rim = bpy.data.objects.new("Rim_Light", l_rim)
    o_rim.location = (0.0, 0.15, 0.18)
    o_rim.rotation_euler = (math.radians(-52), 0, math.radians(180))
    scene.collection.objects.link(o_rim)

    rand_obj = build_mesh()
    scene.collection.objects.link(rand_obj)

    # Camera framing matching media_1789396807239.jpg
    cam_data = bpy.data.cameras.new("HeroCam")
    cam_data.lens = 85.0
    cam_data.dof.use_dof = False
    cam_obj = bpy.data.objects.new("HeroCam", cam_data)
    cam_obj.location = (0.0, -0.140, 0.095)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    empty = bpy.data.objects.new("Target", None)
    empty.location = (0.0, -0.005, 0.003)
    scene.collection.objects.link(empty)

    track = cam_obj.constraints.new(type="TRACK_TO")
    track.target = empty
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    out_file = os.path.abspath("luxury-shoe-001/renders/pieces/leather_rand/Leather_Rand_Piece_03_Hero_Reference.jpg")
    scene.render.filepath = out_file
    print("Rendering Hero Reference...")
    bpy.ops.render.render(write_still=True)
    print(f"Rendered -> {out_file}")

    web_out = os.path.abspath("web/public/pieces/leather_rand/Leather_Rand_Piece_03_Hero_Reference.jpg")
    shutil.copy2(out_file, web_out)

    master_out = os.path.abspath("luxury-shoe-001/renders/pieces/Piece_03_Leather_Rand.jpg")
    web_master_out = os.path.abspath("web/public/pieces/Piece_03_Leather_Rand.jpg")
    shutil.copy2(out_file, master_out)
    shutil.copy2(out_file, web_master_out)

render_hero()
