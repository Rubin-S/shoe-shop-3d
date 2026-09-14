import bpy
import bmesh
import math
import os
import shutil

OUTPUT_DIR = os.path.abspath("luxury-shoe-001/renders/pieces/outsole")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

# Footwear Proportions
L = 0.295 # 295mm
y_heel_rear = -0.125
y_heel_breast = -0.045
y_waist_apex = -0.005
y_ball = 0.065
y_cap = 0.115
y_toe_tip = 0.170

w_heel_med = 0.034
w_heel_lat = 0.034
w_waist_med = 0.028
w_waist_lat = 0.026
w_ball_med = 0.054
w_ball_lat = 0.050
w_toe_med = 0.016
w_toe_lat = 0.014

def get_widths(y):
    if y <= y_heel_breast:
        t = (y - y_heel_rear) / (y_heel_breast - y_heel_rear)
        if t < 0.55:
            theta = (t / 0.55) * (math.pi / 2.0)
            wm = w_heel_med * math.sin(theta)
            wl = w_heel_lat * math.sin(theta)
        else:
            wm = w_heel_med
            wl = w_heel_lat
    elif y <= y_ball:
        t = (y - y_heel_breast) / (y_ball - y_heel_breast)
        if t < 0.40:
            s = t / 0.40
            wm = w_heel_med + (w_waist_med - w_heel_med) * (3*s*s - 2*s*s*s)
            wl = w_heel_lat + (w_waist_lat - w_heel_lat) * (3*s*s - 2*s*s*s)
        else:
            s = (t - 0.40) / 0.60
            wm = w_waist_med + (w_ball_med - w_waist_med) * (3*s*s - 2*s*s*s)
            wl = w_waist_lat + (w_ball_lat - w_waist_lat) * (3*s*s - 2*s*s*s)
    elif y <= y_cap:
        s = (y - y_ball) / (y_cap - y_ball)
        wm = w_ball_med + (0.046 - w_ball_med) * s
        wl = w_ball_lat + (0.042 - w_ball_lat) * s
    else:
        s = (y - y_cap) / (y_toe_tip - y_cap)
        if s < 0.70:
            u = s / 0.70
            wm = 0.046 + (0.034 - 0.046) * (u * u)
            wl = 0.042 + (0.030 - 0.042) * (u * u)
        else:
            u = (s - 0.70) / 0.30
            wm = 0.034 + (w_toe_med - 0.034) * u
            wl = 0.030 + (w_toe_lat - 0.030) * u
    return max(0.001, wm), max(0.001, wl)

def get_vertical_profile(y):
    thickness = 0.0052
    if y <= y_heel_breast:
        z_bot_center = 0.0264
        z_bot_edge = 0.0264
        z_top_edge = z_bot_edge + thickness
        z_top_center = z_top_edge
        fiddle = 0.0
    elif y <= y_ball:
        t = (y - y_heel_breast) / (y_ball - y_heel_breast)
        arch_height = 0.016 * math.sin(t * math.pi)
        z_base = 0.0264 * (1.0 - t*t*(3 - 2*t))
        z_bot_edge = z_base + arch_height
        fiddle = math.sin(t * math.pi) ** 1.3
        z_bot_center = z_bot_edge - 0.0050 * fiddle
        waist_edge_thickness = thickness - 0.0024 * fiddle
        z_top_edge = z_bot_edge + waist_edge_thickness
        z_top_center = z_bot_center + thickness
    else:
        t = (y - y_ball) / (y_toe_tip - y_ball)
        toe_spring = 0.014 * (t ** 2.2)
        z_bot_center = toe_spring
        z_bot_edge = toe_spring
        z_top_edge = toe_spring + thickness
        z_top_center = z_top_edge
        fiddle = 0.0
    return z_bot_center, z_bot_edge, z_top_center, z_top_edge, fiddle

def create_materials():
    # 1. Bottom Oak-Bark Leather with Fiddleback Patina
    mat_bottom = bpy.data.materials.new(name="M_Sole_OakBark_Bottom")
    mat_bottom.use_nodes = True
    bsdf_bot = mat_bottom.node_tree.nodes["Principled BSDF"]
    bsdf_bot.inputs["Roughness"].default_value = 0.32
    bsdf_bot.inputs["Coat Weight"].default_value = 0.70
    bsdf_bot.inputs["Coat Roughness"].default_value = 0.14
    
    tc = mat_bottom.node_tree.nodes.new("ShaderNodeTexCoord")
    
    # Procedural micro pores
    voro_pores = mat_bottom.node_tree.nodes.new("ShaderNodeTexVoronoi")
    voro_pores.feature = "DISTANCE_TO_EDGE"
    voro_pores.inputs["Scale"].default_value = 2800.0
    mat_bottom.node_tree.links.new(tc.outputs["Object"], voro_pores.inputs["Vector"])
    
    # Leather grain tumbling
    noise_grain = mat_bottom.node_tree.nodes.new("ShaderNodeTexNoise")
    noise_grain.inputs["Scale"].default_value = 1400.0
    noise_grain.inputs["Detail"].default_value = 6.0
    noise_grain.inputs["Roughness"].default_value = 0.65
    mat_bottom.node_tree.links.new(tc.outputs["Object"], noise_grain.inputs["Vector"])
    
    # Hand-burnished patina gradient (center amber to edge dark espresso)
    sep_xyz = mat_bottom.node_tree.nodes.new("ShaderNodeSeparateXYZ")
    mat_bottom.node_tree.links.new(tc.outputs["Object"], sep_xyz.inputs["Vector"])
    
    math_abs_x = mat_bottom.node_tree.nodes.new("ShaderNodeMath")
    math_abs_x.operation = "ABSOLUTE"
    mat_bottom.node_tree.links.new(sep_xyz.outputs["X"], math_abs_x.inputs[0])
    
    cr_burnish = mat_bottom.node_tree.nodes.new("ShaderNodeValToRGB")
    cr_burnish.color_ramp.elements[0].position = 0.00
    cr_burnish.color_ramp.elements[0].color = (0.28, 0.12, 0.035, 1.0) # Warm Oak Tan
    cr_burnish.color_ramp.elements[1].position = 0.045
    cr_burnish.color_ramp.elements[1].color = (0.05, 0.016, 0.005, 1.0) # Deep Espresso Edge
    mat_bottom.node_tree.links.new(math_abs_x.outputs["Value"], cr_burnish.inputs["Fac"])
    
    # Mix noise with burnish color
    mix_color = mat_bottom.node_tree.nodes.new("ShaderNodeMix")
    mix_color.data_type = "RGBA"
    mix_color.inputs["Factor"].default_value = 0.22
    mat_bottom.node_tree.links.new(noise_grain.outputs["Fac"], mix_color.inputs["Factor"])
    mat_bottom.node_tree.links.new(cr_burnish.outputs["Color"], mix_color.inputs["A"])
    
    cr_tint = mat_bottom.node_tree.nodes.new("ShaderNodeValToRGB")
    cr_tint.color_ramp.elements[0].color = (0.35, 0.15, 0.045, 1.0)
    cr_tint.color_ramp.elements[1].color = (0.18, 0.07, 0.018, 1.0)
    mat_bottom.node_tree.links.new(noise_grain.outputs["Fac"], cr_tint.inputs["Fac"])
    mat_bottom.node_tree.links.new(cr_tint.outputs["Color"], mix_color.inputs["B"])
    mat_bottom.node_tree.links.new(mix_color.outputs["Result"], bsdf_bot.inputs["Base Color"])
    
    # Bump mapping
    bump_pores = mat_bottom.node_tree.nodes.new("ShaderNodeBump")
    bump_pores.inputs["Strength"].default_value = 0.22
    bump_pores.inputs["Distance"].default_value = 0.00010
    mat_bottom.node_tree.links.new(voro_pores.outputs["Distance"], bump_pores.inputs["Height"])
    
    bump_grain = mat_bottom.node_tree.nodes.new("ShaderNodeBump")
    bump_grain.inputs["Strength"].default_value = 0.18
    bump_grain.inputs["Distance"].default_value = 0.00015
    mat_bottom.node_tree.links.new(noise_grain.outputs["Fac"], bump_grain.inputs["Height"])
    mat_bottom.node_tree.links.new(bump_pores.outputs["Normal"], bump_grain.inputs["Normal"])
    mat_bottom.node_tree.links.new(bump_grain.outputs["Normal"], bsdf_bot.inputs["Normal"])
    
    # 2. Top Insole-Facing Bed (Natural Unburnished Veg-Tan)
    mat_top = bpy.data.materials.new(name="M_Sole_VegTan_Top")
    mat_top.use_nodes = True
    bsdf_top = mat_top.node_tree.nodes["Principled BSDF"]
    bsdf_top.inputs["Base Color"].default_value = (0.48, 0.38, 0.26, 1.0) # Natural parchment veg-tan
    bsdf_top.inputs["Roughness"].default_value = 0.88
    
    # 3. Edge Dressing (Dark Burnished Iron-Waxed Rim)
    mat_edge = bpy.data.materials.new(name="M_Sole_Edge_Dressing")
    mat_edge.use_nodes = True
    bsdf_edge = mat_edge.node_tree.nodes["Principled BSDF"]
    bsdf_edge.inputs["Base Color"].default_value = (0.022, 0.008, 0.003, 1.0) # Obsidian edge
    bsdf_edge.inputs["Roughness"].default_value = 0.22
    bsdf_edge.inputs["Coat Weight"].default_value = 0.85
    bsdf_edge.inputs["Coat Roughness"].default_value = 0.10
    
    return mat_bottom, mat_top, mat_edge

def build_outsole():
    mesh = bpy.data.meshes.new("Mesh_Piece_04_Outsole")
    bm = bmesh.new()
    
    mat_bottom, mat_top, mat_edge = create_materials()
    
    num_y = 100
    num_x = 25
    
    y_stations = []
    for j in range(num_y):
        t = j / float(num_y - 1)
        y = y_heel_rear + t * (y_toe_tip - y_heel_rear)
        y_stations.append(y)
        
    bot_grid = []
    top_grid = []
    
    for j, y in enumerate(y_stations):
        wm, wl = get_widths(y)
        z_bc, z_be, z_tc, z_te, fiddle = get_vertical_profile(y)
        
        bot_row = []
        top_row = []
        
        for i in range(num_x):
            u = -1.0 + 2.0 * (i / float(num_x - 1))
            abs_u = abs(u)
            x = (u * wm) if u >= 0 else (u * wl)
            
            if fiddle > 0.01:
                crest = (1.0 - (abs_u ** 0.82))
                zb = z_be - (z_be - z_bc) * crest
            else:
                zb = z_bc + 0.0004 * (abs_u ** 2)
                if y > y_ball and y < y_toe_tip - 0.004:
                    groove = math.exp(-((abs_u - 0.88) / 0.032) ** 2)
                    zb += 0.0006 * groove
                    
            if y <= y_heel_breast:
                zt = z_tc
            elif y <= y_ball:
                zt = z_te - 0.0006 * (1.0 - abs_u ** 2) * fiddle
            else:
                if abs_u < 0.80:
                    recess = 0.0012 * (1.0 - (abs_u / 0.80) ** 4)
                    zt = z_te - recess
                else:
                    zt = z_te
                    
            v_bot = bm.verts.new((x, y, zb))
            v_top = bm.verts.new((x, y, zt))
            bot_row.append(v_bot)
            top_row.append(v_top)
            
        bot_grid.append(bot_row)
        top_grid.append(top_row)
        
    bm.verts.ensure_lookup_table()
    
    # Faces: Bottom surface
    for j in range(num_y - 1):
        for i in range(num_x - 1):
            f_bot = bm.faces.new((
                bot_grid[j][i],
                bot_grid[j+1][i],
                bot_grid[j+1][i+1],
                bot_grid[j][i+1]
            ))
            f_bot.material_index = 0
            f_bot.smooth = True
            
    # Faces: Top surface
    for j in range(num_y - 1):
        for i in range(num_x - 1):
            f_top = bm.faces.new((
                top_grid[j][i],
                top_grid[j][i+1],
                top_grid[j+1][i+1],
                top_grid[j+1][i]
            ))
            f_top.material_index = 1
            f_top.smooth = True
            
    # Faces: Lateral Sidewall (i = 0)
    for j in range(num_y - 1):
        f_lat = bm.faces.new((
            top_grid[j][0],
            top_grid[j+1][0],
            bot_grid[j+1][0],
            bot_grid[j][0]
        ))
        f_lat.material_index = 2
        f_lat.smooth = True
        
    # Faces: Medial Sidewall (i = num_x - 1)
    for j in range(num_y - 1):
        f_med = bm.faces.new((
            bot_grid[j][num_x-1],
            bot_grid[j+1][num_x-1],
            top_grid[j+1][num_x-1],
            top_grid[j][num_x-1]
        ))
        f_med.material_index = 2
        f_med.smooth = True
        
    # Faces: Heel Back Edge (j = 0)
    for i in range(num_x - 1):
        f_rear = bm.faces.new((
            bot_grid[0][i],
            bot_grid[0][i+1],
            top_grid[0][i+1],
            top_grid[0][i]
        ))
        f_rear.material_index = 2
        f_rear.smooth = True
        
    # Faces: Toe Tip Front Edge (j = num_y - 1)
    for i in range(num_x - 1):
        f_front = bm.faces.new((
            top_grid[num_y-1][i],
            top_grid[num_y-1][i+1],
            bot_grid[num_y-1][i+1],
            bot_grid[num_y-1][i]
        ))
        f_front.material_index = 2
        f_front.smooth = True
        
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new("Piece_04_Outsole", mesh)
    obj.data.materials.append(mat_bottom)
    obj.data.materials.append(mat_top)
    obj.data.materials.append(mat_edge)
    bpy.context.scene.collection.objects.link(obj)
    
    bev = obj.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.00025
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
    scene.view_settings.exposure = 0.08
    
    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.78, 0.77, 0.75, 1.0)
        bg.inputs["Strength"].default_value = 0.16
        
    # Backdrop
    mesh_cyc = bpy.data.meshes.new("Cyclorama")
    bm = bmesh.new()
    w = 3.0
    hw = w / 2.0
    profile = [(-1.5, -0.05), (-0.8, -0.05), (-0.2, -0.05), (0.4, -0.05)]
    cy = 0.4
    cz = 0.35 - 0.05
    r = 0.4
    for i in range(1, 10):
        ang = -math.pi / 2.0 + (i / 10.0) * (math.pi / 2.0)
        profile.append((cy + r * math.cos(ang), cz + r * math.sin(ang)))
    for z in [0.8, 2.0]:
        profile.append((cy + r, z))
    vl = [bm.verts.new((-hw, y, z)) for y, z in profile]
    vr = [bm.verts.new((hw, y, z)) for y, z in profile]
    for i in range(len(profile) - 1):
        bm.faces.new((vl[i], vr[i], vr[i+1], vl[i+1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh_cyc)
    bm.free()
    for p in mesh_cyc.polygons:
        p.use_smooth = True
    cyc_obj = bpy.data.objects.new("Cyclorama", mesh_cyc)
    mat_cyc = bpy.data.materials.new("PBR_Cyc")
    mat_cyc.use_nodes = True
    mat_cyc.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.84, 0.83, 0.81, 1.0)
    mat_cyc.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.95
    cyc_obj.data.materials.append(mat_cyc)
    scene.collection.objects.link(cyc_obj)
    
    # Lighting
    l_key = bpy.data.lights.new("Key", "AREA")
    l_key.energy = 5.2
    l_key.size = 0.45
    l_key.color = (1.0, 0.98, 0.95)
    ok = bpy.data.objects.new("Key", l_key)
    ok.location = (0.22, -0.10, 0.35)
    ok.rotation_euler = (math.radians(45), math.radians(18), math.radians(35))
    scene.collection.objects.link(ok)
    
    l_fill = bpy.data.lights.new("Fill", "AREA")
    l_fill.energy = 1.2
    l_fill.size = 0.60
    l_fill.color = (0.95, 0.97, 1.0)
    of = bpy.data.objects.new("Fill", l_fill)
    of.location = (-0.25, -0.05, 0.28)
    of.rotation_euler = (math.radians(40), math.radians(-25), math.radians(-45))
    scene.collection.objects.link(of)
    
    l_rim = bpy.data.lights.new("Rim", "AREA")
    l_rim.energy = 4.0
    l_rim.size = 0.30
    l_rim.color = (1.0, 1.0, 0.98)
    orim = bpy.data.objects.new("Rim", l_rim)
    orim.location = (0.0, 0.25, 0.25)
    orim.rotation_euler = (math.radians(-50), 0, math.radians(180))
    scene.collection.objects.link(orim)
    
    # Ground bounce
    l_bot = bpy.data.lights.new("Bot_Light", "AREA")
    l_bot.energy = 3.5
    l_bot.size = 0.50
    l_bot.color = (1.0, 0.97, 0.92)
    obot = bpy.data.objects.new("Bot_Light", l_bot)
    obot.location = (0.0, 0.02, -0.25)
    obot.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(obot)

def test_bottom_render():
    clean_scene()
    setup_studio()
    outsole = build_outsole()
    scene = bpy.context.scene
    
    # Camera looking at bottom from below
    cam_data = bpy.data.cameras.new("Cam_Bottom")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 0.34
    cam_data.clip_start = 0.001
    cam = bpy.data.objects.new("Cam_Bottom", cam_data)
    # Looking up at bottom
    cam.location = (0.0, 0.022, -0.45)
    cam.rotation_euler = (math.radians(180), 0, math.radians(-90)) # Horizontal orientation: heel left, toe right
    scene.collection.objects.link(cam)
    scene.camera = cam
    
    out_file = os.path.join(OUTPUT_DIR, "test_outsole_bottom.jpg")
    scene.render.filepath = out_file
    print(f"Rendering test bottom view to {out_file}...")
    bpy.ops.render.render(write_still=True)
    print("Test render complete!")

test_bottom_render()
