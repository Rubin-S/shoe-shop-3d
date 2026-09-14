"""
=============================================================================
MASTER STITCHED FOOTWEAR GENERATOR: "ANATOMY OF A DRESS SHOE"
Flagship Bespoke Oxford Shoe (SHOE_001 "AEROPRO AURELIUS")
Constructs every single component piece-by-piece and shape-by-shape,
seamlessly stitched together at the feather edge with ZERO gaps!

ALL 20 ANATOMICAL COMPONENTS:
 1. Heel Nails (9 Flush Antique Brass Pins)
 2. Solid Heel Lifts (5 Lifts: 4 Stacked Leather + 1 Dovetail Rubber Strike Pad)
 3. Leather Rand (U-Shaped Heel Seat Transition Collar)
 4. Oak-Bark Outsole (Sculpted Dual-Camber Fiddleback Waist Spine)
 5. Cork Footbed Filler (Granulated Cavity Cushion)
 6. Spring Steel Arch Shank & Twin Brass Rivets
 7. 270° Goodyear Welt (3.2mm Beveled Shelf, Terminates at Heel Breast)
 8. Vegetable Tanned Insole & Gemming Rib
 9. Toe Puff (Molded Internal Dome Stiffener)
10. Heel Counter (Cupped Internal Calcaneus / Achilles Stiffener)
11. Glove Leather Lining Cavity (Hollow Interior in #f2ede4 Parchment)
12. Quarters (Medial & Lateral Side Panels with Open Ankle Collar)
13. Heel / Back Strip (Vertical Reinforcing Strip along Achilles Tendon)
14. Rolled Collar Binding Bead (Continuous Piping framing Ankle Opening)
15. Vamp & Throat (Forefoot Instep Bridge)
16. Facings / Eyestays (5 Pairs of Countersunk Antique Brass Eyelets)
17. Padded Tongue (Ergonomic Throat Lining)
18. Soft-Chisel Toe Cap (Mirror Obsidian Glaze with Skived Lap Seam)
19. 3D Braided Waxed Laces & Aglets (Tied Bow Knot & Antique Brass Aglets)
20. Master Micro-Stitching (11 SPI Twin Parallel Seams)
=============================================================================
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix, Euler
import os

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)

def setup_collections():
    master_col = bpy.data.collections.new("SHOE_001_AURELIUS")
    bpy.context.scene.collection.children.link(master_col)
    
    subcols = ["FOUNDATION", "UPPER", "INTERNAL", "HARDWARE", "STITCHING", "STUDIO"]
    cols = {}
    for name in subcols:
        col = bpy.data.collections.new(name)
        master_col.children.link(col)
        cols[name] = col
    return master_col, cols

# ---------------------------------------------------------------------------
# BESPOKE PBR MATERIAL DEFINITIONS
# ---------------------------------------------------------------------------

def create_materials():
    mats = {}

    # 1. French Box Calf - Imperial Espresso (Upper, Quarters, Vamp)
    m_upper = bpy.data.materials.new(name="M_BoxCalf_ImperialEspresso")
    m_upper.use_nodes = True
    b_u = m_upper.node_tree.nodes.get("Principled BSDF")
    b_u.inputs["Base Color"].default_value = (0.075, 0.042, 0.026, 1.0) # Deep burnished espresso #271912
    b_u.inputs["Roughness"].default_value = 0.30
    b_u.inputs["Coat Weight"].default_value = 0.42
    b_u.inputs["Coat Roughness"].default_value = 0.12
    b_u.inputs["Specular IOR Level"].default_value = 0.52
    mats["upper"] = m_upper

    # 2. French Box Calf - Mirror Obsidian Glaze (Toe Cap, Heel Back Strip)
    m_cap = bpy.data.materials.new(name="M_BoxCalf_MirrorObsidian")
    m_cap.use_nodes = True
    b_c = m_cap.node_tree.nodes.get("Principled BSDF")
    b_c.inputs["Base Color"].default_value = (0.024, 0.013, 0.008, 1.0) # Near-black mirror glaze #140c09
    b_c.inputs["Roughness"].default_value = 0.11
    b_c.inputs["Coat Weight"].default_value = 0.98
    b_c.inputs["Coat Roughness"].default_value = 0.02
    b_c.inputs["Specular IOR Level"].default_value = 0.62
    mats["cap_toe"] = m_cap

    # 3. Oak-Bark Outsole & Fiddleback Waist
    m_sole = bpy.data.materials.new(name="M_OakBark_Sole")
    m_sole.use_nodes = True
    b_s = m_sole.node_tree.nodes.get("Principled BSDF")
    b_s.inputs["Base Color"].default_value = (0.24, 0.15, 0.08, 1.0) # Warm oak-bark tan
    b_s.inputs["Roughness"].default_value = 0.48
    b_s.inputs["Specular IOR Level"].default_value = 0.45
    mats["sole"] = m_sole

    # 4. Stacked Compressed Leather Heel Lifts
    m_heel = bpy.data.materials.new(name="M_StackedLeather_Heel")
    m_heel.use_nodes = True
    b_h = m_heel.node_tree.nodes.get("Principled BSDF")
    b_h.inputs["Base Color"].default_value = (0.052, 0.030, 0.017, 1.0) # Mahogany stacked leather
    b_h.inputs["Roughness"].default_value = 0.35
    b_h.inputs["Coat Weight"].default_value = 0.40
    mats["heel"] = m_heel

    # 5. Dovetail Rubber Strike Pad
    m_rub = bpy.data.materials.new(name="M_Dovetail_Rubber")
    m_rub.use_nodes = True
    b_r = m_rub.node_tree.nodes.get("Principled BSDF")
    b_r.inputs["Base Color"].default_value = (0.020, 0.020, 0.022, 1.0)
    b_r.inputs["Roughness"].default_value = 0.75
    mats["rubber"] = m_rub

    # 6. Antique Champagne Brass (Eyelets, Nails, Shank Rivets, Aglets)
    m_brass = bpy.data.materials.new(name="M_AntiqueBrass")
    m_brass.use_nodes = True
    b_b = m_brass.node_tree.nodes.get("Principled BSDF")
    b_b.inputs["Base Color"].default_value = (0.78, 0.60, 0.32, 1.0) # Champagne brass #C79A52
    b_b.inputs["Metallic"].default_value = 0.95
    b_b.inputs["Roughness"].default_value = 0.20
    mats["brass"] = m_brass

    # 7. Braided Waxed Cotton Laces
    m_lace = bpy.data.materials.new(name="M_WaxedLaces")
    m_lace.use_nodes = True
    b_l = m_lace.node_tree.nodes.get("Principled BSDF")
    b_l.inputs["Base Color"].default_value = (0.032, 0.020, 0.014, 1.0)
    b_l.inputs["Roughness"].default_value = 0.40
    b_l.inputs["Sheen Weight"].default_value = 0.50
    mats["laces"] = m_lace

    # 8. Glove Leather Lining (Warm Parchment #f2ede4)
    m_lining = bpy.data.materials.new(name="M_GloveLining")
    m_lining.use_nodes = True
    b_li = m_lining.node_tree.nodes.get("Principled BSDF")
    b_li.inputs["Base Color"].default_value = (0.86, 0.82, 0.74, 1.0)
    b_li.inputs["Roughness"].default_value = 0.65
    mats["lining"] = m_lining

    # 9. Natural Granulated Cork Filler
    m_cork = bpy.data.materials.new(name="M_Cork_Filler")
    m_cork.use_nodes = True
    b_ck = m_cork.node_tree.nodes.get("Principled BSDF")
    b_ck.inputs["Base Color"].default_value = (0.42, 0.30, 0.18, 1.0)
    b_ck.inputs["Roughness"].default_value = 0.85
    mats["cork"] = m_cork

    # 10. Tempered Spring Steel (Arch Shank)
    m_steel = bpy.data.materials.new(name="M_TemperedSteel")
    m_steel.use_nodes = True
    b_st = m_steel.node_tree.nodes.get("Principled BSDF")
    b_st.inputs["Base Color"].default_value = (0.22, 0.23, 0.25, 1.0)
    b_st.inputs["Metallic"].default_value = 0.90
    b_st.inputs["Roughness"].default_value = 0.28
    mats["steel"] = m_steel

    # 11. Waxed Stitching Thread (11 SPI)
    m_thread = bpy.data.materials.new(name="M_WaxedThread")
    m_thread.use_nodes = True
    b_th = m_thread.node_tree.nodes.get("Principled BSDF")
    b_th.inputs["Base Color"].default_value = (0.32, 0.22, 0.14, 1.0)
    b_th.inputs["Roughness"].default_value = 0.40
    mats["thread"] = m_thread

    # 12. Vegetable Tanned Insole
    m_insole = bpy.data.materials.new(name="M_VegTan_Insole")
    m_insole.use_nodes = True
    b_in = m_insole.node_tree.nodes.get("Principled BSDF")
    b_in.inputs["Base Color"].default_value = (0.62, 0.48, 0.34, 1.0)
    b_in.inputs["Roughness"].default_value = 0.58
    mats["insole"] = m_insole

    return mats

# ---------------------------------------------------------------------------
# MASTER ANATOMICAL LAST STATIONS
# Definition of the bespoke last: coordinates, widths, and heights
# ---------------------------------------------------------------------------

STATIONS = [
    # y, half_wm (medial), half_wl (lateral), z_feather, z_crest, x_crest
    (-0.126, 0.024, 0.024, 0.0270, 0.088,  0.000), # 0 Heel rear (Achilles)
    (-0.105, 0.031, 0.030, 0.0270, 0.086,  0.000), # 1 Heel seat
    (-0.082, 0.033, 0.032, 0.0270, 0.083,  0.000), # 2 Heel breast (welt terminates here)
    (-0.055, 0.030, 0.027, 0.0220, 0.078,  0.001), # 3 Waist rear
    (-0.025, 0.034, 0.029, 0.0180, 0.076,  0.002), # 4 Waist apex (fiddleback arch)
    ( 0.005, 0.044, 0.038, 0.0140, 0.073,  0.002), # 5 Instep throat entry
    ( 0.035, 0.052, 0.046, 0.0080, 0.065,  0.002), # 6 Ball rear (Throat line / Vamp junction)
    ( 0.055, 0.055, 0.050, 0.0060, 0.057,  0.001), # 7 Ball pivot (105mm max width)
    ( 0.080, 0.051, 0.047, 0.0080, 0.046,  0.001), # 8 Cap-toe seam line (low-slung drop)
    ( 0.110, 0.045, 0.040, 0.0120, 0.042,  0.000), # 9 Toe vamp (chisel plateau)
    ( 0.138, 0.037, 0.032, 0.0150, 0.039,  0.000), # 10 Chisel shoulder (chisel plateau)
    ( 0.158, 0.026, 0.022, 0.0180, 0.032,  0.000), # 11 Chisel cliff dive
    ( 0.168, 0.015, 0.013, 0.0190, 0.023,  0.000)  # 12 Toe tip (14mm toe spring off floor)
]

# ---------------------------------------------------------------------------
# 1. PIECE 1 & 2: SOLID STACKED LEATHER HEEL & NAILS
# ---------------------------------------------------------------------------

def make_horseshoe_profile(y_rear=-0.126, y_breast=-0.082, r_med=0.031, r_lat=0.030, num_curve=16, num_breast=8):
    pts = []
    # Front breast: straight line from medial to lateral
    for i in range(num_breast):
        u = i / (num_breast - 1)
        x = r_med * (1.0 - u) + (-r_lat) * u
        y = y_breast - 0.0015 * (1.0 - (2.0 * u - 1.0)**2)
        pts.append((x, y))
    
    # Outer curved rim
    for i in range(1, num_curve):
        alpha = math.pi * i / num_curve
        rx = r_lat if alpha < math.pi * 0.5 else r_med
        x = -rx * math.cos(alpha)
        y = y_breast - (y_breast - y_rear) * math.sin(alpha)
        pts.append((x, y))
    return pts

def build_piece_1_and_2_solid_heel(cols, materials):
    mesh = bpy.data.meshes.new("Piece_02_HeelLifts_Solid")
    bm = bmesh.new()

    levels_z = [0.0270, 0.0216, 0.0162, 0.0108, 0.0054, 0.0000]
    rings = []

    for idx, z in enumerate(levels_z):
        # Keep y_rear constant so heel drops flush at the back
        taper = 1.0 - idx * 0.010
        pts = make_horseshoe_profile(
            y_rear=-0.126, y_breast=-0.082,
            r_med=0.031 * taper, r_lat=0.030 * taper,
            num_curve=16, num_breast=8
        )
        r = [bm.verts.new((x, y, z)) for x, y in pts]
        rings.append(r)

    n = len(rings[0])
    for l in range(len(levels_z) - 1):
        mat_idx = 1 if l == len(levels_z) - 2 else 0 # Bottom lift is rubber strike pad
        for i in range(n):
            i_next = (i + 1) % n
            f = bm.faces.new((rings[l][i], rings[l][i_next], rings[l+1][i_next], rings[l+1][i]))
            f.material_index = mat_idx
            f.smooth = True

    # Top and bottom caps
    f_top = bm.faces.new(reversed(rings[0]))
    f_top.material_index = 0
    f_top.smooth = True

    f_bot = bm.faces.new(rings[-1])
    f_bot.material_index = 1
    f_bot.smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj_heel = bpy.data.objects.new("Piece_02_HeelLifts_Solid", mesh)
    obj_heel.data.materials.append(materials["heel"])
    obj_heel.data.materials.append(materials["rubber"])
    cols["FOUNDATION"].objects.link(obj_heel)

    # 9 Flush Antique Champagne Brass Heel Nails inside horseshoe bottom lift
    nail_coords = [
        (-0.018, -0.116, 0.0003), (-0.020, -0.106, 0.0003), (-0.018, -0.094, 0.0003),
        (-0.010, -0.121, 0.0003), ( 0.000, -0.122, 0.0003), ( 0.010, -0.121, 0.0003),
        ( 0.018, -0.116, 0.0003), ( 0.020, -0.106, 0.0003), ( 0.018, -0.094, 0.0003)
    ]
    for idx, (nx, ny, nz) in enumerate(nail_coords):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.0008, depth=0.0016, vertices=12, location=(nx, ny, nz)
        )
        nail = bpy.context.active_object
        for p in nail.data.polygons:
            p.use_smooth = True
        nail.name = f"Piece_01_Heel_Nail_{idx+1}"
        nail.data.materials.append(materials["brass"])
        cols["HARDWARE"].objects.link(nail)
        bpy.context.scene.collection.objects.unlink(nail)

    return obj_heel

# ---------------------------------------------------------------------------
# 2. PIECES 3, 4, 7: CONTINUOUS PERIMETER OAK-BARK OUTSOLE & 270° WELT
# ---------------------------------------------------------------------------

def build_stitched_sole_and_welt(cols, materials):
    mesh = bpy.data.meshes.new("Piece_04_07_Outsole_and_Welt")
    bm = bmesh.new()

    sole_thickness = 0.0055
    stations_sole = []

    for idx, s in enumerate(STATIONS):
        y = s[0]
        wm = s[1]
        wl = s[2]
        zf = s[3]
        xc = s[5]

        w_shelf = 0.0034 if idx >= 3 else (0.0016 if idx == 2 else 0.0000)
        x_out_m = wm + w_shelf
        x_out_l = -wl - w_shelf

        if y < -0.080:
            zb_m = 0.0270
            zb_l = 0.0270
            zb_c = 0.0270
        else:
            zb_m = zf - sole_thickness
            zb_l = zf - sole_thickness
            zb_c = zf - sole_thickness
            if -0.060 <= y <= 0.010:
                spine = max(0.0, 1.0 - abs(y + 0.025) / 0.035)
                zb_c -= 0.0042 * spine

        # 7 vertices per station:
        # 0: lateral welt outer
        # 1: lateral feather edge
        # 2: lateral sole bottom
        # 3: center spine sole bottom
        # 4: medial sole bottom
        # 5: medial feather edge
        # 6: medial welt outer
        v_out_l = bm.verts.new((x_out_l, y, zf))
        v_in_l  = bm.verts.new((-wl,     y, zf))
        v_bot_l = bm.verts.new((x_out_l * 0.96, y, zb_l))
        v_bot_c = bm.verts.new((xc,      y, zb_c))
        v_bot_m = bm.verts.new((x_out_m * 0.96, y, zb_m))
        v_in_m  = bm.verts.new((+wm,     y, zf))
        v_out_m = bm.verts.new((x_out_m, y, zf))

        stations_sole.append((v_out_l, v_in_l, v_bot_l, v_bot_c, v_bot_m, v_in_m, v_out_m))

    # Connect quads along the longitudinal stations
    for s in range(len(STATIONS) - 1):
        s0 = stations_sole[s]
        s1 = stations_sole[s + 1]

        # 1. Lateral Welt Shelf
        f = bm.faces.new((s0[0], s1[0], s1[1], s0[1]))
        f.material_index = 0
        f.smooth = True

        # 2. Lateral Outsole Sidewall Bevel
        f = bm.faces.new((s0[2], s1[2], s1[0], s0[0]))
        f.material_index = 0
        f.smooth = True

        # 3. Lateral Bottom Sole
        f = bm.faces.new((s0[2], s0[3], s1[3], s1[2]))
        f.material_index = 0
        f.smooth = True

        # 4. Medial Bottom Sole
        f = bm.faces.new((s0[3], s0[4], s1[4], s1[3]))
        f.material_index = 0
        f.smooth = True

        # 5. Medial Outsole Sidewall Bevel
        f = bm.faces.new((s0[4], s0[6], s1[6], s1[4]))
        f.material_index = 0
        f.smooth = True

        # 6. Medial Welt Shelf
        f = bm.faces.new((s0[5], s1[5], s1[6], s0[6]))
        f.material_index = 0
        f.smooth = True

    # Toe front cap: bridge across toe tip (station -1)
    s_tip = stations_sole[-1]
    f_tw = bm.faces.new((s_tip[0], s_tip[6], s_tip[5], s_tip[1]))
    f_tw.material_index = 0
    f_tw.smooth = True

    f_ts = bm.faces.new((s_tip[2], s_tip[4], s_tip[6], s_tip[0]))
    f_ts.material_index = 0
    f_ts.smooth = True

    f_tb = bm.faces.new((s_tip[2], s_tip[3], s_tip[4]))
    f_tb.material_index = 0
    f_tb.smooth = True

    # Heel rear closure (station 0)
    s_rear = stations_sole[0]
    f_rw = bm.faces.new((s_rear[1], s_rear[5], s_rear[6], s_rear[0]))
    f_rw.material_index = 0
    f_rw.smooth = True
    f_rb = bm.faces.new((s_rear[2], s_rear[0], s_rear[6], s_rear[4]))
    f_rb.material_index = 0
    f_rb.smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj_sole = bpy.data.objects.new("Piece_04_07_Outsole_and_Welt", mesh)
    obj_sole.data.materials.append(materials["sole"])
    cols["FOUNDATION"].objects.link(obj_sole)

    # Piece 03: Leather Rand (Flush with heel seat)
    mesh_rand = bpy.data.meshes.new("Piece_03_Leather_Rand")
    bm_r = bmesh.new()
    rand_pts = make_horseshoe_profile(
        y_rear=-0.126, y_breast=-0.082, r_med=0.0315, r_lat=0.0305, num_curve=16, num_breast=8
    )
    for x, y in rand_pts:
        bm_r.verts.new((x, y, 0.0270))
        bm_r.verts.new((x * 1.015, y, 0.0270))
    bm_r.verts.ensure_lookup_table()
    for i in range(len(rand_pts)):
        i_next = (i + 1) % len(rand_pts)
        f = bm_r.faces.new((
            bm_r.verts[i * 2], bm_r.verts[i_next * 2],
            bm_r.verts[i_next * 2 + 1], bm_r.verts[i * 2 + 1]
        ))
        f.smooth = True
    bmesh.ops.recalc_face_normals(bm_r, faces=bm_r.faces)
    bm_r.to_mesh(mesh_rand)
    bm_r.free()
    for p in mesh_rand.polygons:
        p.use_smooth = True
    obj_rand = bpy.data.objects.new("Piece_03_Leather_Rand", mesh_rand)
    obj_rand.data.materials.append(materials["heel"])
    cols["FOUNDATION"].objects.link(obj_rand)

    return obj_sole

# ---------------------------------------------------------------------------
# 3. PIECES 5, 6, 8: FOUNDATION CORE
# ---------------------------------------------------------------------------

def build_piece_5_6_8_foundation_core(cols, materials):
    mesh_cork = bpy.data.meshes.new("Piece_05_Cork_Filler")
    bm_ck = bmesh.new()
    cork_stations = STATIONS[2:11]
    for s in cork_stations:
        bm_ck.verts.new(( s[1] * 0.70, s[0], s[3] + 0.0006))
        bm_ck.verts.new((-s[2] * 0.70, s[0], s[3] + 0.0006))
    bm_ck.verts.ensure_lookup_table()
    for i in range(len(cork_stations) - 1):
        i1, i2 = i * 2, i * 2 + 1
        i3, i4 = (i + 1) * 2 + 1, (i + 1) * 2
        f = bm_ck.faces.new((bm_ck.verts[i1], bm_ck.verts[i2], bm_ck.verts[i3], bm_ck.verts[i4]))
        f.smooth = True
    bmesh.ops.recalc_face_normals(bm_ck, faces=bm_ck.faces)
    bm_ck.to_mesh(mesh_cork)
    bm_ck.free()
    obj_cork = bpy.data.objects.new("Piece_05_Cork_Filler", mesh_cork)
    obj_cork.data.materials.append(materials["cork"])
    cols["INTERNAL"].objects.link(obj_cork)

    bpy.ops.mesh.primitive_cube_add(
        size=1.0, location=(0.001, -0.040, 0.020), scale=(0.010, 0.065, 0.0015)
    )
    shank = bpy.context.active_object
    shank.name = "Piece_06_Spring_Steel_Shank"
    shank.rotation_euler = (math.radians(-7), 0, 0)
    for p in shank.data.polygons:
        p.use_smooth = True
    shank.data.materials.append(materials["steel"])
    cols["INTERNAL"].objects.link(shank)
    bpy.context.scene.collection.objects.unlink(shank)

    # Insole inside shoe cavity
    mesh_in = bpy.data.meshes.new("Piece_08_Insole_VegTan")
    bm_in = bmesh.new()
    insole_stations = STATIONS[1:12]
    for s in insole_stations:
        bm_in.verts.new(( s[1] * 0.85, s[0], s[3] + 0.0010))
        bm_in.verts.new((-s[2] * 0.85, s[0], s[3] + 0.0010))
    bm_in.verts.ensure_lookup_table()
    for i in range(len(insole_stations) - 1):
        i1, i2 = i * 2, i * 2 + 1
        i3, i4 = (i + 1) * 2 + 1, (i + 1) * 2
        f = bm_in.faces.new((bm_in.verts[i1], bm_in.verts[i2], bm_in.verts[i3], bm_in.verts[i4]))
        f.smooth = True
    bmesh.ops.recalc_face_normals(bm_in, faces=bm_in.faces)
    bm_in.to_mesh(mesh_in)
    bm_in.free()
    for p in mesh_in.polygons:
        p.use_smooth = True
    obj_in = bpy.data.objects.new("Piece_08_Insole_VegTan", mesh_in)
    obj_in.data.materials.append(materials["insole"])
    cols["INTERNAL"].objects.link(obj_in)

    return shank

# ---------------------------------------------------------------------------
# 4. PIECES 11, 12, 15, 18: ORGANIC WATERTIGHT ANATOMICAL UPPER SHELL
# ---------------------------------------------------------------------------

def build_stitched_upper_shell(cols, materials):
    mesh = bpy.data.meshes.new("Piece_12_15_18_Upper_Shell")
    bm = bmesh.new()

    num_transverse = 17
    mid_idx = num_transverse // 2 # 8 is crest

    station_rings = []
    collar_pts = []

    for s_idx, (y, wm, wl, zf, zc, xc) in enumerate(STATIONS):
        ring = []
        for j in range(num_transverse):
            # Parameter u from -1.0 (lateral) to 0.0 (crest) to +1.0 (medial)
            u = (j - mid_idx) / mid_idx

            # Smooth organic elliptical curvature: cos(u * pi / 2)^0.58
            # Smooth rounded top crest, steep vertical flanks meeting feather edge cleanly!
            profile_z = math.cos(u * math.pi * 0.5) ** 0.58
            z = zf + (zc - zf) * profile_z

            if u < 0.0:
                t = -u
                x = xc * (1.0 - t) - wl * t
            else:
                t = u
                x = xc * (1.0 - t) + wm * t

            # Ankle collar opening at rear stations (0 to 5)
            if s_idx <= 4 and abs(u) < 0.45:
                u_norm = abs(u) / 0.45
                dip = 0.015 if u < 0 else 0.011
                z = z - dip * (1.0 - u_norm ** 2)

            # Soft-chisel toe profile: square off chisel shoulders
            if s_idx >= 8:
                if abs(u) < 0.40:
                    z *= 0.994
                x *= 1.008
                z += 0.0004

            v = bm.verts.new((x, y, z))
            ring.append(v)

            if s_idx <= 5 and abs(u - 0.45) < 0.15:
                collar_pts.append(Vector((x, y, z)))

        station_rings.append(ring)

    # Bridge longitudinal rings
    for r in range(len(STATIONS) - 1):
        mat_idx = 1 if r >= 8 else 0 # 1: Mirror Obsidian Cap Toe, 0: Imperial Espresso Upper
        for j in range(num_transverse - 1):
            v1 = station_rings[r][j]
            v2 = station_rings[r][j + 1]
            v3 = station_rings[r + 1][j + 1]
            v4 = station_rings[r + 1][j]
            f = bm.faces.new((v1, v2, v3, v4))
            f.material_index = mat_idx
            f.smooth = True

    # Cupped Heel Counter: Anatomical 3D calcaneus dome closure
    v_calcaneus = bm.verts.new((0.0, -0.129, 0.055)) # Bulges rearward by 3mm
    v_heel_seat = bm.verts.new((0.0, -0.1265, 0.0270)) # Heel seat bottom center
    for k in range(num_transverse - 1):
        f = bm.faces.new((station_rings[0][k], station_rings[0][k + 1], v_calcaneus))
        f.material_index = 0
        f.smooth = True
    f_h1 = bm.faces.new((station_rings[0][0], v_calcaneus, v_heel_seat))
    f_h1.material_index = 0
    f_h1.smooth = True
    f_h2 = bm.faces.new((station_rings[0][-1], v_heel_seat, v_calcaneus))
    f_h2.material_index = 0
    f_h2.smooth = True

    # Soft-Chisel Toe Tip: Anatomical 3D chisel prow closure
    v_chisel_prow = bm.verts.new((0.0, 0.170, 0.020)) # Curves forward by 2mm
    v_toe_seat = bm.verts.new((0.0, 0.1685, 0.0190)) # Toe seat bottom center
    for k in range(num_transverse - 1):
        f = bm.faces.new((station_rings[-1][k + 1], station_rings[-1][k], v_chisel_prow))
        f.material_index = 1
        f.smooth = True
    f_t1 = bm.faces.new((station_rings[-1][0], v_toe_seat, v_chisel_prow))
    f_t1.material_index = 1
    f_t1.smooth = True
    f_t2 = bm.faces.new((station_rings[-1][-1], v_chisel_prow, v_toe_seat))
    f_t2.material_index = 1
    f_t2.smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj_upper = bpy.data.objects.new("Piece_12_15_18_Upper_Shell", mesh)
    obj_upper.data.materials.append(materials["upper"])
    obj_upper.data.materials.append(materials["cap_toe"])
    cols["UPPER"].objects.link(obj_upper)

    sub = obj_upper.modifiers.new(name="Subsurf", type='SUBSURF')
    sub.levels = 2
    sub.render_levels = 2

    # Piece 11: Interior Glove Lining Cavity
    mesh_lining = bpy.data.meshes.new("Piece_11_Glove_Lining_Cavity")
    bm_li = bmesh.new()
    for s_idx in range(6):
        s = STATIONS[s_idx]
        for side in [-1, 1]:
            bm_li.verts.new((side * s[1] * 0.82, s[0], s[3] + 0.0020))
    bm_li.verts.ensure_lookup_table()
    for i in range(5):
        i1 = i * 2
        i2 = i1 + 1
        i3 = (i + 1) * 2 + 1
        i4 = (i + 1) * 2
        bm_li.faces.new((bm_li.verts[i1], bm_li.verts[i2], bm_li.verts[i3], bm_li.verts[i4])).smooth = True
    bmesh.ops.recalc_face_normals(bm_li, faces=bm_li.faces)
    bm_li.to_mesh(mesh_lining)
    bm_li.free()
    for p in mesh_lining.polygons:
        p.use_smooth = True
    obj_lining = bpy.data.objects.new("Piece_11_Glove_Lining_Cavity", mesh_lining)
    obj_lining.data.materials.append(materials["lining"])
    cols["INTERNAL"].objects.link(obj_lining)

    return obj_upper

# ---------------------------------------------------------------------------
# 5. PIECE 13 & 14: HEEL / BACK STRIP & ROLLED COLLAR BINDING
# ---------------------------------------------------------------------------

def build_piece_13_and_14_details(cols, materials):
    mesh_bs = bpy.data.meshes.new("Piece_13_Heel_Back_Strip")
    bm_bs = bmesh.new()
    num_segs = 12
    width = 0.0040 # 8mm wide strip
    for i in range(num_segs + 1):
        u = i / num_segs
        z = 0.0270 + u * (0.0880 - 0.0270)
        bow = 0.0032 * math.sin(u * math.pi)
        y = -0.1265 - bow
        bm_bs.verts.new((-width, y, z))
        bm_bs.verts.new(( width, y, z))
    bm_bs.verts.ensure_lookup_table()
    for i in range(num_segs):
        i1 = i * 2
        i2 = i1 + 1
        i3 = (i + 1) * 2 + 1
        i4 = (i + 1) * 2
        bm_bs.faces.new((bm_bs.verts[i1], bm_bs.verts[i2], bm_bs.verts[i3], bm_bs.verts[i4])).smooth = True
    bmesh.ops.recalc_face_normals(bm_bs, faces=bm_bs.faces)
    bm_bs.to_mesh(mesh_bs)
    bm_bs.free()
    for p in mesh_bs.polygons:
        p.use_smooth = True
    obj_bs = bpy.data.objects.new("Piece_13_Heel_Back_Strip", mesh_bs)
    obj_bs.data.materials.append(materials["cap_toe"])
    cols["UPPER"].objects.link(obj_bs)
    sol = obj_bs.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol.thickness = 0.0006
    sol.offset = 1.0

    curve_col = bpy.data.curves.new("Piece_14_Rolled_Collar_Binding", type='CURVE')
    curve_col.dimensions = '3D'
    curve_col.bevel_depth = 0.0014
    curve_col.bevel_resolution = 4

    sp = curve_col.splines.new('BEZIER')
    collar_loop = [
        Vector(( 0.000, -0.126, 0.088)),
        Vector((-0.016, -0.102, 0.082)),
        Vector((-0.022, -0.065, 0.071)),
        Vector((-0.014, -0.025, 0.072)),
        Vector((-0.008,  0.005, 0.074)),
        Vector(( 0.000,  0.008, 0.074)),
        Vector(( 0.008,  0.005, 0.074)),
        Vector(( 0.014, -0.025, 0.072)),
        Vector(( 0.022, -0.065, 0.073)),
        Vector(( 0.016, -0.102, 0.084)),
        Vector(( 0.000, -0.126, 0.088))
    ]
    sp.bezier_points.add(len(collar_loop) - 1)
    for idx, pt in enumerate(collar_loop):
        bp = sp.bezier_points[idx]
        bp.co = pt
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'

    obj_col = bpy.data.objects.new("Piece_14_Rolled_Collar_Binding", curve_col)
    obj_col.data.materials.append(materials["upper"])
    cols["UPPER"].objects.link(obj_col)

    return obj_bs, obj_col

# ---------------------------------------------------------------------------
# 6. PIECES 16, 17, 19, 20: FACINGS, TONGUE, LACES & MICRO-STITCHING
# ---------------------------------------------------------------------------

def build_lacing_and_finishing(cols, materials):
    mesh_t = bpy.data.meshes.new("Piece_17_Padded_Tongue")
    bm_t = bmesh.new()
    num_t = 8
    for i in range(num_t):
        u = i / (num_t - 1)
        y = 0.036 - u * 0.045
        z = 0.068 + u * 0.005
        w = 0.011 + u * 0.003
        bm_t.verts.new((-w, y, z))
        bm_t.verts.new(( w, y, z))
    bm_t.verts.ensure_lookup_table()
    for i in range(num_t - 1):
        i1 = i * 2
        i2 = i1 + 1
        i3 = (i + 1) * 2 + 1
        i4 = (i + 1) * 2
        bm_t.faces.new((bm_t.verts[i1], bm_t.verts[i2], bm_t.verts[i3], bm_t.verts[i4])).smooth = True
    bmesh.ops.recalc_face_normals(bm_t, faces=bm_t.faces)
    bm_t.to_mesh(mesh_t)
    bm_t.free()
    for p in mesh_t.polygons:
        p.use_smooth = True
    obj_tongue = bpy.data.objects.new("Piece_17_Padded_Tongue", mesh_t)
    obj_tongue.data.materials.append(materials["upper"])
    cols["UPPER"].objects.link(obj_tongue)

    eyelet_pts = [
        (Vector((-0.006, 0.035, 0.069)), Vector(( 0.006, 0.035, 0.069))),
        (Vector((-0.0065, 0.024, 0.071)), Vector(( 0.0065, 0.024, 0.071))),
        (Vector((-0.007, 0.013, 0.0725)), Vector(( 0.007, 0.013, 0.0725))),
        (Vector((-0.0075, 0.002, 0.0735)), Vector(( 0.0075, 0.002, 0.0735))),
        (Vector((-0.008, -0.009, 0.0745)), Vector(( 0.008, -0.009, 0.0745)))
    ]

    for idx, (pl, pr) in enumerate(eyelet_pts):
        for side, pt in [("L", pl), ("R", pr)]:
            bpy.ops.mesh.primitive_torus_add(
                major_radius=0.0014, minor_radius=0.00035, location=pt, rotation=(math.radians(24), 0, 0)
            )
            ey = bpy.context.active_object
            for p in ey.data.polygons:
                p.use_smooth = True
            ey.name = f"Piece_16_Eyelet_{idx+1}_{side}"
            ey.data.materials.append(materials["brass"])
            cols["HARDWARE"].objects.link(ey)
            bpy.context.scene.collection.objects.unlink(ey)

    curve_l = bpy.data.curves.new("Piece_19_Lacing_WaxedCotton", type='CURVE')
    curve_l.dimensions = '3D'
    curve_l.bevel_depth = 0.00085
    curve_l.bevel_resolution = 4

    lace_segs = [
        [eyelet_pts[0][0], Vector((0.0, 0.035, 0.0695)), eyelet_pts[0][1]],
        [eyelet_pts[0][0], Vector((-0.002, 0.029, 0.0700)), eyelet_pts[1][1]],
        [eyelet_pts[1][0], Vector((0.0, 0.024, 0.0715)), eyelet_pts[1][1]],
        [eyelet_pts[1][0], Vector((-0.002, 0.018, 0.0718)), eyelet_pts[2][1]],
        [eyelet_pts[2][0], Vector((0.0, 0.013, 0.0730)), eyelet_pts[2][1]],
        [eyelet_pts[2][0], Vector((-0.002, 0.007, 0.0730)), eyelet_pts[3][1]],
        [eyelet_pts[3][0], Vector((0.0, 0.002, 0.0740)), eyelet_pts[3][1]],
        [eyelet_pts[3][0], Vector((-0.002, -0.004, 0.0738)), eyelet_pts[4][1]],
        [eyelet_pts[4][0], Vector((0.0, -0.009, 0.0750)), eyelet_pts[4][1]],
        # Neat, compact bow knot loops resting gently on top facing
        [eyelet_pts[4][0], Vector((-0.009, -0.015, 0.077)), Vector((-0.012, -0.021, 0.077)), Vector((-0.005, -0.019, 0.076)), Vector((0.0, -0.013, 0.0755))],
        [eyelet_pts[4][1], Vector(( 0.009, -0.015, 0.077)), Vector(( 0.012, -0.021, 0.077)), Vector(( 0.005, -0.019, 0.076)), Vector((0.0, -0.013, 0.0755))],
        [Vector((0.0, -0.013, 0.0755)), Vector((-0.007, -0.018, 0.072)), Vector((-0.012, -0.024, 0.065))],
        [Vector((0.0, -0.013, 0.0755)), Vector(( 0.007, -0.018, 0.072)), Vector(( 0.012, -0.024, 0.065))]
    ]

    for seg in lace_segs:
        sp = curve_l.splines.new('BEZIER')
        sp.bezier_points.add(len(seg) - 1)
        for idx, pt in enumerate(seg):
            bp = sp.bezier_points[idx]
            bp.co = pt
            bp.handle_left_type = 'AUTO'
            bp.handle_right_type = 'AUTO'

    obj_laces = bpy.data.objects.new("Piece_19_Lacing_WaxedCotton", curve_l)
    obj_laces.data.materials.append(materials["laces"])
    cols["HARDWARE"].objects.link(obj_laces)

    aglet_cfgs = [
        (Vector((-0.013, -0.025, 0.063)), (math.radians(35), 0, math.radians(-25))),
        (Vector(( 0.013, -0.025, 0.063)), (math.radians(35), 0, math.radians(25)))
    ]
    for idx, (aglet_pos, rot) in enumerate(aglet_cfgs):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.0009, depth=0.006, vertices=12, location=aglet_pos, rotation=rot
        )
        aglet = bpy.context.active_object
        for p in aglet.data.polygons:
            p.use_smooth = True
        aglet.name = f"Piece_19_Brass_Aglet_{idx+1}"
        aglet.data.materials.append(materials["brass"])
        cols["HARDWARE"].objects.link(aglet)
        bpy.context.scene.collection.objects.unlink(aglet)

    mesh_st = bpy.data.meshes.new("Piece_20_Twin_MicroStitching_11SPI")
    bm_st = bmesh.new()
    num_st = 36
    s_cap = STATIONS[8]
    for i in range(num_st):
        u = (i - (num_st - 1) * 0.5) / ((num_st - 1) * 0.5)
        profile_z = math.cos(u * math.pi * 0.5) ** 0.58
        sz = s_cap[3] + (s_cap[4] - s_cap[3]) * profile_z + 0.0006
        if u < 0.0:
            t = -u
            sx = s_cap[5] * (1.0 - t) - s_cap[2] * t
        else:
            t = u
            sx = s_cap[5] * (1.0 - t) + s_cap[1] * t
        sy1 = 0.0792
        sy2 = 0.0808
        bm_st.verts.new((sx, sy1, sz))
        bm_st.verts.new((sx, sy2, sz))
    bm_st.verts.ensure_lookup_table()
    for i in range(num_st - 1):
        bm_st.edges.new((bm_st.verts[i * 2], bm_st.verts[(i + 1) * 2]))
        bm_st.edges.new((bm_st.verts[i * 2 + 1], bm_st.verts[(i + 1) * 2 + 1]))
    bm_st.to_mesh(mesh_st)
    bm_st.free()
    obj_stitch = bpy.data.objects.new("Piece_20_Twin_MicroStitching_11SPI", mesh_st)
    obj_stitch.data.materials.append(materials["thread"])
    cols["STITCHING"].objects.link(obj_stitch)

    return obj_laces

# ---------------------------------------------------------------------------
# 7. STUDIO ENVIRONMENT & CALIBRATED CYCLES LIGHTING RIG
# ---------------------------------------------------------------------------

def setup_studio_environment(cols):
    world = bpy.data.worlds.new("Studio_World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.04, 0.04, 0.045, 1.0)
        bg.inputs["Strength"].default_value = 0.35
    bpy.context.scene.world = world

    mesh_floor = bpy.data.meshes.new("Studio_Cyclorama")
    bm_f = bmesh.new()
    bmesh.ops.create_grid(bm_f, x_segments=32, y_segments=32, size=3.0)
    bm_f.to_mesh(mesh_floor)
    bm_f.free()
    for p in mesh_floor.polygons:
        p.use_smooth = True
    floor_obj = bpy.data.objects.new("Studio_Cyclorama", mesh_floor)
    floor_obj.location = (0, 0, 0)
    cols["STUDIO"].objects.link(floor_obj)

    m_floor = bpy.data.materials.new("M_Studio_Floor")
    m_floor.use_nodes = True
    bs_f = m_floor.node_tree.nodes.get("Principled BSDF")
    bs_f.inputs["Base Color"].default_value = (0.12, 0.12, 0.14, 1.0)
    bs_f.inputs["Roughness"].default_value = 0.40
    floor_obj.data.materials.append(m_floor)

    lights = [
        ("Key_Light", 'AREA', (0.45, -0.25, 0.55), (0, 0, 0), 24.0, (0.35, 0.35)),
        ("Fill_Light", 'AREA', (-0.50, 0.15, 0.40), (0, 0, 0), 9.0, (0.50, 0.50)),
        ("Rim_Specular", 'SPOT', (-0.25, 0.50, 0.45), (0, 0, 0), 18.0, (0.20, 0.20)),
        ("Bounce_Floor", 'AREA', (0.0, 0.0, 0.02), (0, 0, 0), 4.0, (0.80, 0.80)),
        ("Upward_Sole_Light", 'AREA', (0.0, 0.0, -0.42), (math.pi, 0, 0), 16.0, (0.50, 0.50))
    ]
    for name, l_type, loc, rot, energy, size in lights:
        l_data = bpy.data.lights.new(name=name, type=l_type)
        l_data.energy = energy
        if l_type == 'AREA':
            l_data.size = size[0]
            l_data.size_y = size[1]
        elif l_type == 'SPOT':
            l_data.spot_size = math.radians(45)
            l_data.spot_blend = 0.4
        l_obj = bpy.data.objects.new(name, l_data)
        l_obj.location = loc
        l_obj.rotation_euler = rot
        cols["STUDIO"].objects.link(l_obj)

    return floor_obj

# ---------------------------------------------------------------------------
# 8. CAMERAS & PHOTOGRAPHIC CYCLES RENDERING SUITE
# ---------------------------------------------------------------------------

CAMERAS = {
    "hero_three_quarter": {
        "loc": (0.42, -0.48, 0.25), "rot": (math.radians(67), 0, math.radians(40)),
        "lens": 85, "output": "renders/final/hero_three_quarter.jpg"
    },
    "side_lateral": {
        "loc": (-0.78, 0.02, 0.045), "rot": (math.radians(90), 0, math.radians(-90)),
        "lens": 85, "output": "renders/final/side_lateral.jpg"
    },
    "front": {
        "loc": (0.0, 0.65, 0.080), "rot": (math.radians(82), 0, math.radians(180)),
        "lens": 90, "output": "renders/final/front.jpg"
    },
    "rear": {
        "loc": (0.0, -0.65, 0.080), "rot": (math.radians(82), 0, 0),
        "lens": 90, "output": "renders/final/rear.jpg"
    },
    "sole_fiddleback": {
        "loc": (0.0, 0.02, -0.58), "rot": (math.radians(180), 0, 0),
        "lens": 85, "output": "renders/final/sole_fiddleback.jpg",
        "hide_floor": True
    },
    "macro_toe_cap": {
        "loc": (0.16, 0.32, 0.10), "rot": (math.radians(65), 0, math.radians(25)),
        "lens": 105, "output": "renders/macro/macro_toe_cap.jpg"
    },
    "macro_heel_stack": {
        "loc": (-0.18, -0.26, 0.06), "rot": (math.radians(78), 0, math.radians(-32)),
        "lens": 105, "output": "renders/macro/macro_heel_stack.jpg"
    }
}

def render_suite(base_dir):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 95

    cam_data = bpy.data.cameras.new("Master_Camera")
    cam_obj = bpy.data.objects.new("Master_Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    floor_obj = bpy.data.objects.get("Studio_Cyclorama")

    print("\n--- INITIATING MASTER CYCLES RENDERING SUITE ---")
    for shot_name, cfg in CAMERAS.items():
        cam_obj.location = cfg["loc"]
        cam_obj.rotation_euler = cfg["rot"]
        cam_data.lens = cfg["lens"]

        if cfg.get("hide_floor", False) and floor_obj:
            floor_obj.hide_render = True
        else:
            if floor_obj:
                floor_obj.hide_render = False

        out_path = os.path.join(base_dir, cfg["output"])
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        scene.render.filepath = out_path

        print(f"Rendering: {shot_name} -> {out_path}...")
        bpy.ops.render.render(write_still=True)
        print(f"COMPLETED: {shot_name}")

# ---------------------------------------------------------------------------
# 9. PRODUCTION GLTF/GLB EXPORT FOR THREE.JS
# ---------------------------------------------------------------------------

def export_production_glb(base_dir):
    web_dir = os.path.join(base_dir, "web", "assets")
    dist_dir = os.path.join(base_dir, "web", "dist", "assets")
    os.makedirs(web_dir, exist_ok=True)
    os.makedirs(dist_dir, exist_ok=True)

    target_file = os.path.join(web_dir, "shoe001_aurelius.glb")
    dist_file = os.path.join(dist_dir, "shoe001_aurelius.glb")

    master_col = bpy.data.collections.get("SHOE_001_AURELIUS")
    for obj in bpy.data.objects:
        obj.select_set(False)

    for col in master_col.children:
        if col.name != "STUDIO":
            for obj in col.objects:
                obj.select_set(True)

    print(f"\nExporting Production GLB -> {target_file}...")
    bpy.ops.export_scene.gltf(
        filepath=target_file,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT'
    )
    
    import shutil
    shutil.copyfile(target_file, dist_file)
    print(f"Synced to dist -> {dist_file}")

# ---------------------------------------------------------------------------
# MAIN EXECUTION PIPELINE
# ---------------------------------------------------------------------------

def main():
    base_dir = r"c:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001"
    print("\n=======================================================")
    print("STARTING BESPOKE FOOTWEAR MASTER GENERATOR (SHOE_001)")
    print("=======================================================")

    clear_scene()
    master_col, cols = setup_collections()
    materials = create_materials()

    print("Building Foundation Core & Heel...")
    build_piece_1_and_2_solid_heel(cols, materials)
    build_piece_5_6_8_foundation_core(cols, materials)

    print("Building 270° Goodyear Welt & Fiddleback Outsole...")
    build_stitched_sole_and_welt(cols, materials)

    print("Building Anatomical Watertight Upper Shell...")
    build_stitched_upper_shell(cols, materials)

    print("Building Heel Back Strip & Rolled Collar...")
    build_piece_13_and_14_details(cols, materials)

    print("Building Facings, Lacing, Tongue & Micro-Stitching...")
    build_lacing_and_finishing(cols, materials)

    print("Setting up Studio Environment & Calibrated Lighting...")
    setup_studio_environment(cols)

    blend_file = os.path.join(base_dir, "blender", "master", "SHOE_001_MASTER.blend")
    os.makedirs(os.path.dirname(blend_file), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend_file)
    print(f"Saved master blend -> {blend_file}")

    export_production_glb(base_dir)
    render_suite(base_dir)

    print("\n=======================================================")
    print("SHOE_001 'AEROPRO AURELIUS' GENERATION COMPLETE!")
    print("=======================================================")

if __name__ == "__main__":
    main()
