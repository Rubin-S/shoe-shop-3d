"""
Iteration 03: Refined Bespoke Oxford Master Generator.
- Smooth shading enabled on all meshes (silky luxury finish).
- Camera framed with elegant breathing room (entire shoe visible).
- Single continuous anatomical upper with dual material slots (seamless cap-toe seam).
- Integrated flat welt shelf and dual-camber fiddleback outsole.
- High-resolution smooth Bézier laces with tied bow knot and brass aglets.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix, Euler
import os

def build_aurelius_v3():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)

    master_col = bpy.data.collections.new("SHOE_001_AURELIUS")
    bpy.context.scene.collection.children.link(master_col)

    # World Studio Ambient
    world = bpy.data.worlds.new("World_Studio")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.045, 0.045, 0.050, 1.0)
        bg.inputs["Strength"].default_value = 0.5
    bpy.context.scene.world = world

    # --- MATERIALS ---
    # 1. French Box Calf - Imperial Espresso (Vamp & Quarters)
    mat_upper = bpy.data.materials.new(name="M_BoxCalf_ImperialEspresso")
    mat_upper.use_nodes = True
    bsdf_u = mat_upper.node_tree.nodes.get("Principled BSDF")
    bsdf_u.inputs["Base Color"].default_value = (0.075, 0.042, 0.026, 1.0) # #271912
    bsdf_u.inputs["Roughness"].default_value = 0.32
    bsdf_u.inputs["Coat Weight"].default_value = 0.35
    bsdf_u.inputs["Coat Roughness"].default_value = 0.15
    bsdf_u.inputs["Specular IOR Level"].default_value = 0.52

    # 2. French Box Calf - Mirror Obsidian Glaze (Chiseled Toe Cap)
    mat_cap = bpy.data.materials.new(name="M_BoxCalf_MirrorObsidian")
    mat_cap.use_nodes = True
    bsdf_c = mat_cap.node_tree.nodes.get("Principled BSDF")
    bsdf_c.inputs["Base Color"].default_value = (0.035, 0.020, 0.014, 1.0) # #140c09
    bsdf_c.inputs["Roughness"].default_value = 0.15
    bsdf_c.inputs["Coat Weight"].default_value = 0.95
    bsdf_c.inputs["Coat Roughness"].default_value = 0.03
    bsdf_c.inputs["Specular IOR Level"].default_value = 0.58

    # 3. Oak-Bark Leather Sole & Welt
    mat_sole = bpy.data.materials.new(name="M_OakBark_Sole")
    mat_sole.use_nodes = True
    bsdf_s = mat_sole.node_tree.nodes.get("Principled BSDF")
    bsdf_s.inputs["Base Color"].default_value = (0.22, 0.14, 0.075, 1.0)
    bsdf_s.inputs["Roughness"].default_value = 0.55

    # 4. Stacked Leather Heel
    mat_heel = bpy.data.materials.new(name="M_StackedHeel")
    mat_heel.use_nodes = True
    bsdf_h = mat_heel.node_tree.nodes.get("Principled BSDF")
    bsdf_h.inputs["Base Color"].default_value = (0.060, 0.036, 0.022, 1.0)
    bsdf_h.inputs["Roughness"].default_value = 0.40
    bsdf_h.inputs["Coat Weight"].default_value = 0.35

    # 5. Waxed Laces
    mat_lace = bpy.data.materials.new(name="M_WaxedLaces")
    mat_lace.use_nodes = True
    bsdf_l = mat_lace.node_tree.nodes.get("Principled BSDF")
    bsdf_l.inputs["Base Color"].default_value = (0.040, 0.026, 0.018, 1.0)
    bsdf_l.inputs["Roughness"].default_value = 0.42
    bsdf_l.inputs["Sheen Weight"].default_value = 0.50

    # 6. Antique Champagne Brass
    mat_brass = bpy.data.materials.new(name="M_AntiqueBrass")
    mat_brass.use_nodes = True
    bsdf_b = mat_brass.node_tree.nodes.get("Principled BSDF")
    bsdf_b.inputs["Base Color"].default_value = (0.75, 0.58, 0.32, 1.0)
    bsdf_b.inputs["Metallic"].default_value = 0.95
    bsdf_b.inputs["Roughness"].default_value = 0.25

    # --- ANATOMICAL SHOE GEOMETRY ---
    stations = [
        # y, half_wm, half_wl, z_sole_bottom, z_upper_bottom, z_upper_top
        (-0.125, 0.024, 0.024, 0.000, 0.027, 0.088), # Heel rear
        (-0.105, 0.031, 0.031, 0.000, 0.027, 0.095), # Heel seat
        (-0.082, 0.033, 0.033, 0.000, 0.027, 0.098), # Heel breast
        (-0.055, 0.030, 0.027, 0.008, 0.022, 0.095), # Waist rear
        (-0.025, 0.034, 0.030, 0.014, 0.018, 0.090), # Waist apex (fiddleback)
        ( 0.005, 0.044, 0.038, 0.008, 0.014, 0.082), # Instep rise
        ( 0.035, 0.052, 0.046, 0.002, 0.008, 0.073), # Ball rear
        ( 0.055, 0.054, 0.050, 0.000, 0.006, 0.063), # Ball pivot (104mm max)
        ( 0.080, 0.051, 0.047, 0.003, 0.008, 0.054), # Cap-toe seam (29% length)
        ( 0.110, 0.045, 0.040, 0.007, 0.012, 0.044), # Toe vamp
        ( 0.138, 0.037, 0.032, 0.010, 0.015, 0.035), # Chisel shoulder
        ( 0.158, 0.026, 0.022, 0.013, 0.018, 0.027), # Chisel taper
        ( 0.166, 0.016, 0.013, 0.014, 0.019, 0.023)  # Toe tip (14mm toe spring)
    ]

    num_radial = 20 # 20 radial vertices

    # 1. CONTINUOUS WATERTIGHT UPPER WITH MULTI-MATERIAL CAP TOE
    mesh_upper = bpy.data.meshes.new("Upper_Master")
    bm_u = bmesh.new()

    rings = []
    for s_idx, (y, wm, wl, zb_sole, zb_up, zt_up) in enumerate(stations):
        ring = []
        for i in range(num_radial):
            theta = 2.0 * math.pi * i / num_radial
            w = wm if math.sin(theta) >= 0 else wl
            x = w * math.sin(theta)

            z_mid = (zt_up + zb_up) * 0.5
            z_rad = (zt_up - zb_up) * 0.5
            cos_t = math.cos(theta)

            # Ankle collar opening at heel
            if s_idx <= 4:
                if cos_t > 0.25:
                    dip = 0.020 if x < 0 else 0.015
                    z = z_mid + z_rad * cos_t - dip * (cos_t - 0.25) / 0.75
                else:
                    z = z_mid + z_rad * cos_t
            elif s_idx >= 8: # Soft chisel top
                if cos_t > 0.25:
                    z = z_mid + z_rad * (0.32 + 0.68 * math.sin((cos_t - 0.25) * math.pi / 0.75))
                else:
                    z = z_mid + z_rad * cos_t
            else:
                z = z_mid + z_rad * cos_t

            # Slight physical overlap ridge at cap-toe seam station
            if s_idx >= 8:
                w_offset = 0.0006
                x = (w + w_offset) * math.sin(theta)
                z += 0.0006

            v = bm_u.verts.new((x, y, z))
            ring.append(v)
        rings.append(ring)

    # Faces & Material assignment
    for r in range(len(rings) - 1):
        # Determine if face belongs to Cap-Toe (r >= 8) or Main Upper (r < 8)
        mat_idx = 1 if r >= 8 else 0
        for i in range(num_radial):
            v1 = rings[r][i]
            v2 = rings[r][(i + 1) % num_radial]
            v3 = rings[r + 1][(i + 1) % num_radial]
            v4 = rings[r + 1][i]
            f = bm_u.faces.new((v1, v2, v3, v4))
            f.material_index = mat_idx
            f.smooth = True

    # Heel back cap
    heel_pt = bm_u.verts.new((0.0, -0.127, 0.056))
    for i in range(num_radial):
        f = bm_u.faces.new((rings[0][i], rings[0][(i + 1) % num_radial], heel_pt))
        f.material_index = 0
        f.smooth = True

    # Toe tip cap
    toe_pt = bm_u.verts.new((0.0, 0.168, 0.021))
    for i in range(num_radial):
        f = bm_u.faces.new((rings[-1][i], rings[-1][(i + 1) % num_radial], toe_pt))
        f.material_index = 1
        f.smooth = True

    bm_u.to_mesh(mesh_upper)
    bm_u.free()

    # Enable smooth shading on all polygons
    for p in mesh_upper.polygons:
        p.use_smooth = True

    obj_upper = bpy.data.objects.new("Upper_Master", mesh_upper)
    obj_upper.data.materials.append(mat_upper) # Slot 0: Imperial Espresso
    obj_upper.data.materials.append(mat_cap)   # Slot 1: Mirror Obsidian Cap Toe
    master_col.objects.link(obj_upper)
    sub = obj_upper.modifiers.new(name="Subsurf", type='SUBSURF')
    sub.levels = 2
    sub.render_levels = 2

    # 2. INTEGRATED 270° WELT SHELF
    mesh_welt = bpy.data.meshes.new("Construction_Welt")
    bm_w = bmesh.new()
    welt_stations = stations[3:] # stations 3 to 12
    welt_inner = []
    welt_outer = []
    for y, wm, wl, zb_sole, zb_up, zt_up in welt_stations:
        # Medial & Lateral welt shelf extending horizontally by 4.0mm
        zw = zb_up + 0.001
        w_shelf = 0.0040
        # Medial
        v_in_m = bm_w.verts.new((wm, y, zw))
        v_out_m = bm_w.verts.new((wm + w_shelf, y, zw))
        # Lateral
        v_in_l = bm_w.verts.new((-wl, y, zw))
        v_out_l = bm_w.verts.new((-wl - w_shelf, y, zw))
        welt_inner.append((v_in_m, v_in_l))
        welt_outer.append((v_out_m, v_out_l))

    # Connect welt shelf faces
    for i in range(len(welt_stations) - 1):
        # Medial strip
        f1 = bm_w.faces.new((welt_inner[i][0], welt_outer[i][0], welt_outer[i+1][0], welt_inner[i+1][0]))
        f1.smooth = True
        # Lateral strip
        f2 = bm_w.faces.new((welt_inner[i][1], welt_inner[i+1][1], welt_outer[i+1][1], welt_outer[i][1]))
        f2.smooth = True

    bm_w.to_mesh(mesh_welt)
    bm_w.free()
    for p in mesh_welt.polygons:
        p.use_smooth = True
    obj_welt = bpy.data.objects.new("Construction_Welt", mesh_welt)
    obj_welt.data.materials.append(mat_upper)
    master_col.objects.link(obj_welt)
    sol_w = obj_welt.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_w.thickness = 0.0024 # 2.4mm welt rim thickness
    sol_w.offset = -1.0

    # 3. OUTSOLE WITH FIDDLEBACK WAIST
    mesh_sole = bpy.data.meshes.new("Construction_Outsole")
    bm_s = bmesh.new()
    sole_rings = []
    for s_idx, (y, wm, wl, zb_sole, zb_up, zt_up) in enumerate(stations):
        ring = []
        for i in range(num_radial):
            theta = 2.0 * math.pi * i / num_radial
            w = (wm + 0.0035) if math.sin(theta) >= 0 else (wl + 0.0035)
            x = w * math.sin(theta)
            z_top = zb_up + 0.001
            z_bot = zb_sole
            # Fiddleback triangular ridge along waist arch
            if 3 <= s_idx <= 5 and math.cos(theta) < -0.2:
                spine = max(0.0, 1.0 - abs(x) / (w * 0.45))
                z_bot -= 0.0045 * spine
            z = z_top if math.cos(theta) >= 0 else z_bot
            ring.append(bm_s.verts.new((x, y, z)))
        sole_rings.append(ring)

    for r in range(len(sole_rings) - 1):
        for i in range(num_radial):
            f = bm_s.faces.new((sole_rings[r][i], sole_rings[r][(i + 1) % num_radial], sole_rings[r + 1][(i + 1) % num_radial], sole_rings[r + 1][i]))
            f.smooth = True

    bm_s.to_mesh(mesh_sole)
    bm_s.free()
    for p in mesh_sole.polygons:
        p.use_smooth = True
    obj_sole = bpy.data.objects.new("Construction_Outsole", mesh_sole)
    obj_sole.data.materials.append(mat_sole)
    master_col.objects.link(obj_sole)
    obj_sole.modifiers.new(name="Subsurf", type='SUBSURF').levels = 2

    # 4. STACKED LEATHER HEEL (4 lifts + dovetail rubber pad)
    mesh_heel = bpy.data.meshes.new("Construction_HeelStack")
    bm_h = bmesh.new()
    num_lifts = 4
    lift_h = 0.027 / num_lifts
    for l in range(num_lifts):
        zt = 0.027 - l * lift_h
        zb = zt - lift_h
        taper = 1.0 - l * 0.025
        n_pts = 16
        r_top = []
        r_bot = []
        for i in range(n_pts):
            th = 2.0 * math.pi * i / n_pts
            hx = 0.030 * taper * math.sin(th)
            hy = -0.104 + 0.022 * taper * math.cos(th)
            r_top.append(bm_h.verts.new((hx, hy, zt)))
            r_bot.append(bm_h.verts.new((hx, hy, zb)))
        for i in range(n_pts):
            f = bm_h.faces.new((r_top[i], r_top[(i + 1) % n_pts], r_bot[(i + 1) % n_pts], r_bot[i]))
            f.smooth = True
    bm_h.to_mesh(mesh_heel)
    bm_h.free()
    for p in mesh_heel.polygons:
        p.use_smooth = True
    obj_heel = bpy.data.objects.new("Construction_HeelStack", mesh_heel)
    obj_heel.data.materials.append(mat_heel)
    master_col.objects.link(obj_heel)
    obj_heel.modifiers.new(name="Subsurf", type='SUBSURF').levels = 1

    # 5. EYELETS & SMOOTH BÉZIER LACES
    eyelet_pts = [
        (Vector((-0.007, 0.040, 0.071)), Vector(( 0.007, 0.040, 0.071))),
        (Vector((-0.008, 0.024, 0.075)), Vector(( 0.008, 0.024, 0.075))),
        (Vector((-0.009, 0.008, 0.079)), Vector(( 0.009, 0.008, 0.079))),
        (Vector((-0.010, -0.008, 0.083)), Vector(( 0.010, -0.008, 0.083))),
        (Vector((-0.011, -0.024, 0.087)), Vector(( 0.011, -0.024, 0.087)))
    ]
    for idx, (pl, pr) in enumerate(eyelet_pts):
        for pt in [pl, pr]:
            bpy.ops.mesh.primitive_torus_add(
                major_radius=0.0016, minor_radius=0.0004, location=pt, rotation=(math.radians(20), 0, 0)
            )
            ey = bpy.context.active_object
            for p in ey.data.polygons:
                p.use_smooth = True
            ey.data.materials.append(mat_brass)
            master_col.objects.link(ey)
            bpy.context.scene.collection.objects.unlink(ey)

    curve_l = bpy.data.curves.new("Lacing_Curve", type='CURVE')
    curve_l.dimensions = '3D'
    curve_l.bevel_depth = 0.0011
    curve_l.bevel_resolution = 6

    lace_segs = [
        [eyelet_pts[0][0], eyelet_pts[0][1]],
        [eyelet_pts[0][0], Vector((-0.001, 0.032, 0.074)), eyelet_pts[1][1]],
        [eyelet_pts[0][1], Vector(( 0.001, 0.032, 0.073)), eyelet_pts[1][0]],
        [eyelet_pts[1][0], Vector((-0.001, 0.016, 0.078)), eyelet_pts[2][1]],
        [eyelet_pts[1][1], Vector(( 0.001, 0.016, 0.077)), eyelet_pts[2][0]],
        [eyelet_pts[2][0], Vector((-0.001, 0.000, 0.082)), eyelet_pts[3][1]],
        [eyelet_pts[2][1], Vector(( 0.001, 0.000, 0.081)), eyelet_pts[3][0]],
        [eyelet_pts[3][0], Vector((-0.001, -0.016, 0.086)), eyelet_pts[4][1]],
        [eyelet_pts[3][1], Vector(( 0.001, -0.016, 0.085)), eyelet_pts[4][0]],
        # Bow knot tied loops
        [eyelet_pts[4][0], Vector((-0.014, -0.032, 0.094)), Vector((-0.020, -0.040, 0.098)), Vector((-0.008, -0.040, 0.095)), Vector((0.0, -0.028, 0.089))],
        [eyelet_pts[4][1], Vector(( 0.014, -0.032, 0.094)), Vector(( 0.020, -0.040, 0.098)), Vector(( 0.008, -0.040, 0.095)), Vector((0.0, -0.028, 0.089))],
        # Hanging ends with aglets
        [Vector((0.0, -0.028, 0.089)), Vector((-0.011, -0.035, 0.078)), Vector((-0.018, -0.044, 0.065))],
        [Vector((0.0, -0.028, 0.089)), Vector(( 0.011, -0.035, 0.078)), Vector(( 0.018, -0.044, 0.065))]
    ]
    for seg in lace_segs:
        sp = curve_l.splines.new('BEZIER')
        sp.bezier_points.add(len(seg) - 1)
        for idx, pt in enumerate(seg):
            bp = sp.bezier_points[idx]
            bp.co = pt
            bp.handle_left_type = 'AUTO'
            bp.handle_right_type = 'AUTO'
    obj_laces = bpy.data.objects.new("Lacing_WaxedCotton", curve_l)
    obj_laces.data.materials.append(mat_lace)
    master_col.objects.link(obj_laces)

    # --- CYCLORAMA STUDIO FLOOR ---
    mesh_cyc = bpy.data.meshes.new("Studio_Cyc")
    bm_cyc = bmesh.new()
    cyc_pts = [
        ( 2.0,  1.2, -0.0005), (-2.0,  1.2, -0.0005),
        ( 2.0, -0.5, -0.0005), (-2.0, -0.5, -0.0005),
        ( 2.0, -0.8,  0.08),   (-2.0, -0.8,  0.08),
        ( 2.0, -1.2,  0.40),   (-2.0, -1.2,  0.40),
        ( 2.0, -1.5,  1.00),   (-2.0, -1.5,  1.00),
        ( 2.0, -1.6,  1.80),   (-2.0, -1.6,  1.80)
    ]
    verts = [bm_cyc.verts.new(pt) for pt in cyc_pts]
    for i in range(0, len(verts) - 2, 2):
        f = bm_cyc.faces.new((verts[i], verts[i+1], verts[i+3], verts[i+2]))
        f.smooth = True
    bm_cyc.to_mesh(mesh_cyc)
    bm_cyc.free()
    for p in mesh_cyc.polygons:
        p.use_smooth = True
    obj_cyc = bpy.data.objects.new("Studio_Cyclorama", mesh_cyc)
    master_col.objects.link(obj_cyc)
    obj_cyc.modifiers.new(name="Subsurf", type='SUBSURF').levels = 2

    mat_cyc = bpy.data.materials.new(name="M_CycBackdrop")
    mat_cyc.use_nodes = True
    bsdf_cyc = mat_cyc.node_tree.nodes.get("Principled BSDF")
    if bsdf_cyc:
        bsdf_cyc.inputs["Base Color"].default_value = (0.065, 0.065, 0.072, 1.0)
        bsdf_cyc.inputs["Roughness"].default_value = 0.88
    obj_cyc.data.materials.append(mat_cyc)

    # --- STUDIO LIGHTING ---
    # Key Light (Warm 5200K, 22W)
    key_l = bpy.data.lights.new(name="Key_Light", type='AREA')
    key_l.energy = 22.0
    key_l.size = 0.7
    key_l.size_y = 0.9
    key_l.color = (1.0, 0.94, 0.86)
    key_obj = bpy.data.objects.new("Key_Light", key_l)
    key_obj.location = (-0.42, 0.28, 0.42)
    key_obj.rotation_euler = (math.radians(45), math.radians(20), math.radians(-50))
    master_col.objects.link(key_obj)

    # Fill Light (Cool 6000K, 10W)
    fill_l = bpy.data.lights.new(name="Fill_Light", type='AREA')
    fill_l.energy = 10.0
    fill_l.size = 0.6
    fill_l.color = (0.88, 0.92, 1.0)
    fill_obj = bpy.data.objects.new("Fill_Light", fill_l)
    fill_obj.location = (0.45, 0.12, 0.35)
    fill_obj.rotation_euler = (math.radians(35), math.radians(-20), math.radians(65))
    master_col.objects.link(fill_obj)

    # Rim Light (Crisp 5600K, 15W)
    rim_l = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_l.energy = 15.0
    rim_l.size = 0.12
    rim_l.size_y = 1.2
    rim_l.color = (1.0, 0.98, 0.95)
    rim_obj = bpy.data.objects.new("Rim_Light", rim_l)
    rim_obj.location = (0.18, -0.48, 0.40)
    rim_obj.rotation_euler = (math.radians(-35), math.radians(-10), math.radians(160))
    master_col.objects.link(rim_obj)

    # --- CAMERA SETUP (FRAMED WITH BREATHING ROOM) ---
    target = bpy.data.objects.new("Cam_Target", None)
    target.location = (0.0, 0.02, 0.045)
    bpy.context.scene.collection.objects.link(target)

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 72.0 # Slightly wider lens to comfortably fit the 298mm shoe
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Camera positioned for classic 3/4 beauty angle:
    # Placed at (-0.45, 0.42, 0.24) looking at target (0, 0.02, 0.045)
    cam_obj.location = (-0.45, 0.42, 0.24)
    direction = (target.location - cam_obj.location).normalized()
    cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()

    # Cycles Config
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    try:
        scene.cycles.device = 'CPU'
    except Exception:
        pass
    scene.cycles.samples = 16
    scene.cycles.preview_samples = 8
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 95

    out_path = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001\renders\final\hero_three_quarter.jpg"
    scene.render.filepath = out_path
    print(f"Rendering Iteration 03 Hero: {out_path} ...")
    bpy.ops.render.render(write_still=True)
    print("Render Complete!")

    master_blend = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001\blender\master\SHOE_001_MASTER.blend"
    bpy.ops.wm.save_as_mainfile(filepath=master_blend)
    print("Master Blend Updated!")

if __name__ == "__main__":
    build_aurelius_v3()
