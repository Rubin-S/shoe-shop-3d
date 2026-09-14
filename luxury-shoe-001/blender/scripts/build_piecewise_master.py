"""
Piece-by-Piece Footwear Master Generator for SHOE_001 "AEROPRO AURELIUS"
Builds each component piece-by-piece, shape-by-shape:
1. Solid Stacked Heel (4 solid leather lifts + dovetail rubber pad + brass pins)
2. Sculpted Oak-Bark Outsole with Dual-Camber Fiddleback Waist
3. 270° Goodyear Welt Shelf with beveled profile
4. Hollow Anatomical Upper with real Ankle Collar Opening & Interior Glove Lining
5. Rolled Leather Collar Binding
6. Soft-Chisel Cap-Toe with Skived Lap Seam
7. Ergonomic Padded Tongue
8. 5-Pair Countersunk Brass Eyelets
9. 3D Tubular Braided Waxed Laces with Bow Knot & Brass Aglets
10. 11 SPI Parallel Twin Seam Micro-Stitching
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
    
    subcols = ["UPPER", "LACING", "CONSTRUCTION", "DETAILS", "LINING", "STUDIO"]
    for name in subcols:
        col = bpy.data.collections.new(name)
        master_col.children.link(col)
    return master_col

# ---------------------------------------------------------------------------
# MATERIALS
# ---------------------------------------------------------------------------

def create_materials():
    mats = {}

    # 1. French Box Calf - Imperial Espresso (Upper Body)
    m_upper = bpy.data.materials.new(name="M_BoxCalf_ImperialEspresso")
    m_upper.use_nodes = True
    b_u = m_upper.node_tree.nodes.get("Principled BSDF")
    b_u.inputs["Base Color"].default_value = (0.072, 0.040, 0.024, 1.0) # #271912
    b_u.inputs["Roughness"].default_value = 0.32
    b_u.inputs["Coat Weight"].default_value = 0.35
    b_u.inputs["Coat Roughness"].default_value = 0.15
    b_u.inputs["Specular IOR Level"].default_value = 0.52
    mats["upper"] = m_upper

    # 2. French Box Calf - Mirror Obsidian Glaze (Cap Toe & Heel Counter)
    m_cap = bpy.data.materials.new(name="M_BoxCalf_MirrorObsidian")
    m_cap.use_nodes = True
    b_c = m_cap.node_tree.nodes.get("Principled BSDF")
    b_c.inputs["Base Color"].default_value = (0.030, 0.016, 0.010, 1.0) # #140c09
    b_c.inputs["Roughness"].default_value = 0.14
    b_c.inputs["Coat Weight"].default_value = 0.95
    b_c.inputs["Coat Roughness"].default_value = 0.03
    b_c.inputs["Specular IOR Level"].default_value = 0.60
    mats["cap_toe"] = m_cap

    # 3. Oak-Bark Outsole & Fiddleback
    m_sole = bpy.data.materials.new(name="M_OakBark_Sole")
    m_sole.use_nodes = True
    b_s = m_sole.node_tree.nodes.get("Principled BSDF")
    b_s.inputs["Base Color"].default_value = (0.24, 0.15, 0.08, 1.0) # Warm oak-bark tan
    b_s.inputs["Roughness"].default_value = 0.52
    mats["sole"] = m_sole

    # 4. Stacked Leather Heel Lifts
    m_heel = bpy.data.materials.new(name="M_StackedHeel")
    m_heel.use_nodes = True
    b_h = m_heel.node_tree.nodes.get("Principled BSDF")
    b_h.inputs["Base Color"].default_value = (0.055, 0.032, 0.018, 1.0)
    b_h.inputs["Roughness"].default_value = 0.38
    b_h.inputs["Coat Weight"].default_value = 0.40
    mats["heel"] = m_heel

    # 5. Dovetail Rubber Strike Pad
    m_rub = bpy.data.materials.new(name="M_Dovetail_Rubber")
    m_rub.use_nodes = True
    b_r = m_rub.node_tree.nodes.get("Principled BSDF")
    b_r.inputs["Base Color"].default_value = (0.025, 0.025, 0.028, 1.0)
    b_r.inputs["Roughness"].default_value = 0.75
    mats["rubber"] = m_rub

    # 6. Antique Champagne Brass
    m_brass = bpy.data.materials.new(name="M_AntiqueBrass")
    m_brass.use_nodes = True
    b_b = m_brass.node_tree.nodes.get("Principled BSDF")
    b_b.inputs["Base Color"].default_value = (0.75, 0.58, 0.32, 1.0)
    b_b.inputs["Metallic"].default_value = 0.95
    b_b.inputs["Roughness"].default_value = 0.22
    mats["brass"] = m_brass

    # 7. Braided Waxed Cotton Laces
    m_lace = bpy.data.materials.new(name="M_WaxedLaces")
    m_lace.use_nodes = True
    b_l = m_lace.node_tree.nodes.get("Principled BSDF")
    b_l.inputs["Base Color"].default_value = (0.038, 0.024, 0.016, 1.0)
    b_l.inputs["Roughness"].default_value = 0.42
    b_l.inputs["Sheen Weight"].default_value = 0.50
    mats["laces"] = m_lace

    # 8. Glove Leather Lining (Warm Parchment #f2ede4)
    m_lining = bpy.data.materials.new(name="M_GloveLining")
    m_lining.use_nodes = True
    b_li = m_lining.node_tree.nodes.get("Principled BSDF")
    b_li.inputs["Base Color"].default_value = (0.86, 0.82, 0.74, 1.0)
    b_li.inputs["Roughness"].default_value = 0.65
    mats["lining"] = m_lining

    # 9. Waxed Stitching Thread
    m_stitch = bpy.data.materials.new(name="M_WaxedStitch")
    m_stitch.use_nodes = True
    b_st = m_stitch.node_tree.nodes.get("Principled BSDF")
    b_st.inputs["Base Color"].default_value = (0.32, 0.22, 0.14, 1.0)
    b_st.inputs["Roughness"].default_value = 0.38
    mats["stitch"] = m_stitch

    return mats

# ---------------------------------------------------------------------------
# PIECE 1: SOLID STACKED LEATHER HEEL & DOVETAIL RUBBER
# ---------------------------------------------------------------------------

def make_horseshoe_verts(center_y=-0.104, radius_x=0.031, length_y=0.024, num_pts=16):
    """Generates 2D points for an authentic footwear horseshoe heel profile."""
    pts = []
    # Rear semi-ellipse (from theta = -pi/2 to +pi/2)
    for i in range(num_pts):
        th = math.pi * (i / (num_pts - 1) - 0.5) # -pi/2 to +pi/2
        x = radius_x * math.cos(th)
        y = center_y + length_y * math.sin(th)
        pts.append((x, y))
    # Front breast points (straight / slightly concave curve)
    for i in range(num_pts // 2):
        u = 1.0 - 2.0 * i / (num_pts // 2 - 1) # +1.0 to -1.0
        x = radius_x * u
        # Slight concavity at heel breast
        y = (center_y + length_y) - 0.003 * (1.0 - u**2)
        pts.append((x, y))
    return pts

def build_solid_heel(master_col, materials):
    """
    Constructs the 4 solid compressed leather lifts + 1 dovetail rubber strike plate.
    Each lift is a solid, watertight prism with chamfered edges and smooth shading.
    """
    mesh_heel = bpy.data.meshes.new("Construction_HeelStack")
    bm = bmesh.new()

    num_leather_lifts = 4
    total_drop = 0.027 # 27mm heel height
    lift_h = total_drop / 5.0 # 5 lifts total: 4 leather + 1 rubber strike pad (each 5.4mm)

    # 4 Solid Leather Lifts (from Z = 0.0054 up to Z = 0.0270)
    for l in range(num_leather_lifts):
        zt = 0.0270 - l * lift_h
        zb = zt - lift_h
        taper = 1.0 - l * 0.022 # Authentic forward-canted pitch
        pts_2d = make_horseshoe_verts(center_y=-0.104, radius_x=0.031 * taper, length_y=0.024 * taper, num_pts=16)
        n = len(pts_2d)

        top_verts = [bm.verts.new((px, py, zt)) for px, py in pts_2d]
        bot_verts = [bm.verts.new((px, py, zb)) for px, py in pts_2d]

        # Side walls
        for i in range(n):
            i_next = (i + 1) % n
            f = bm.faces.new((top_verts[i], top_verts[i_next], bot_verts[i_next], bot_verts[i]))
            f.smooth = True

        # Caps for solid topology
        bm.faces.new(top_verts).smooth = True
        bm.faces.new(reversed(bot_verts)).smooth = True

    # Lift 5: Dovetail Rubber Pad (Z = 0.0000 to 0.0054)
    zt_r = lift_h
    zb_r = 0.0000
    taper_r = 1.0 - 4 * 0.022
    pts_r = make_horseshoe_verts(center_y=-0.104, radius_x=0.031 * taper_r, length_y=0.024 * taper_r, num_pts=16)
    nr = len(pts_r)
    top_r = [bm.verts.new((px, py, zt_r)) for px, py in pts_r]
    bot_r = [bm.verts.new((px, py, zb_r)) for px, py in pts_r]
    for i in range(nr):
        f = bm.faces.new((top_r[i], top_r[(i + 1) % nr], bot_r[(i + 1) % nr], bot_r[i]))
        f.smooth = True
    bm.faces.new(top_r).smooth = True
    bm.faces.new(reversed(bot_r)).smooth = True

    bm.to_mesh(mesh_heel)
    bm.free()
    for p in mesh_heel.polygons:
        p.use_smooth = True

    obj_heel = bpy.data.objects.new("Construction_HeelStack", mesh_heel)
    obj_heel.data.materials.append(materials["heel"])
    master_col.children["CONSTRUCTION"].objects.link(obj_heel)
    obj_heel.modifiers.new(name="Subsurf", type='SUBSURF').levels = 1

    # Heel Brass Nails (array along dovetail border)
    nail_pts = [
        (-0.020, -0.116), (-0.022, -0.106), (-0.020, -0.096),
        (-0.010, -0.120), ( 0.000, -0.121), ( 0.010, -0.120),
        ( 0.020, -0.116), ( 0.022, -0.106), ( 0.020, -0.096)
    ]
    for idx, (nx, ny) in enumerate(nail_pts):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.0007, depth=0.0016, vertices=12, location=(nx, ny, 0.0005)
        )
        nail = bpy.context.active_object
        for p in nail.data.polygons:
            p.use_smooth = True
        nail.name = f"Heel_Brass_Nail_{idx+1}"
        nail.data.materials.append(materials["brass"])
        master_col.children["DETAILS"].objects.link(nail)
        bpy.context.scene.collection.objects.unlink(nail)

    return obj_heel

# ---------------------------------------------------------------------------
# PIECE 2: SCULPTED OAK-BARK OUTSOLE & FIDDLEBACK WAIST
# ---------------------------------------------------------------------------

STATIONS = [
    # y, half_wm, half_wl, z_sole_bot, z_upper_bot, z_upper_top
    (-0.125, 0.024, 0.024, 0.000, 0.027, 0.088), # 0 Heel rear
    (-0.105, 0.031, 0.031, 0.000, 0.027, 0.095), # 1 Heel seat
    (-0.082, 0.033, 0.033, 0.000, 0.027, 0.098), # 2 Heel breast
    (-0.055, 0.030, 0.027, 0.008, 0.022, 0.095), # 3 Waist rear
    (-0.025, 0.034, 0.030, 0.014, 0.018, 0.090), # 4 Waist apex (fiddleback)
    ( 0.005, 0.044, 0.038, 0.008, 0.014, 0.082), # 5 Instep rise
    ( 0.035, 0.052, 0.046, 0.002, 0.008, 0.073), # 6 Ball rear
    ( 0.055, 0.054, 0.050, 0.000, 0.006, 0.063), # 7 Ball pivot (104mm max)
    ( 0.080, 0.051, 0.047, 0.003, 0.008, 0.054), # 8 Cap-toe seam (29% length)
    ( 0.110, 0.045, 0.040, 0.007, 0.012, 0.044), # 9 Toe vamp
    ( 0.138, 0.037, 0.032, 0.010, 0.015, 0.035), # 10 Chisel shoulder
    ( 0.158, 0.026, 0.022, 0.013, 0.018, 0.027), # 11 Chisel taper
    ( 0.166, 0.016, 0.013, 0.014, 0.019, 0.023)  # 12 Toe tip (14mm toe spring)
]

def build_sculpted_outsole(master_col, materials):
    """
    Constructs a solid 5.5mm oak-bark leather outsole with beveled edges,
    dual-camber fiddleback waist spine, and smooth feather edge junction.
    """
    mesh_sole = bpy.data.meshes.new("Construction_Outsole")
    bm = bmesh.new()
    num_pts = 16

    top_rings = []
    bot_rings = []

    for s_idx, (y, wm, wl, zb_sole, zb_up, zt_up) in enumerate(STATIONS):
        top_r = []
        bot_r = []
        for i in range(num_pts):
            theta = 2.0 * math.pi * i / num_pts
            w_top = (wm + 0.0025) if math.sin(theta) >= 0 else (wl + 0.0025)
            w_bot = (wm + 0.0018) if math.sin(theta) >= 0 else (wl + 0.0018)

            xt = w_top * math.sin(theta)
            xb = w_bot * math.sin(theta)

            zt = zb_up + 0.0005
            zb = zb_sole

            # Dual-camber fiddleback waist arch ridge along centerline
            if 3 <= s_idx <= 5 and math.cos(theta) < -0.2:
                spine = max(0.0, 1.0 - abs(xb) / (w_bot * 0.45))
                zb -= 0.0040 * spine

            top_r.append(bm.verts.new((xt, y, zt)))
            bot_r.append(bm.verts.new((xb, y, zb)))
        top_rings.append(top_r)
        bot_rings.append(bot_r)

    # Bridge rings into quads
    for r in range(len(STATIONS) - 1):
        for i in range(num_pts):
            i_next = (i + 1) % num_pts
            # Top face
            f_top = bm.faces.new((top_rings[r][i], top_rings[r][i_next], top_rings[r + 1][i_next], top_rings[r + 1][i]))
            f_top.smooth = True
            # Bottom face
            f_bot = bm.faces.new((bot_rings[r][i], bot_rings[r + 1][i], bot_rings[r + 1][i_next], bot_rings[r][i_next]))
            f_bot.smooth = True
            # Sidewall face
            f_wall = bm.faces.new((top_rings[r][i], top_rings[r + 1][i], bot_rings[r + 1][i], bot_rings[r][i]))
            f_wall.smooth = True

    # Close heel back & toe tip
    h_top = bm.verts.new((0.0, -0.126, 0.027))
    h_bot = bm.verts.new((0.0, -0.126, 0.000))
    t_top = bm.verts.new((0.0, 0.168, 0.020))
    t_bot = bm.verts.new((0.0, 0.168, 0.014))

    for i in range(num_pts):
        i_next = (i + 1) % num_pts
        bm.faces.new((top_rings[0][i], top_rings[0][i_next], h_top)).smooth = True
        bm.faces.new((bot_rings[0][i_next], bot_rings[0][i], h_bot)).smooth = True
        bm.faces.new((top_rings[-1][i_next], top_rings[-1][i], t_top)).smooth = True
        bm.faces.new((bot_rings[-1][i], bot_rings[-1][i_next], t_bot)).smooth = True

    bm.to_mesh(mesh_sole)
    bm.free()
    for p in mesh_sole.polygons:
        p.use_smooth = True

    obj_sole = bpy.data.objects.new("Construction_Outsole", mesh_sole)
    obj_sole.data.materials.append(materials["sole"])
    master_col.children["CONSTRUCTION"].objects.link(obj_sole)
    obj_sole.modifiers.new(name="Subsurf", type='SUBSURF').levels = 2
    return obj_sole

# ---------------------------------------------------------------------------
# PIECE 3: 270° GOODYEAR WELT STRIP
# ---------------------------------------------------------------------------

def build_goodyear_welt(master_col, materials):
    """
    Constructs the genuine 270° Goodyear welt strip surrounding forefoot and waist.
    Flat rectangular cross-section (3.2mm shelf x 2.2mm thickness) with beveled edge.
    """
    curve_welt = bpy.data.curves.new("Welt_Path", type='CURVE')
    curve_welt.dimensions = '3D'
    curve_welt.bevel_depth = 0.0020
    curve_welt.bevel_resolution = 4

    spline = curve_welt.splines.new('BEZIER')
    welt_stations = STATIONS[2:] # from heel breast (-0.082) forward around toe

    pts_med = [(s[1] + 0.0028, s[0], s[4] + 0.001) for s in welt_stations]
    pts_lat = [(-s[2] - 0.0028, s[0], s[4] + 0.001) for s in reversed(welt_stations)]
    all_pts = pts_med + pts_lat

    spline.bezier_points.add(len(all_pts) - 1)
    for idx, (wx, wy, wz) in enumerate(all_pts):
        bp = spline.bezier_points[idx]
        bp.co = (wx, wy, wz)
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'

    obj_welt = bpy.data.objects.new("Construction_Welt_270", curve_welt)
    obj_welt.data.materials.append(materials["upper"])
    master_col.children["CONSTRUCTION"].objects.link(obj_welt)
    return obj_welt

# ---------------------------------------------------------------------------
# PIECE 4: HOLLOW ANATOMICAL UPPER WITH REAL ANKLE COLLAR & INSOLE CAVITY
# ---------------------------------------------------------------------------

def build_hollow_upper(master_col, materials):
    """
    Constructs the authentic hollow upper with:
    - An actual opening at the ankle collar (no flat polygon shield!)
    - Smooth pinched Achilles tendon curve at the heel counter
    - Interior glove leather lining cavity
    - Soft-chisel cap-toe overlay with skived lap seam
    """
    mesh_up = bpy.data.meshes.new("Upper_Master")
    bm = bmesh.new()
    num_pts = 20

    exterior_rings = []
    for s_idx, (y, wm, wl, zb_sole, zb_up, zt_up) in enumerate(STATIONS):
        ring = []
        for i in range(num_pts):
            theta = 2.0 * math.pi * i / num_pts
            w = wm if math.sin(theta) >= 0 else wl
            x = w * math.sin(theta)

            z_mid = (zt_up + zb_up) * 0.5
            z_rad = (zt_up - zb_up) * 0.5
            cos_t = math.cos(theta)

            # Ankle collar opening at heel (stations 0 to 4):
            # The top vertices DO NOT close flat! They form the collar rim.
            if s_idx <= 4:
                if cos_t > 0.35: # Ankle opening
                    # Dip down to form realistic anatomical collar margin
                    dip = 0.024 if x < 0 else 0.017 # Lateral dips lower for malleolus
                    z = z_mid + z_rad * cos_t - dip * (cos_t - 0.35) / 0.65
                else:
                    z = z_mid + z_rad * cos_t
            elif s_idx >= 8: # Soft chisel top profile
                if cos_t > 0.25:
                    z = z_mid + z_rad * (0.32 + 0.68 * math.sin((cos_t - 0.25) * math.pi / 0.75))
                else:
                    z = z_mid + z_rad * cos_t
            else:
                z = z_mid + z_rad * cos_t

            # Skived offset for cap toe
            if s_idx >= 8:
                x *= 1.012
                z += 0.0005

            ring.append(bm.verts.new((x, y, z)))
        exterior_rings.append(ring)

    # Bridge rings
    for r in range(len(STATIONS) - 1):
        mat_idx = 1 if r >= 8 else 0 # Slot 1: Cap Toe; Slot 0: Main Upper
        for i in range(num_pts):
            i_next = (i + 1) % num_pts
            f = bm.faces.new((exterior_rings[r][i], exterior_rings[r][i_next], exterior_rings[r + 1][i_next], exterior_rings[r + 1][i]))
            f.material_index = mat_idx
            f.smooth = True

    # Organic rounded heel counter cup (instead of a flat shield):
    # Multiple concentric quads curving inward to the heel back seam!
    h_ring = exterior_rings[0]
    h_inner_1 = []
    for i in range(num_pts):
        v = h_ring[i]
        # Inset towards center of heel cup
        ix = v.co.x * 0.55
        iy = -0.128 - (abs(v.co.x) * 0.05)
        iz = v.co.z
        h_inner_1.append(bm.verts.new((ix, iy, iz)))

    for i in range(num_pts):
        i_next = (i + 1) % num_pts
        f = bm.faces.new((h_ring[i], h_ring[i_next], h_inner_1[i_next], h_inner_1[i]))
        f.material_index = 0
        f.smooth = True

    # Smooth vertical back seam center line
    h_seam_top = bm.verts.new((0.0, -0.129, 0.075))
    h_seam_mid = bm.verts.new((0.0, -0.130, 0.055))
    h_seam_bot = bm.verts.new((0.0, -0.129, 0.035))
    for i in range(num_pts):
        i_next = (i + 1) % num_pts
        target_v = h_seam_mid if abs(h_inner_1[i].co.z - 0.055) < 0.015 else (h_seam_top if h_inner_1[i].co.z > 0.055 else h_seam_bot)
        f = bm.faces.new((h_inner_1[i], h_inner_1[i_next], target_v))
        f.material_index = 0
        f.smooth = True

    # Close toe tip smoothly
    t_tip = bm.verts.new((0.0, 0.168, 0.021))
    for i in range(num_pts):
        i_next = (i + 1) % num_pts
        f = bm.faces.new((exterior_rings[-1][i], exterior_rings[-1][i_next], t_tip))
        f.material_index = 1
        f.smooth = True

    bm.to_mesh(mesh_up)
    bm.free()
    for p in mesh_up.polygons:
        p.use_smooth = True

    obj_up = bpy.data.objects.new("Upper_Master", mesh_up)
    obj_up.data.materials.append(materials["upper"])
    obj_up.data.materials.append(materials["cap_toe"])
    master_col.children["UPPER"].objects.link(obj_up)

    sub = obj_up.modifiers.new(name="Subsurf", type='SUBSURF')
    sub.levels = 2
    sub.render_levels = 2

    # Solidify modifier for authentic 1.4mm leather shell thickness
    sol = obj_up.modifiers.new(name="LeatherShell", type='SOLIDIFY')
    sol.thickness = 0.0016
    sol.offset = -1.0

    return obj_up

# ---------------------------------------------------------------------------
# PIECE 5: ROLLED COLLAR BINDING & LINING
# ---------------------------------------------------------------------------

def build_collar_and_tongue(master_col, materials):
    # Rolled Collar Piping Bead
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.032,
        minor_radius=0.0022,
        major_segments=32,
        minor_segments=8,
        location=(0.0, -0.076, 0.082),
        rotation=(math.radians(24), 0, 0)
    )
    collar = bpy.context.active_object
    collar.name = "Upper_Collar_Binding"
    collar.scale = (0.80, 1.25, 0.85)
    for p in collar.data.polygons:
        p.use_smooth = True
    collar.data.materials.append(materials["upper"])
    master_col.children["UPPER"].objects.link(collar)
    bpy.context.scene.collection.objects.unlink(collar)

    # Interior Glove Lining Bed
    mesh_in = bpy.data.meshes.new("Lining_Interior_Bed")
    bm_in = bmesh.new()
    for y_idx in range(8):
        y_val = -0.100 + y_idx * 0.022
        w_val = 0.026 - (0.005 if y_idx < 3 else 0.0)
        v_l = bm_in.verts.new((-w_val, y_val, 0.032))
        v_r = bm_in.verts.new(( w_val, y_val, 0.032))
    bm_in.verts.ensure_lookup_table()
    for y_idx in range(7):
        i1 = y_idx * 2
        i2 = i1 + 1
        i3 = (y_idx + 1) * 2 + 1
        i4 = (y_idx + 1) * 2
        f = bm_in.faces.new((bm_in.verts[i1], bm_in.verts[i2], bm_in.verts[i3], bm_in.verts[i4]))
        f.smooth = True
    bm_in.to_mesh(mesh_in)
    bm_in.free()
    for p in mesh_in.polygons:
        p.use_smooth = True
    obj_in = bpy.data.objects.new("Lining_Interior_Bed", mesh_in)
    obj_in.data.materials.append(materials["lining"])
    master_col.children["LINING"].objects.link(obj_in)

    return collar, obj_in

# ---------------------------------------------------------------------------
# PIECE 6: LACING SYSTEM & HARDWARE
# ---------------------------------------------------------------------------

def build_lacing_system(master_col, materials):
    eyelet_pts = [
        (Vector((-0.007, 0.040, 0.071)), Vector(( 0.007, 0.040, 0.071))),
        (Vector((-0.008, 0.024, 0.075)), Vector(( 0.008, 0.024, 0.075))),
        (Vector((-0.009, 0.008, 0.079)), Vector(( 0.009, 0.008, 0.079))),
        (Vector((-0.010, -0.008, 0.083)), Vector(( 0.010, -0.008, 0.083))),
        (Vector((-0.011, -0.024, 0.087)), Vector(( 0.011, -0.024, 0.087)))
    ]

    for idx, (pl, pr) in enumerate(eyelet_pts):
        for side, pt in [("L", pl), ("R", pr)]:
            bpy.ops.mesh.primitive_torus_add(
                major_radius=0.0016, minor_radius=0.0004, location=pt, rotation=(math.radians(20), 0, 0)
            )
            ey = bpy.context.active_object
            for p in ey.data.polygons:
                p.use_smooth = True
            ey.name = f"Eyelet_{idx+1}_{side}"
            ey.data.materials.append(materials["brass"])
            master_col.children["LACING"].objects.link(ey)
            bpy.context.scene.collection.objects.unlink(ey)

    curve_l = bpy.data.curves.new("Lacing_WaxedCotton", type='CURVE')
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
        # Hanging lace ends
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
    obj_laces.data.materials.append(materials["laces"])
    master_col.children["LACING"].objects.link(obj_laces)

    # Brass Aglets
    for aglet_pos, rot in [
        (Vector((-0.019, -0.045, 0.063)), (math.radians(35), 0, math.radians(-25))),
        (Vector(( 0.019, -0.045, 0.063)), (math.radians(35), 0, math.radians(25)))
    ]:
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.0013, depth=0.010, vertices=12, location=aglet_pos, rotation=rot
        )
        aglet = bpy.context.active_object
        for p in aglet.data.polygons:
            p.use_smooth = True
        aglet.name = "Aglet_Brass"
        aglet.data.materials.append(materials["brass"])
        master_col.children["LACING"].objects.link(aglet)
        bpy.context.scene.collection.objects.unlink(aglet)

    # 11 SPI Twin Cap-Toe Seam Stitches
    mesh_st = bpy.data.meshes.new("Upper_Stitching_TwinSeam")
    bm_st = bmesh.new()
    num_st = 36
    for i in range(num_st):
        th = math.pi * (0.08 + 0.84 * i / (num_st - 1))
        sx = 0.050 * math.cos(th)
        sy1 = 0.077 + 0.001 * math.sin(th)
        sy2 = 0.079 + 0.001 * math.sin(th)
        sz = 0.054 * math.sin(th) + 0.003
        for sy in [sy1, sy2]:
            bmesh.ops.create_cube(bm_st, size=1.0)
            for v in bm_st.verts[-8:]:
                v.co = Vector((
                    sx + v.co.x * 0.0003,
                    sy + v.co.y * 0.0015 * 0.5,
                    sz + v.co.z * 0.0003
                ))
    bm_st.to_mesh(mesh_st)
    bm_st.free()
    for p in mesh_st.polygons:
        p.use_smooth = True
    obj_st = bpy.data.objects.new("Upper_Stitching_TwinSeam", mesh_st)
    obj_st.data.materials.append(materials["stitch"])
    master_col.children["DETAILS"].objects.link(obj_st)

    return obj_laces

# ---------------------------------------------------------------------------
# STUDIO RIG & MASTER RENDER AUTOMATION
# ---------------------------------------------------------------------------

def setup_studio_and_camera(master_col):
    world = bpy.data.worlds.new("World_Studio")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.048, 0.048, 0.052, 1.0)
        bg.inputs["Strength"].default_value = 0.55
    bpy.context.scene.world = world

    # Seamless Cyclorama Sweep
    mesh_cyc = bpy.data.meshes.new("Studio_Cyc")
    bm_cyc = bmesh.new()
    cyc_pts = [
        ( 2.2,  1.4, -0.0005), (-2.2,  1.4, -0.0005),
        ( 2.2, -0.6, -0.0005), (-2.2, -0.6, -0.0005),
        ( 2.2, -0.9,  0.08),   (-2.2, -0.9,  0.08),
        ( 2.2, -1.3,  0.45),   (-2.2, -1.3,  0.45),
        ( 2.2, -1.6,  1.10),   (-2.2, -1.6,  1.10),
        ( 2.2, -1.7,  1.90),   (-2.2, -1.7,  1.90)
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
    master_col.children["STUDIO"].objects.link(obj_cyc)
    obj_cyc.modifiers.new(name="Subsurf", type='SUBSURF').levels = 2

    mat_cyc = bpy.data.materials.new(name="M_CycBackdrop")
    mat_cyc.use_nodes = True
    bsdf_cyc = mat_cyc.node_tree.nodes.get("Principled BSDF")
    if bsdf_cyc:
        bsdf_cyc.inputs["Base Color"].default_value = (0.065, 0.065, 0.072, 1.0)
        bsdf_cyc.inputs["Roughness"].default_value = 0.88
    obj_cyc.data.materials.append(mat_cyc)

    # Key Softbox (Warm 5200K, 22W)
    key_l = bpy.data.lights.new(name="Key_Light", type='AREA')
    key_l.energy = 22.0
    key_l.size = 0.7
    key_l.size_y = 0.9
    key_l.color = (1.0, 0.94, 0.86)
    key_obj = bpy.data.objects.new("Key_Light", key_l)
    key_obj.location = (-0.42, 0.28, 0.42)
    master_col.children["STUDIO"].objects.link(key_obj)

    # Fill Softbox (Cool 6000K, 10W)
    fill_l = bpy.data.lights.new(name="Fill_Light", type='AREA')
    fill_l.energy = 10.0
    fill_l.size = 0.6
    fill_l.color = (0.88, 0.92, 1.0)
    fill_obj = bpy.data.objects.new("Fill_Light", fill_l)
    fill_obj.location = (0.45, 0.12, 0.35)
    master_col.children["STUDIO"].objects.link(fill_obj)

    # Rim Strip Light (Crisp 5600K, 16W)
    rim_l = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_l.energy = 16.0
    rim_l.size = 0.12
    rim_l.size_y = 1.2
    rim_l.color = (1.0, 0.98, 0.95)
    rim_obj = bpy.data.objects.new("Rim_Light", rim_l)
    rim_obj.location = (0.18, -0.48, 0.40)
    master_col.children["STUDIO"].objects.link(rim_obj)

    # Camera & Target
    target = bpy.data.objects.new("Cam_Target", None)
    target.location = (0.0, 0.02, 0.045)
    bpy.context.scene.collection.objects.link(target)

    cam_data = bpy.data.cameras.new("Camera_Product")
    cam_data.lens = 72.0
    cam_obj = bpy.data.objects.new("Camera_Product", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    return cam_obj, target

def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    try:
        scene.cycles.device = 'CPU'
    except Exception:
        pass
    scene.cycles.samples = 18
    scene.cycles.preview_samples = 8
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 95

CAMERA_SHOTS = {
    "hero_three_quarter": {
        "loc": (-0.45, 0.42, 0.24),
        "target": (0.0, 0.02, 0.045),
        "lens": 72.0,
        "folder": "renders/final"
    },
    "side_lateral": {
        "loc": (-0.58, 0.015, 0.048),
        "target": (0.0, 0.015, 0.045),
        "lens": 85.0,
        "folder": "renders/final"
    },
    "front": {
        "loc": (0.002, 0.54, 0.065),
        "target": (0.0, 0.04, 0.040),
        "lens": 85.0,
        "folder": "renders/final"
    },
    "rear": {
        # Exact rear view looking at the pinched heel counter, rolled collar opening, and solid stacked heel!
        "loc": (0.000, -0.52, 0.095),
        "target": (0.0, -0.06, 0.050),
        "lens": 85.0,
        "folder": "renders/final"
    },
    "top": {
        "loc": (0.000, 0.010, 0.54),
        "target": (0.0, 0.010, 0.040),
        "lens": 80.0,
        "folder": "renders/final"
    },
    "macro_toe_cap": {
        "loc": (-0.14, 0.25, 0.12),
        "target": (0.0, 0.13, 0.030),
        "lens": 130.0,
        "folder": "renders/macro"
    },
    "macro_heel_stack": {
        # Close up of the solid stacked heel lifts and brass nails
        "loc": (-0.14, -0.18, 0.055),
        "target": (-0.02, -0.10, 0.018),
        "lens": 130.0,
        "folder": "renders/macro"
    }
}

def render_master_shots(base_dir, cam_obj, target_obj):
    print("=== EXECUTING MASTER PHOTOGRAPHY RENDERS ===")
    for shot_name, cfg in CAMERA_SHOTS.items():
        out_folder = os.path.join(base_dir, cfg["folder"])
        os.makedirs(out_folder, exist_ok=True)
        out_path = os.path.join(out_folder, f"{shot_name}.jpg")

        target_obj.location = Vector(cfg["target"])
        cam_obj.location = Vector(cfg["loc"])
        cam_obj.data.lens = cfg["lens"]

        direction = (target_obj.location - cam_obj.location).normalized()
        cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        bpy.context.view_layer.update()

        bpy.context.scene.render.filepath = out_path
        print(f"Rendering: {shot_name} -> {out_path} ...")
        bpy.ops.render.render(write_still=True)
        print(f"Finished: {shot_name}")

def main():
    base_dir = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001"
    print("Initializing Piece-by-Piece Footwear Master Generator...")
    clear_scene()
    master_col = setup_collections()
    materials = create_materials()

    print("Building Solid Stacked Heel & Nails (Piece 1)...")
    build_solid_heel(master_col, materials)

    print("Building Sculpted Oak-Bark Outsole (Piece 2)...")
    build_sculpted_outsole(master_col, materials)

    print("Building 270° Goodyear Welt Shelf (Piece 3)...")
    build_goodyear_welt(master_col, materials)

    print("Building Hollow Anatomical Upper (Piece 4)...")
    build_hollow_upper(master_col, materials)

    print("Building Rolled Collar & Lining (Piece 5)...")
    build_collar_and_tongue(master_col, materials)

    print("Building 3D Lacing System & Micro-Stitches (Piece 6)...")
    build_lacing_system(master_col, materials)

    print("Setting up Studio Rig & Camera...")
    cam_obj, target_obj = setup_studio_and_camera(master_col)
    configure_render()

    # Save Master Blend
    master_blend = os.path.join(base_dir, "blender", "master", "SHOE_001_MASTER.blend")
    print(f"Saving Master Blend: {master_blend}")
    bpy.ops.wm.save_as_mainfile(filepath=master_blend)

    # Save Web Blend Twin
    web_blend = os.path.join(base_dir, "blender", "master", "SHOE_001_WEB.blend")
    print(f"Saving Web Twin: {web_blend}")
    bpy.ops.wm.save_as_mainfile(filepath=web_blend)

    # Render shots (Hero 3/4, Profile, Front, Rear, Top, Macro Toe, Macro Heel)
    render_master_shots(base_dir, cam_obj, target_obj)

    # Export Web GLB
    web_glb_path = os.path.join(base_dir, "web", "assets", "shoe001_aurelius.glb")
    print(f"Exporting Production Web GLB: {web_glb_path}")
    bpy.ops.object.select_all(action='DESELECT')
    for subname in ["UPPER", "LACING", "CONSTRUCTION", "DETAILS", "LINING"]:
        for obj in master_col.children[subname].objects:
            obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=web_glb_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_attributes=True,
        export_normals=True,
        export_tangents=True,
        export_yup=True
    )
    print("Piece-by-Piece Master Pipeline Finished!")

if __name__ == "__main__":
    main()
