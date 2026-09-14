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

# Master Anatomical Stations from build_stitched_master.py
# (y, half_wm, half_wl, z_feather, z_sole_thickness, spine_fac)
STATIONS_REF = [
    # y, wm, wl, z_feather, sole_th, spine
    (-0.126, 0.024, 0.024, 0.0270, 0.0055, 0.0), # 0 Heel rear
    (-0.105, 0.031, 0.030, 0.0270, 0.0055, 0.0), # 1 Heel seat
    (-0.082, 0.033, 0.032, 0.0270, 0.0055, 0.0), # 2 Heel breast
    (-0.055, 0.030, 0.027, 0.0220, 0.0035, 0.5), # 3 Waist rear
    (-0.025, 0.034, 0.029, 0.0180, 0.0032, 1.0), # 4 Waist apex (fiddleback)
    ( 0.005, 0.044, 0.038, 0.0140, 0.0040, 0.6), # 5 Instep throat entry
    ( 0.035, 0.052, 0.046, 0.0080, 0.0052, 0.0), # 6 Ball rear
    ( 0.055, 0.055, 0.050, 0.0060, 0.0055, 0.0), # 7 Ball pivot
    ( 0.080, 0.051, 0.047, 0.0080, 0.0055, 0.0), # 8 Cap-toe seam
    ( 0.110, 0.045, 0.040, 0.0120, 0.0055, 0.0), # 9 Toe vamp
    ( 0.138, 0.037, 0.032, 0.0150, 0.0055, 0.0), # 10 Chisel shoulder
    ( 0.158, 0.026, 0.022, 0.0180, 0.0055, 0.0), # 11 Chisel cliff dive
    ( 0.168, 0.015, 0.013, 0.0190, 0.0055, 0.0)  # 12 Toe tip
]

def interpolate_station(y):
    # Find surrounding stations
    if y <= STATIONS_REF[0][0]:
        return STATIONS_REF[0][1:]
    if y >= STATIONS_REF[-1][0]:
        return STATIONS_REF[-1][1:]
    
    for i in range(len(STATIONS_REF) - 1):
        y0 = STATIONS_REF[i][0]
        y1 = STATIONS_REF[i+1][0]
        if y0 <= y <= y1:
            t = (y - y0) / (y1 - y0)
            # Smooth hermite blend
            s = t * t * (3.0 - 2.0 * t)
            p0 = STATIONS_REF[i][1:]
            p1 = STATIONS_REF[i+1][1:]
            res = [p0[k] + (p1[k] - p0[k]) * s for k in range(len(p0))]
            return res
    return STATIONS_REF[-1][1:]

def create_materials():
    # 1. Bottom Oak-Bark Leather with Fiddleback Patina
    mat_bottom = bpy.data.materials.new(name="M_Outsole_OakBark_Bottom")
    mat_bottom.use_nodes = True
    bsdf_bot = mat_bottom.node_tree.nodes["Principled BSDF"]
    bsdf_bot.inputs["Roughness"].default_value = 0.34
    bsdf_bot.inputs["Coat Weight"].default_value = 0.65
    bsdf_bot.inputs["Coat Roughness"].default_value = 0.16
    
    tc = mat_bottom.node_tree.nodes.new("ShaderNodeTexCoord")
    
    voro_pores = mat_bottom.node_tree.nodes.new("ShaderNodeTexVoronoi")
    voro_pores.feature = "DISTANCE_TO_EDGE"
    voro_pores.inputs["Scale"].default_value = 3600.0
    mat_bottom.node_tree.links.new(tc.outputs["Object"], voro_pores.inputs["Vector"])
    
    noise_grain = mat_bottom.node_tree.nodes.new("ShaderNodeTexNoise")
    noise_grain.inputs["Scale"].default_value = 1600.0
    noise_grain.inputs["Detail"].default_value = 6.0
    noise_grain.inputs["Roughness"].default_value = 0.68
    mat_bottom.node_tree.links.new(tc.outputs["Object"], noise_grain.inputs["Vector"])
    
    # Patina gradient
    sep_xyz = mat_bottom.node_tree.nodes.new("ShaderNodeSeparateXYZ")
    mat_bottom.node_tree.links.new(tc.outputs["Object"], sep_xyz.inputs["Vector"])
    
    math_abs_x = mat_bottom.node_tree.nodes.new("ShaderNodeMath")
    math_abs_x.operation = "ABSOLUTE"
    mat_bottom.node_tree.links.new(sep_xyz.outputs["X"], math_abs_x.inputs[0])
    
    cr_burnish = mat_bottom.node_tree.nodes.new("ShaderNodeValToRGB")
    cr_burnish.color_ramp.elements[0].position = 0.00
    cr_burnish.color_ramp.elements[0].color = (0.36, 0.16, 0.050, 1.0) # Warm Amber Oak
    cr_burnish.color_ramp.elements[1].position = 0.040
    cr_burnish.color_ramp.elements[1].color = (0.045, 0.015, 0.004, 1.0) # Dark Burnished Edge
    mat_bottom.node_tree.links.new(math_abs_x.outputs["Value"], cr_burnish.inputs["Fac"])
    
    mix_color = mat_bottom.node_tree.nodes.new("ShaderNodeMix")
    mix_color.data_type = "RGBA"
    mix_color.inputs["Factor"].default_value = 0.22
    mat_bottom.node_tree.links.new(noise_grain.outputs["Fac"], mix_color.inputs["Factor"])
    mat_bottom.node_tree.links.new(cr_burnish.outputs["Color"], mix_color.inputs["A"])
    
    cr_tint = mat_bottom.node_tree.nodes.new("ShaderNodeValToRGB")
    cr_tint.color_ramp.elements[0].color = (0.42, 0.18, 0.060, 1.0)
    cr_tint.color_ramp.elements[1].color = (0.18, 0.07, 0.018, 1.0)
    mat_bottom.node_tree.links.new(noise_grain.outputs["Fac"], cr_tint.inputs["Fac"])
    mat_bottom.node_tree.links.new(cr_tint.outputs["Color"], mix_color.inputs["B"])
    mat_bottom.node_tree.links.new(mix_color.outputs["Result"], bsdf_bot.inputs["Base Color"])
    
    bump_pores = mat_bottom.node_tree.nodes.new("ShaderNodeBump")
    bump_pores.inputs["Strength"].default_value = 0.24
    bump_pores.inputs["Distance"].default_value = 0.00010
    mat_bottom.node_tree.links.new(voro_pores.outputs["Distance"], bump_pores.inputs["Height"])
    
    bump_grain = mat_bottom.node_tree.nodes.new("ShaderNodeBump")
    bump_grain.inputs["Strength"].default_value = 0.18
    bump_grain.inputs["Distance"].default_value = 0.00014
    mat_bottom.node_tree.links.new(noise_grain.outputs["Fac"], bump_grain.inputs["Height"])
    mat_bottom.node_tree.links.new(bump_pores.outputs["Normal"], bump_grain.inputs["Normal"])
    mat_bottom.node_tree.links.new(bump_grain.outputs["Normal"], bsdf_bot.inputs["Normal"])
    
    # 2. Top Insole-Facing Bed (Natural Parchment Veg-Tan)
    mat_top = bpy.data.materials.new(name="M_Outsole_VegTan_Top")
    mat_top.use_nodes = True
    bsdf_top = mat_top.node_tree.nodes["Principled BSDF"]
    bsdf_top.inputs["Base Color"].default_value = (0.48, 0.38, 0.26, 1.0)
    bsdf_top.inputs["Roughness"].default_value = 0.88
    
    # 3. Edge Dressing
    mat_edge = bpy.data.materials.new(name="M_Outsole_Edge_Dressing")
    mat_edge.use_nodes = True
    bsdf_edge = mat_edge.node_tree.nodes["Principled BSDF"]
    bsdf_edge.inputs["Base Color"].default_value = (0.018, 0.006, 0.002, 1.0)
    bsdf_edge.inputs["Roughness"].default_value = 0.20
    bsdf_edge.inputs["Coat Weight"].default_value = 0.88
    bsdf_edge.inputs["Coat Roughness"].default_value = 0.10
    
    return mat_bottom, mat_top, mat_edge

def build_outsole_mesh():
    mesh = bpy.data.meshes.new("Mesh_Piece_04_Outsole")
    bm = bmesh.new()
    mat_bottom, mat_top, mat_edge = create_materials()
    
    num_y = 90
    num_x = 25
    
    y_start = STATIONS_REF[0][0] # -0.126
    y_end = STATIONS_REF[-1][0]   # +0.168
    
    bot_grid = []
    top_grid = []
    
    for j in range(num_y):
        t = j / float(num_y - 1)
        y = y_start + t * (y_end - y_start)
        wm, wl, zf, th_edge, spine_strength = interpolate_station(y)
        
        # Round the rear of the heel (j < 15): width narrows naturally to form U-cup
        if y < -0.082:
            t_heel = (y - y_start) / (-0.082 - y_start) # 0 to 1
            # Oval curvature at heel back
            ang = (t_heel * 0.5) * math.pi
            scale_heel = max(0.08, math.sin(ang))
            wm = wm * scale_heel
            wl = wl * scale_heel
            
        # Round chisel toe tip (last 8 stations)
        if y > 0.150:
            t_toe = (y - 0.150) / (y_end - 0.150)
            chisel_factor = max(0.40, 1.0 - 0.60 * (t_toe ** 1.5))
            wm = wm * chisel_factor
            wl = wl * chisel_factor
            
        bot_row = []
        top_row = []
        
        for i in range(num_x):
            u = -1.0 + 2.0 * (i / float(num_x - 1))
            abs_u = abs(u)
            x = (u * wm) if u >= 0 else (u * wl)
            
            # Top surface Z
            if y < -0.082:
                # Flat insole heel seat
                zt = zf
            elif y <= 0.035:
                # Arched waist with subtle cup for shank
                zt = zf - 0.0006 * (1.0 - abs_u ** 2) * spine_strength
            else:
                # Forefoot: cork cavity inside welt margin
                if abs_u < 0.82:
                    recess = 0.0012 * (1.0 - (abs_u / 0.82) ** 4)
                    zt = zf - recess
                else:
                    zt = zf
                    
            # Bottom surface Z
            if y < -0.082:
                # Flat bottom heel seat
                zb = zf - 0.0055
            elif y <= 0.035:
                # Fiddleback waist: edge is thinned (th_edge), center spine drops down
                z_bot_edge = zf - th_edge
                z_bot_center = zf - 0.0062 # Full 6.2mm substance along spine
                crest = (1.0 - (abs_u ** 0.80))
                zb = z_bot_edge - (z_bot_edge - z_bot_center) * crest
            else:
                # Forefoot: flat tread with slight crown
                z_bot_edge = zf - 0.0055
                z_bot_center = zf - 0.0055
                zb = z_bot_center + 0.0004 * (abs_u ** 2)
                # Closed channel groove
                if y > 0.040 and y < 0.162:
                    groove = math.exp(-((abs_u - 0.88) / 0.030) ** 2)
                    zb += 0.0006 * groove
                    
            v_bot = bm.verts.new((x, y, zb))
            v_top = bm.verts.new((x, y, zt))
            bot_row.append(v_bot)
            top_row.append(v_top)
            
        bot_grid.append(bot_row)
        top_grid.append(top_row)
        
    bm.verts.ensure_lookup_table()
    
    # Quad faces
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
            
            f_top = bm.faces.new((
                top_grid[j][i],
                top_grid[j][i+1],
                top_grid[j+1][i+1],
                top_grid[j+1][i]
            ))
            f_top.material_index = 1
            f_top.smooth = True
            
    # Sidewalls
    for j in range(num_y - 1):
        f_lat = bm.faces.new((
            top_grid[j][0],
            top_grid[j+1][0],
            bot_grid[j+1][0],
            bot_grid[j][0]
        ))
        f_lat.material_index = 2
        f_lat.smooth = True
        
        f_med = bm.faces.new((
            bot_grid[j][num_x-1],
            bot_grid[j+1][num_x-1],
            top_grid[j+1][num_x-1],
            top_grid[j][num_x-1]
        ))
        f_med.material_index = 2
        f_med.smooth = True
        
    # Caps
    for i in range(num_x - 1):
        f_rear = bm.faces.new((
            bot_grid[0][i],
            bot_grid[0][i+1],
            top_grid[0][i+1],
            top_grid[0][i]
        ))
        f_rear.material_index = 2
        f_rear.smooth = True
        
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
    scene.view_settings.exposure = 0.05
    
    # 360-degree studio world background so all camera angles have identical light neutral grey horizon
    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.83, 0.82, 0.80, 1.0)
        bg.inputs["Strength"].default_value = 0.85
        
    # Cylindrical soft floor shadow receiver
    bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=0.002, vertices=64, location=(0, 0, -0.001))
    floor = bpy.context.active_object
    floor.name = "Studio_Floor"
    m_fl = bpy.data.materials.new("M_Floor")
    m_fl.use_nodes = True
    m_fl.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.83, 0.82, 0.80, 1.0)
    m_fl.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.95
    floor.data.materials.append(m_fl)
    
    # Key Area Light (Warm Key)
    l_key = bpy.data.lights.new("Key", "AREA")
    l_key.energy = 6.5
    l_key.size = 0.55
    l_key.color = (1.0, 0.98, 0.95)
    ok = bpy.data.objects.new("Key", l_key)
    ok.location = (0.28, -0.05, 0.42)
    ok.rotation_euler = (math.radians(45), math.radians(18), math.radians(35))
    scene.collection.objects.link(ok)
    
    # Fill Area Light (Cool Fill)
    l_fill = bpy.data.lights.new("Fill", "AREA")
    l_fill.energy = 2.0
    l_fill.size = 0.70
    l_fill.color = (0.95, 0.97, 1.0)
    of = bpy.data.objects.new("Fill", l_fill)
    of.location = (-0.32, -0.05, 0.35)
    of.rotation_euler = (math.radians(40), math.radians(-25), math.radians(-45))
    scene.collection.objects.link(of)
    
    # Rim Strip Light (Highlights edge bevels and spine)
    l_rim = bpy.data.lights.new("Rim", "AREA")
    l_rim.energy = 5.0
    l_rim.size = 0.35
    l_rim.color = (1.0, 1.0, 0.98)
    orim = bpy.data.objects.new("Rim", l_rim)
    orim.location = (0.0, 0.32, 0.30)
    orim.rotation_euler = (math.radians(-50), 0, math.radians(180))
    scene.collection.objects.link(orim)

def test_render():
    clean_scene()
    setup_studio()
    outsole = build_outsole_mesh()
    bpy.context.scene.collection.objects.link(outsole)
    
    scene = bpy.context.scene
    
    # Bottom View test:
    # Rotate around Y by 180 degrees so sole faces UP (+Z), and Y stays Y (heel at -Y, toe at +Y)
    # Then rotate around Z by -90 degrees so -Y (heel) goes to -X (LEFT of screen) and +Y (toe) goes to +X (RIGHT of screen)!
    outsole.rotation_euler = (math.radians(180), 0, math.radians(-90))
    outsole.location = (0.0, 0.0, 0.045)
    bpy.context.view_layer.update()
    
    cam_data = bpy.data.cameras.new("Cam_Test")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 0.35
    cam_data.clip_start = 0.001
    cam = bpy.data.objects.new("Cam_Test", cam_data)
    cam.location = (0.0, 0.0, 0.45)
    cam.rotation_euler = (0, 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam
    
    out_test = os.path.join(OUTPUT_DIR, "test_bottom_corrected.jpg")
    scene.render.filepath = out_test
    print("Rendering corrected bottom view test...")
    bpy.ops.render.render(write_still=True)
    print(f"Rendered -> {out_test}")

test_render()
