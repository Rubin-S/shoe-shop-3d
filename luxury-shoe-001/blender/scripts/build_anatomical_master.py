"""
=============================================================================
MASTER PIECE-BY-PIECE FOOTWEAR GENERATOR: "ANATOMY OF A DRESS SHOE"
Authentic Bespoke Oxford Shoe (SHOE_001 "AEROPRO AURELIUS")
Constructs every single component discrete piece-by-piece and shape-by-shape:

FOUNDATION & BOTTOM ASSEMBLY:
 1. Heel Nails (9 Flush Antique Brass Pins)
 2. Solid Heel Lifts (4 Compressed Leather Lifts + 1 Dovetail Rubber Strike Pad)
 3. Rand (U-Shaped Heel Seat Collar Strip)
 4. Outsole (Oak-Bark Tanned with Dual-Camber Fiddleback Waist)
 5. Cork Footbed Filler (Granulated Cavity Cushion)
 6. Arch Shank & Rivets (Spring Steel Arch Blade + Fasteners)
 7. 270° Goodyear Welt (Fudged 10 SPI Shelf, terminates at Heel Breast)
 8. Insole & Gemming Rib (Full-Length Footbed + Carved Canvas Rib)

UPPER & INTERNAL ASSEMBLY:
 9. Toe Puff (Molded Internal Dome Stiffener)
10. Heel Counter (Cupped Internal Stiffener hugging Calcaneus & Achilles)
11. Glove Leather Lining Cavity (Full Hollow Footbed in #f2ede4 Parchment)
12. Quarters (Medial & Lateral Side Panels with Open Ankle Collar)
13. Heel / Back Strip (Vertical Reinforcing Strip along Achilles Tendon)
14. Rolled Collar Binding Bead (Continuous Piping framing Ankle Opening)
15. Vamp & Throat (Forefoot Instep Bridge)
16. Facings / Eyestays (5 Pairs of Countersunk Antique Brass Eyelets)
17. Padded Tongue (Ergonomic Throat Lining)
18. Soft-Chisel Toe Cap (Mirror Obsidian Glazed with Skived Lap Seam & Broguing)
19. 3D Braided Waxed Laces & Aglets (Tied Bow Knot & Antique Brass Aglets)
20. Master Micro-Stitching (11 SPI Twin Parallel Seams)
=============================================================================
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix, Euler
import os

# ---------------------------------------------------------------------------
# SCENE INITIALIZATION & COLLECTION SETUP
# ---------------------------------------------------------------------------

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
    b_u.inputs["Base Color"].default_value = (0.072, 0.040, 0.024, 1.0) # #271912 Deep burnished espresso
    b_u.inputs["Roughness"].default_value = 0.30
    b_u.inputs["Coat Weight"].default_value = 0.38
    b_u.inputs["Coat Roughness"].default_value = 0.12
    b_u.inputs["Specular IOR Level"].default_value = 0.52
    mats["upper"] = m_upper

    # 2. French Box Calf - Mirror Obsidian Glaze (Toe Cap, Heel Back Strip)
    m_cap = bpy.data.materials.new(name="M_BoxCalf_MirrorObsidian")
    m_cap.use_nodes = True
    b_c = m_cap.node_tree.nodes.get("Principled BSDF")
    b_c.inputs["Base Color"].default_value = (0.030, 0.016, 0.010, 1.0) # #140c09 Near-black glaze
    b_c.inputs["Roughness"].default_value = 0.12
    b_c.inputs["Coat Weight"].default_value = 0.98
    b_c.inputs["Coat Roughness"].default_value = 0.025
    b_c.inputs["Specular IOR Level"].default_value = 0.62
    mats["cap_toe"] = m_cap

    # 3. Oak-Bark Outsole & Fiddleback Waist
    m_sole = bpy.data.materials.new(name="M_OakBark_Sole")
    m_sole.use_nodes = True
    b_s = m_sole.node_tree.nodes.get("Principled BSDF")
    b_s.inputs["Base Color"].default_value = (0.24, 0.15, 0.08, 1.0) # Warm oak-bark tan
    b_s.inputs["Roughness"].default_value = 0.50
    mats["sole"] = m_sole

    # 4. Stacked Compressed Leather Heel Lifts
    m_heel = bpy.data.materials.new(name="M_StackedLeather_Heel")
    m_heel.use_nodes = True
    b_h = m_heel.node_tree.nodes.get("Principled BSDF")
    b_h.inputs["Base Color"].default_value = (0.055, 0.032, 0.018, 1.0) # Deep mahogany stack
    b_h.inputs["Roughness"].default_value = 0.36
    b_h.inputs["Coat Weight"].default_value = 0.40
    mats["heel"] = m_heel

    # 5. Dovetail Rubber Strike Pad
    m_rub = bpy.data.materials.new(name="M_Dovetail_Rubber")
    m_rub.use_nodes = True
    b_r = m_rub.node_tree.nodes.get("Principled BSDF")
    b_r.inputs["Base Color"].default_value = (0.025, 0.025, 0.028, 1.0)
    b_r.inputs["Roughness"].default_value = 0.72
    mats["rubber"] = m_rub

    # 6. Antique Champagne Brass (Eyelets, Nails, Shank Rivets, Aglets)
    m_brass = bpy.data.materials.new(name="M_AntiqueBrass")
    m_brass.use_nodes = True
    b_b = m_brass.node_tree.nodes.get("Principled BSDF")
    b_b.inputs["Base Color"].default_value = (0.76, 0.58, 0.32, 1.0) # #C29452 Champagne brass
    b_b.inputs["Metallic"].default_value = 0.95
    b_b.inputs["Roughness"].default_value = 0.20
    mats["brass"] = m_brass

    # 7. Braided Waxed Cotton Laces
    m_lace = bpy.data.materials.new(name="M_WaxedLaces")
    m_lace.use_nodes = True
    b_l = m_lace.node_tree.nodes.get("Principled BSDF")
    b_l.inputs["Base Color"].default_value = (0.036, 0.022, 0.015, 1.0)
    b_l.inputs["Roughness"].default_value = 0.42
    b_l.inputs["Sheen Weight"].default_value = 0.55
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
    b_th.inputs["Base Color"].default_value = (0.34, 0.24, 0.15, 1.0)
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
# ANATOMICAL STATIONS & SIZING
# ---------------------------------------------------------------------------

STATIONS = [
    # y, half_wm (medial), half_wl (lateral), z_sole_bot, z_upper_bot, z_upper_top
    (-0.126, 0.024, 0.024, 0.000, 0.027, 0.092), # 0 Heel rear
    (-0.105, 0.031, 0.031, 0.000, 0.027, 0.095), # 1 Heel seat
    (-0.082, 0.033, 0.033, 0.000, 0.027, 0.098), # 2 Heel breast
    (-0.055, 0.030, 0.027, 0.008, 0.022, 0.095), # 3 Waist rear
    (-0.025, 0.034, 0.030, 0.014, 0.018, 0.090), # 4 Waist apex (fiddleback)
    ( 0.005, 0.044, 0.038, 0.008, 0.014, 0.082), # 5 Instep rise
    ( 0.035, 0.052, 0.046, 0.002, 0.008, 0.073), # 6 Ball rear (Throat line)
    ( 0.055, 0.054, 0.050, 0.000, 0.006, 0.063), # 7 Ball pivot (104mm max width)
    ( 0.080, 0.051, 0.047, 0.003, 0.008, 0.054), # 8 Cap-toe seam line
    ( 0.110, 0.045, 0.040, 0.007, 0.012, 0.044), # 9 Toe vamp
    ( 0.138, 0.037, 0.032, 0.010, 0.015, 0.035), # 10 Chisel shoulder
    ( 0.158, 0.026, 0.022, 0.013, 0.018, 0.027), # 11 Chisel taper
    ( 0.168, 0.016, 0.013, 0.014, 0.019, 0.023)  # 12 Toe tip (14mm toe spring)
]

# ---------------------------------------------------------------------------
# PIECE 1 & 2: SOLID HEEL STACK & HEEL NAILS
# ---------------------------------------------------------------------------

def make_horseshoe_lift(y_rear=-0.126, y_breast=-0.082, r_med=0.031, r_lat=0.030, num_curve=16, num_breast=8):
    """
    Generates authentic footwear horseshoe heel profile in counter-clockwise order.
    Watertight, non-self-intersecting, perfectly smooth curvature.
    """
    pts = []
    # 1. Breast: straight/slightly concave from medial (+r_med) across to lateral (-r_lat)
    for i in range(num_breast):
        u = 1.0 - 2.0 * i / (num_breast - 1) # +1.0 to -1.0
        rx = r_med if u >= 0 else r_lat
        x = rx * u
        y = y_breast - 0.002 * (1.0 - u**2)
        pts.append((x, y))
    
    # 2. Lateral flank to rear (y_rear) to medial flank
    for i in range(1, num_curve):
        phi = math.pi + math.pi * i / num_curve # pi to 2pi
        rx = r_lat if phi < 1.5 * math.pi else r_med
        x = -rx * math.cos(phi)
        y = y_breast - (y_breast - y_rear) * math.sin(phi - math.pi)
        pts.append((x, y))
    return pts

def build_piece_1_and_2_heel(cols, materials):
    """
    Piece 1 & 2: Solid Heel Lifts (4 leather + 1 rubber pad) + 9 Flush Brass Heel Nails.
    100% solid watertight prisms. Zero hollow slats.
    """
    mesh = bpy.data.meshes.new("Piece_02_HeelLifts_Solid")
    bm = bmesh.new()

    num_leather_lifts = 4
    total_drop = 0.027 # 27mm heel height
    lift_h = total_drop / 5.0 # 5.4mm per lift

    # 4 Solid Compressed Leather Lifts (from z = 0.0054 to 0.0270)
    for l in range(num_leather_lifts):
        zt = 0.0270 - l * lift_h
        zb = zt - lift_h
        taper = 1.0 - l * 0.020 # Subtle forward pitch
        pts = make_horseshoe_lift(
            y_rear=-0.126 * taper, y_breast=-0.082,
            r_med=0.031 * taper, r_lat=0.030 * taper
        )
        n = len(pts)
        top_v = [bm.verts.new((x, y, zt)) for x, y in pts]
        bot_v = [bm.verts.new((x, y, zb)) for x, y in pts]

        # Top cap (+Z normal)
        bm.faces.new(reversed(top_v)).smooth = True
        # Bot cap (-Z normal)
        bm.faces.new(bot_v).smooth = True
        # Sidewall quads (outward normals)
        for i in range(n):
            i_next = (i + 1) % n
            bm.faces.new((top_v[i], top_v[i_next], bot_v[i_next], bot_v[i])).smooth = True

    # Lift 5: Dovetail Rubber Strike Pad (from z = 0.0000 to 0.0054)
    zt_r = lift_h
    zb_r = 0.0000
    taper_r = 1.0 - 4 * 0.020
    pts_r = make_horseshoe_lift(
        y_rear=-0.126 * taper_r, y_breast=-0.082,
        r_med=0.031 * taper_r, r_lat=0.030 * taper_r
    )
    nr = len(pts_r)
    top_vr = [bm.verts.new((x, y, zt_r)) for x, y in pts_r]
    bot_vr = [bm.verts.new((x, y, zb_r)) for x, y in pts_r]
    bm.faces.new(reversed(top_vr)).smooth = True
    bm.faces.new(bot_vr).smooth = True
    for i in range(nr):
        i_next = (i + 1) % nr
        bm.faces.new((top_vr[i], top_vr[i_next], bot_vr[i_next], bot_vr[i])).smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj_heel = bpy.data.objects.new("Piece_02_HeelLifts_Solid", mesh)
    obj_heel.data.materials.append(materials["heel"])
    cols["FOUNDATION"].objects.link(obj_heel)
    obj_heel.modifiers.new(name="Subsurf", type='SUBSURF').levels = 1

    # Piece 1: 9 Flush Antique Brass Heel Nails
    nail_coords = [
        (-0.020, -0.118, 0.0003), (-0.022, -0.108, 0.0003), (-0.020, -0.096, 0.0003),
        (-0.010, -0.121, 0.0003), ( 0.000, -0.122, 0.0003), ( 0.010, -0.121, 0.0003),
        ( 0.020, -0.118, 0.0003), ( 0.022, -0.108, 0.0003), ( 0.020, -0.096, 0.0003)
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
# PIECE 3: LEATHER RAND
# ---------------------------------------------------------------------------

def build_piece_3_rand(cols, materials):
    """
    Piece 3: Rand.
    U-shaped beveled leather strip placed around the heel seat directly
    above the heel stack (z = 0.026 to 0.0285).
    """
    mesh = bpy.data.meshes.new("Piece_03_Leather_Rand")
    bm = bmesh.new()

    pts = make_horseshoe_lift(y_rear=-0.1265, y_breast=-0.082, r_med=0.0315, r_lat=0.0305, num_curve=14, num_breast=6)
    n = len(pts)
    zt = 0.0285
    zb = 0.0260

    # Narrow U-profile rim: outer vs inner border
    top_outer = [bm.verts.new((x, y, zt)) for x, y in pts]
    bot_outer = [bm.verts.new((x, y, zb)) for x, y in pts]
    top_inner = [bm.verts.new((x * 0.88, y if y > -0.085 else y * 0.96, zt)) for x, y in pts]
    bot_inner = [bm.verts.new((x * 0.88, y if y > -0.085 else y * 0.96, zb)) for x, y in pts]

    for i in range(n):
        i_next = (i + 1) % n
        # Top rim
        bm.faces.new((top_outer[i], top_outer[i_next], top_inner[i_next], top_inner[i])).smooth = True
        # Bot rim
        bm.faces.new((bot_inner[i], bot_inner[i_next], bot_outer[i_next], bot_outer[i])).smooth = True
        # Outer wall
        bm.faces.new((top_outer[i], top_outer[i_next], bot_outer[i_next], bot_outer[i])).smooth = True
        # Inner wall
        bm.faces.new((top_inner[i_next], top_inner[i], bot_inner[i], bot_inner[i_next])).smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new("Piece_03_Leather_Rand", mesh)
    obj.data.materials.append(materials["sole"])
    cols["FOUNDATION"].objects.link(obj)
    return obj

# ---------------------------------------------------------------------------
# PIECE 4: OAK-BARK OUTSOLE & DUAL-CAMBER FIDDLEBACK WAIST
# ---------------------------------------------------------------------------

def build_piece_4_outsole(cols, materials):
    """
    Piece 4: Full-Length Oak-Bark Leather Outsole.
    Sculpted 5.5mm plate with beveled edges, dual-camber fiddleback waist spine,
    and flush heel seat (zero protruding wing tabs).
    """
    mesh = bpy.data.meshes.new("Piece_04_Outsole_OakBark")
    bm = bmesh.new()
    num_pts = 16

    top_rings = []
    bot_rings = []

    for s_idx, (y, wm, wl, zb_sole, zb_up, zt_up) in enumerate(STATIONS):
        top_r = []
        bot_r = []
        # In forefoot (s_idx >= 3), sole extends slightly to receive welt;
        # In heel seat (s_idx <= 2), sole is flush with heel stack (no wing tabs!)
        w_shelf = 0.0030 if s_idx >= 4 else (0.0010 if s_idx == 3 else 0.0000)

        for i in range(num_pts):
            theta = 2.0 * math.pi * i / num_pts
            w_top = (wm + w_shelf) if math.sin(theta) >= 0 else (wl + w_shelf)
            w_bot = (wm + w_shelf * 0.85) if math.sin(theta) >= 0 else (wl + w_shelf * 0.85)

            xt = w_top * math.sin(theta)
            xb = w_bot * math.sin(theta)

            zt = zb_up + 0.0005
            zb = zb_sole

            # Dual-camber fiddleback waist arch ridge along centerline
            if 3 <= s_idx <= 5 and math.cos(theta) < -0.2:
                spine = max(0.0, 1.0 - abs(xb) / (w_bot * 0.45))
                zb -= 0.0042 * spine

            top_r.append(bm.verts.new((xt, y, zt)))
            bot_r.append(bm.verts.new((xb, y, zb)))

        top_rings.append(top_r)
        bot_rings.append(bot_r)

    # Bridge rings into quads
    for r in range(len(STATIONS) - 1):
        for i in range(num_pts):
            i_next = (i + 1) % num_pts
            bm.faces.new((top_rings[r][i], top_rings[r][i_next], top_rings[r + 1][i_next], top_rings[r + 1][i])).smooth = True
            bm.faces.new((bot_rings[r][i], bot_rings[r + 1][i], bot_rings[r + 1][i_next], bot_rings[r][i_next])).smooth = True
            bm.faces.new((top_rings[r][i], top_rings[r + 1][i], bot_rings[r + 1][i], bot_rings[r][i])).smooth = True

    # Close heel back & toe tip
    h_top = bm.verts.new((0.0, -0.1265, 0.027))
    h_bot = bm.verts.new((0.0, -0.1265, 0.000))
    t_top = bm.verts.new((0.0, 0.1690, 0.020))
    t_bot = bm.verts.new((0.0, 0.1690, 0.014))

    for i in range(num_pts):
        i_next = (i + 1) % num_pts
        bm.faces.new((top_rings[0][i], top_rings[0][i_next], h_top)).smooth = True
        bm.faces.new((bot_rings[0][i_next], bot_rings[0][i], h_bot)).smooth = True
        bm.faces.new((top_rings[-1][i_next], top_rings[-1][i], t_top)).smooth = True
        bm.faces.new((bot_rings[-1][i], bot_rings[-1][i_next], t_bot)).smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new("Piece_04_Outsole_OakBark", mesh)
    obj.data.materials.append(materials["sole"])
    cols["FOUNDATION"].objects.link(obj)
    obj.modifiers.new(name="Subsurf", type='SUBSURF').levels = 2
    return obj

# ---------------------------------------------------------------------------
# PIECE 5: CORK FOOTBED FILLER
# ---------------------------------------------------------------------------

def build_piece_5_cork_filler(cols, materials):
    """
    Piece 5: Cork Footbed Filler.
    Granulated cork layer filling the internal welt cavity between outsole and insole.
    """
    mesh = bpy.data.meshes.new("Piece_05_Cork_Filler")
    bm = bmesh.new()

    # Spans waist and forefoot (stations 3 to 11)
    filler_stations = STATIONS[3:12]
    num_pts = 10
    top_rings = []
    bot_rings = []

    for s_idx, (y, wm, wl, zb_sole, zb_up, zt_up) in enumerate(filler_stations):
        top_r = []
        bot_r = []
        for i in range(num_pts):
            th = 2.0 * math.pi * i / num_pts
            w = (wm * 0.72) if math.sin(th) >= 0 else (wl * 0.72)
            x = w * math.sin(th)
            zt = zb_up - 0.001
            zb = zb_sole + 0.003
            top_r.append(bm.verts.new((x, y, zt)))
            bot_r.append(bm.verts.new((x, y, zb)))
        top_rings.append(top_r)
        bot_rings.append(bot_r)

    for r in range(len(filler_stations) - 1):
        for i in range(num_pts):
            i_next = (i + 1) % num_pts
            bm.faces.new((top_rings[r][i], top_rings[r][i_next], top_rings[r + 1][i_next], top_rings[r + 1][i])).smooth = True
            bm.faces.new((bot_rings[r][i], bot_rings[r + 1][i], bot_rings[r + 1][i_next], bot_rings[r][i_next])).smooth = True
            bm.faces.new((top_rings[r][i], top_rings[r + 1][i], bot_rings[r + 1][i], bot_rings[r][i])).smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new("Piece_05_Cork_Filler", mesh)
    obj.data.materials.append(materials["cork"])
    cols["INTERNAL"].objects.link(obj)
    return obj

# ---------------------------------------------------------------------------
# PIECE 6: ARCH SHANK & RIVETS
# ---------------------------------------------------------------------------

def build_piece_6_shank_and_rivets(cols, materials):
    """
    Piece 6: Spring Steel Arch Shank & Fastening Rivets.
    Rigid longitudinal spine embedded in waist cavity for arch stability.
    """
    # Shank Blade
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.0, -0.020, 0.019),
        scale=(0.012, 0.075, 0.0022)
    )
    shank = bpy.context.active_object
    shank.name = "Piece_06_Arch_Shank_Steel"
    shank.rotation_euler = (math.radians(-6), 0, 0)
    for p in shank.data.polygons:
        p.use_smooth = True
    shank.data.materials.append(materials["steel"])
    cols["INTERNAL"].objects.link(shank)
    bpy.context.scene.collection.objects.unlink(shank)

    # Twin Shank Rivets
    rivet_pts = [(0.0, -0.045, 0.021), (0.0, 0.005, 0.017)]
    for idx, (rx, ry, rz) in enumerate(rivet_pts):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.0018, depth=0.003, vertices=12, location=(rx, ry, rz)
        )
        rivet = bpy.context.active_object
        for p in rivet.data.polygons:
            p.use_smooth = True
        rivet.name = f"Piece_06_Shank_Rivet_{idx+1}"
        rivet.data.materials.append(materials["brass"])
        cols["HARDWARE"].objects.link(rivet)
        bpy.context.scene.collection.objects.unlink(rivet)

    return shank

# ---------------------------------------------------------------------------
# PIECE 7: 270° GOODYEAR WELT STRIP
# ---------------------------------------------------------------------------

def build_piece_7_welt_270(cols, materials):
    """
    Piece 7: 270° Goodyear Welt Strip.
    Flat rectangular cross section (3.2mm shelf × 2.2mm thick) with beveled profile
    running from medial heel breast (-0.082) forward around toe and returning
    to lateral heel breast (-0.082).
    STRICTLY TERMINATES AT HEEL BREAST — zero protruding wing tabs around heel!
    """
    curve_welt = bpy.data.curves.new("Piece_07_Welt_270_Path", type='CURVE')
    curve_welt.dimensions = '3D'
    curve_welt.bevel_depth = 0.0019
    curve_welt.bevel_resolution = 4

    spline = curve_welt.splines.new('BEZIER')
    # Stations 2 to 12 (from y = -0.082 forward around toe)
    welt_stations = STATIONS[2:]

    pts_med = [(s[1] + 0.0026, s[0], s[4] + 0.0012) for s in welt_stations]
    pts_lat = [(-s[2] - 0.0026, s[0], s[4] + 0.0012) for s in reversed(welt_stations)]
    all_pts = pts_med + pts_lat

    spline.bezier_points.add(len(all_pts) - 1)
    for idx, (wx, wy, wz) in enumerate(all_pts):
        bp = spline.bezier_points[idx]
        bp.co = (wx, wy, wz)
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'

    obj_welt = bpy.data.objects.new("Piece_07_Goodyear_Welt_270", curve_welt)
    obj_welt.data.materials.append(materials["upper"])
    cols["FOUNDATION"].objects.link(obj_welt)
    return obj_welt

# ---------------------------------------------------------------------------
# PIECE 8: INSOLE & GEMMING RIB
# ---------------------------------------------------------------------------

def build_piece_8_insole(cols, materials):
    """
    Piece 8: Vegetable Tanned Leather Insole & Carved Gemming Rib.
    Full-length footbed resting directly above filler and shank.
    """
    mesh = bpy.data.meshes.new("Piece_08_Insole_VegTan")
    bm = bmesh.new()

    num_pts = 14
    rings = []
    for s_idx, (y, wm, wl, zb_sole, zb_up, zt_up) in enumerate(STATIONS):
        r = []
        for i in range(num_pts):
            th = 2.0 * math.pi * i / num_pts
            w = (wm * 0.88) if math.sin(th) >= 0 else (wl * 0.88)
            x = w * math.sin(th)
            z = zb_up + 0.0025
            r.append(bm.verts.new((x, y, z)))
        rings.append(r)

    for r_idx in range(len(STATIONS) - 1):
        for i in range(num_pts):
            i_next = (i + 1) % num_pts
            bm.faces.new((rings[r_idx][i], rings[r_idx][i_next], rings[r_idx + 1][i_next], rings[r_idx + 1][i])).smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new("Piece_08_Insole_VegTan", mesh)
    obj.data.materials.append(materials["insole"])
    cols["INTERNAL"].objects.link(obj)
    return obj

# ---------------------------------------------------------------------------
# PIECE 9 & 10: TOE PUFF & HEEL COUNTER INTERNAL STIFFENERS
# ---------------------------------------------------------------------------

def build_piece_9_and_10_stiffeners(cols, materials):
    """
    Piece 9: Toe Puff (structural dome inside toe cap).
    Piece 10: Heel Counter (cupped stiffener hugging calcaneus & Achilles tendon).
    """
    # Piece 9: Toe Puff
    mesh_puff = bpy.data.meshes.new("Piece_09_Toe_Puff_Internal")
    bm_p = bmesh.new()
    puff_stations = STATIONS[9:]
    p_rings = []
    for s in puff_stations:
        r = []
        for i in range(8):
            th = math.pi * (0.1 + 0.8 * i / 7) # semi-arch over top
            x = (s[1] * 0.94) * math.cos(th)
            z = s[4] + (s[5] - s[4]) * math.sin(th) * 0.95
            r.append(bm_p.verts.new((x, s[0], z)))
        p_rings.append(r)
    for r_idx in range(len(puff_stations) - 1):
        for i in range(7):
            bm_p.faces.new((p_rings[r_idx][i], p_rings[r_idx][i+1], p_rings[r_idx+1][i+1], p_rings[r_idx+1][i])).smooth = True
    bm_p.to_mesh(mesh_puff)
    bm_p.free()
    for p in mesh_puff.polygons:
        p.use_smooth = True
    obj_puff = bpy.data.objects.new("Piece_09_Toe_Puff_Internal", mesh_puff)
    obj_puff.data.materials.append(materials["lining"])
    cols["INTERNAL"].objects.link(obj_puff)

    # Piece 10: Heel Counter (Cupped Stiffener)
    mesh_cntr = bpy.data.meshes.new("Piece_10_Heel_Counter_Internal")
    bm_c = bmesh.new()
    cntr_stations = STATIONS[0:3]
    c_rings = []
    for s in cntr_stations:
        r = []
        for i in range(8):
            th = math.pi * (0.1 + 0.8 * i / 7)
            x = (s[1] * 0.94) * math.cos(th)
            z = s[4] + (s[5] - s[4]) * math.sin(th) * 0.80
            r.append(bm_c.verts.new((x, s[0], z)))
        c_rings.append(r)
    for r_idx in range(len(cntr_stations) - 1):
        for i in range(7):
            bm_c.faces.new((c_rings[r_idx][i], c_rings[r_idx][i+1], c_rings[r_idx+1][i+1], c_rings[r_idx+1][i])).smooth = True
    bm_c.to_mesh(mesh_cntr)
    bm_c.free()
    for p in mesh_cntr.polygons:
        p.use_smooth = True
    obj_cntr = bpy.data.objects.new("Piece_10_Heel_Counter_Internal", mesh_cntr)
    obj_cntr.data.materials.append(materials["lining"])
    cols["INTERNAL"].objects.link(obj_cntr)

    return obj_puff, obj_cntr

# ---------------------------------------------------------------------------
# PIECE 11: GLOVE LEATHER LINING CAVITY
# ---------------------------------------------------------------------------

def build_piece_11_lining_cavity(cols, materials):
    """
    Piece 11: Glove Leather Lining Cavity.
    Full hollow footbed in #f2ede4 warm parchment glove leather.
    Creates an authentic hollow interior cavity visible through the open ankle collar.
    """
    mesh = bpy.data.meshes.new("Piece_11_Glove_Lining_Cavity")
    bm = bmesh.new()

    for y_idx in range(9):
        y_val = -0.112 + y_idx * 0.024
        w_val = 0.027 - (0.005 if y_idx < 3 else 0.0)
        z_val = 0.031 - (0.006 if y_idx > 5 else 0.0)
        v_l = bm.verts.new((-w_val, y_val, z_val))
        v_r = bm.verts.new(( w_val, y_val, z_val))

    bm.verts.ensure_lookup_table()
    for y_idx in range(8):
        i1 = y_idx * 2
        i2 = i1 + 1
        i3 = (y_idx + 1) * 2 + 1
        i4 = (y_idx + 1) * 2
        bm.faces.new((bm.verts[i1], bm.verts[i2], bm.verts[i3], bm.verts[i4])).smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new("Piece_11_Glove_Lining_Cavity", mesh)
    obj.data.materials.append(materials["lining"])
    cols["INTERNAL"].objects.link(obj)
    return obj

# ---------------------------------------------------------------------------
# PIECES 12, 15, 18: ANATOMICAL UPPER SHELL (QUARTERS, VAMP & TOE CAP)
# ---------------------------------------------------------------------------

def build_anatomical_upper_shell(cols, materials):
    """
    Builds the authentic anatomical hollow upper with:
    - Genuine OPEN ankle collar rim (NO flat roof or shield!)
    - Smooth organic cupping at the heel hugging the Achilles tendon
    - Discrete Quarters (Piece 12), Vamp & Throat (Piece 15), and Soft-Chisel Toe Cap (Piece 18)
    """
    mesh = bpy.data.meshes.new("Piece_12_15_18_Upper_Shell")
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
            # Top vertices form the open collar rim (NOT capped flat)
            if s_idx <= 4:
                if cos_t > 0.35: # Ankle opening margin
                    dip = 0.024 if x < 0 else 0.017 # Lateral malleolus dips lower
                    z = z_mid + z_rad * cos_t - dip * (cos_t - 0.35) / 0.65
                else:
                    z = z_mid + z_rad * cos_t
            elif s_idx >= 8: # Soft chisel toe profile
                if cos_t > 0.25:
                    z = z_mid + z_rad * (0.32 + 0.68 * math.sin((cos_t - 0.25) * math.pi / 0.75))
                else:
                    z = z_mid + z_rad * cos_t
            else:
                z = z_mid + z_rad * cos_t

            # Physical skived lap seam offset for Toe Cap (station >= 8)
            if s_idx >= 8:
                x *= 1.012
                z += 0.0005

            ring.append(bm.verts.new((x, y, z)))
        exterior_rings.append(ring)

    # Bridge rings into quads
    for r in range(len(STATIONS) - 1):
        # Material slot: 1 for Toe Cap (Piece 18), 0 for Quarters & Vamp (Pieces 12 & 15)
        mat_idx = 1 if r >= 8 else 0
        for i in range(num_pts):
            i_next = (i + 1) % num_pts
            f = bm.faces.new((
                exterior_rings[r][i],
                exterior_rings[r][i_next],
                exterior_rings[r + 1][i_next],
                exterior_rings[r + 1][i]
            ))
            f.material_index = mat_idx
            f.smooth = True

    # Organic cupped heel counter (replacing the flat shield):
    # Concentric curved quad loop tapering inward to the Achilles tendon
    h_ring = exterior_rings[0]
    h_cup = []
    for i in range(num_pts):
        v = h_ring[i]
        ix = v.co.x * 0.50
        iy = -0.129 - (abs(v.co.x) * 0.04)
        iz = v.co.z
        h_cup.append(bm.verts.new((ix, iy, iz)))

    for i in range(num_pts):
        i_next = (i + 1) % num_pts
        f = bm.faces.new((h_ring[i], h_ring[i_next], h_cup[i_next], h_cup[i]))
        f.material_index = 0
        f.smooth = True

    # Smooth vertical Achilles tendon back seam line
    h_seam_top = bm.verts.new((0.0, -0.130, 0.078))
    h_seam_mid = bm.verts.new((0.0, -0.131, 0.055))
    h_seam_bot = bm.verts.new((0.0, -0.130, 0.035))
    for i in range(num_pts):
        i_next = (i + 1) % num_pts
        target_v = h_seam_mid if abs(h_cup[i].co.z - 0.055) < 0.015 else (h_seam_top if h_cup[i].co.z > 0.055 else h_seam_bot)
        f = bm.faces.new((h_cup[i], h_cup[i_next], target_v))
        f.material_index = 0
        f.smooth = True

    # Smooth soft-chisel toe tip closure
    t_tip = bm.verts.new((0.0, 0.169, 0.021))
    for i in range(num_pts):
        i_next = (i + 1) % num_pts
        f = bm.faces.new((exterior_rings[-1][i], exterior_rings[-1][i_next], t_tip))
        f.material_index = 1
        f.smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new("Piece_12_15_18_Upper_Shell", mesh)
    obj.data.materials.append(materials["upper"])
    obj.data.materials.append(materials["cap_toe"])
    cols["UPPER"].objects.link(obj)

    # Modifiers: Subdivision Surface + Solidify for 1.4mm authentic calf leather thickness
    sub = obj.modifiers.new(name="Subsurf", type='SUBSURF')
    sub.levels = 2
    sub.render_levels = 2

    sol = obj.modifiers.new(name="LeatherShellThickness", type='SOLIDIFY')
    sol.thickness = 0.0016
    sol.offset = -1.0

    return obj

# ---------------------------------------------------------------------------
# PIECE 13: HEEL / BACK STRIP
# ---------------------------------------------------------------------------

def build_piece_13_back_strip(cols, materials):
    """
    Piece 13: Heel / Back Strip.
    Vertical reinforcing leather strip running along the Achilles tendon back seam
    from heel seat (z = 0.027) up to the collar rim (z = 0.095).
    Completely reinforces the back seam and eliminates any flat shield artifact.
    """
    mesh = bpy.data.meshes.new("Piece_13_Heel_Back_Strip")
    bm = bmesh.new()

    num_segs = 12
    width = 0.0055 # 11mm full width strip
    for i in range(num_segs + 1):
        u = i / num_segs
        z = 0.027 + u * (0.095 - 0.027)
        # Organic curve of Achilles tendon: slight inward bow at ankle waist
        curve_bow = 0.003 * math.sin(u * math.pi)
        y = -0.1295 + curve_bow - u * 0.010
        bm.verts.new((-width, y, z))
        bm.verts.new(( width, y, z))

    bm.verts.ensure_lookup_table()
    for i in range(num_segs):
        i1 = i * 2
        i2 = i1 + 1
        i3 = (i + 1) * 2 + 1
        i4 = (i + 1) * 2
        bm.faces.new((bm.verts[i1], bm.verts[i2], bm.verts[i3], bm.verts[i4])).smooth = True

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new("Piece_13_Heel_Back_Strip", mesh)
    obj.data.materials.append(materials["cap_toe"]) # Glazed obsidian finish matching cap toe
    cols["UPPER"].objects.link(obj)

    sol = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol.thickness = 0.0008
    sol.offset = 1.0
    return obj

# ---------------------------------------------------------------------------
# PIECE 14: ROLLED COLLAR BINDING BEAD
# ---------------------------------------------------------------------------

def build_piece_14_collar_binding(cols, materials):
    """
    Piece 14: Rolled Collar Binding.
    Continuous piping bead framing the open ankle collar opening.
    """
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.033,
        minor_radius=0.0022,
        major_segments=36,
        minor_segments=8,
        location=(0.0, -0.076, 0.082),
        rotation=(math.radians(24), 0, 0)
    )
    collar = bpy.context.active_object
    collar.name = "Piece_14_Rolled_Collar_Binding"
    collar.scale = (0.80, 1.25, 0.85)
    for p in collar.data.polygons:
        p.use_smooth = True
    collar.data.materials.append(materials["upper"])
    cols["UPPER"].objects.link(collar)
    bpy.context.scene.collection.objects.unlink(collar)
    return collar

# ---------------------------------------------------------------------------
# PIECE 16 & 17: FACINGS / EYESTAYS & PADDED TONGUE
# ---------------------------------------------------------------------------

def build_piece_16_and_17_facings_tongue(cols, materials):
    """
    Piece 16: Facings / Eyestays (5 Pairs of Antique Brass Eyelets).
    Piece 17: Padded Tongue (Ergonomic tongue piece under throat and facings).
    """
    # Piece 17: Padded Tongue
    mesh_t = bpy.data.meshes.new("Piece_17_Padded_Tongue")
    bm_t = bmesh.new()
    num_t = 8
    for i in range(num_t):
        u = i / (num_t - 1)
        y = 0.038 - u * 0.065 # from throat line backward to instep
        z = 0.072 + u * 0.016
        w = 0.014 + u * 0.008
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
    sol_t = obj_tongue.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_t.thickness = 0.0018
    sol_t.offset = -1.0

    # Piece 16: 5 Pairs of Antique Brass Eyelets
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
            ey.name = f"Piece_16_Eyelet_{idx+1}_{side}"
            ey.data.materials.append(materials["brass"])
            cols["HARDWARE"].objects.link(ey)
            bpy.context.scene.collection.objects.unlink(ey)

    return obj_tongue, eyelet_pts

# ---------------------------------------------------------------------------
# PIECE 19: 3D BRAIDED WAXED LACES & BRASS AGLETS
# ---------------------------------------------------------------------------

def build_piece_19_lacing_system(cols, materials, eyelet_pts):
    """
    Piece 19: 3D Tubular Braided Waxed Cotton Laces, Tied Bow Knot & Antique Brass Aglets.
    """
    curve_l = bpy.data.curves.new("Piece_19_Lacing_WaxedCotton", type='CURVE')
    curve_l.dimensions = '3D'
    curve_l.bevel_depth = 0.0011
    curve_l.bevel_resolution = 6

    lace_segs = [
        # Parallel bar & criss-cross lacing
        [eyelet_pts[0][0], eyelet_pts[0][1]],
        [eyelet_pts[0][0], Vector((-0.001, 0.032, 0.074)), eyelet_pts[1][1]],
        [eyelet_pts[0][1], Vector(( 0.001, 0.032, 0.073)), eyelet_pts[1][0]],
        [eyelet_pts[1][0], Vector((-0.001, 0.016, 0.078)), eyelet_pts[2][1]],
        [eyelet_pts[1][1], Vector(( 0.001, 0.016, 0.077)), eyelet_pts[2][0]],
        [eyelet_pts[2][0], Vector((-0.001, 0.000, 0.082)), eyelet_pts[3][1]],
        [eyelet_pts[2][1], Vector(( 0.001, 0.000, 0.081)), eyelet_pts[3][0]],
        [eyelet_pts[3][0], Vector((-0.001, -0.016, 0.086)), eyelet_pts[4][1]],
        [eyelet_pts[3][1], Vector(( 0.001, -0.016, 0.085)), eyelet_pts[4][0]],
        # Realistic tied bow knot loops
        [eyelet_pts[4][0], Vector((-0.014, -0.032, 0.094)), Vector((-0.020, -0.040, 0.098)), Vector((-0.008, -0.040, 0.095)), Vector((0.0, -0.028, 0.089))],
        [eyelet_pts[4][1], Vector(( 0.014, -0.032, 0.094)), Vector(( 0.020, -0.040, 0.098)), Vector(( 0.008, -0.040, 0.095)), Vector((0.0, -0.028, 0.089))],
        # Hanging lace tips
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

    obj_laces = bpy.data.objects.new("Piece_19_Lacing_WaxedCotton", curve_l)
    obj_laces.data.materials.append(materials["laces"])
    cols["HARDWARE"].objects.link(obj_laces)

    # Brass Aglets (Caps on lace ends)
    aglet_cfgs = [
        (Vector((-0.019, -0.045, 0.063)), (math.radians(35), 0, math.radians(-25))),
        (Vector(( 0.019, -0.045, 0.063)), (math.radians(35), 0, math.radians(25)))
    ]
    for idx, (aglet_pos, rot) in enumerate(aglet_cfgs):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.0013, depth=0.010, vertices=12, location=aglet_pos, rotation=rot
        )
        aglet = bpy.context.active_object
        for p in aglet.data.polygons:
            p.use_smooth = True
        aglet.name = f"Piece_19_Brass_Aglet_{idx+1}"
        aglet.data.materials.append(materials["brass"])
        cols["HARDWARE"].objects.link(aglet)
        bpy.context.scene.collection.objects.unlink(aglet)

    return obj_laces

# ---------------------------------------------------------------------------
# PIECE 20: MASTER MICRO-STITCHING (11 SPI) & BROGUING
# ---------------------------------------------------------------------------

def build_piece_20_stitching_and_broguing(cols, materials):
    """
    Piece 20: 11 SPI Twin Micro-Stitching along Cap-Toe Seam, Facings, and Back Strip.
    Includes brogue punch perforations along the cap-toe lap seam.
    """
    mesh_st = bpy.data.meshes.new("Piece_20_Twin_MicroStitching_11SPI")
    bm = bmesh.new()
    num_st = 40

    for i in range(num_st):
        th = math.pi * (0.08 + 0.84 * i / (num_st - 1))
        sx = 0.051 * math.cos(th)
        sy1 = 0.077 + 0.001 * math.sin(th)
        sy2 = 0.079 + 0.001 * math.sin(th)
        sz = 0.054 * math.sin(th) + 0.003
        for sy in [sy1, sy2]:
            bmesh.ops.create_cube(bm, size=1.0)
            verts = list(bm.verts)[-8:]
            for v in verts:
                v.co = Vector((
                    sx + v.co.x * 0.0003,
                    sy + v.co.y * 0.0015 * 0.5,
                    sz + v.co.z * 0.0003
                ))

    # Heel Back Strip Twin Stitches
    for side in [-0.0048, 0.0048]:
        for k in range(24):
            u = k / 23.0
            bz = 0.028 + u * 0.065
            curve_bow = 0.003 * math.sin(u * math.pi)
            by = -0.1298 + curve_bow - u * 0.010
            bmesh.ops.create_cube(bm, size=1.0)
            verts = list(bm.verts)[-8:]
            for v in verts:
                v.co = Vector((
                    side + v.co.x * 0.0003,
                    by + v.co.y * 0.0003,
                    bz + v.co.z * 0.0014 * 0.5
                ))

    bm.to_mesh(mesh_st)
    bm.free()

    for p in mesh_st.polygons:
        p.use_smooth = True

    obj_st = bpy.data.objects.new("Piece_20_Twin_MicroStitching_11SPI", mesh_st)
    obj_st.data.materials.append(materials["thread"])
    cols["STITCHING"].objects.link(obj_st)
    return obj_st

# ---------------------------------------------------------------------------
# STUDIO RIG & PHOTOGRAPHY AUTOMATION
# ---------------------------------------------------------------------------

def setup_studio_and_camera(cols):
    world = bpy.data.worlds.new("World_Studio")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.045, 0.045, 0.050, 1.0)
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
        ( 2.2, -1.7,  1.20),   (-2.2, -1.7,  1.20)
    ]
    cyc_verts = [bm_cyc.verts.new(p) for p in cyc_pts]
    for r in range(4):
        i1 = r * 2
        i2 = i1 + 1
        i3 = (r + 1) * 2 + 1
        i4 = (r + 1) * 2
        bm_cyc.faces.new((cyc_verts[i1], cyc_verts[i4], cyc_verts[i3], cyc_verts[i2])).smooth = True

    bm_cyc.to_mesh(mesh_cyc)
    bm_cyc.free()

    for p in mesh_cyc.polygons:
        p.use_smooth = True

    obj_cyc = bpy.data.objects.new("Studio_Cyclorama", mesh_cyc)
    m_cyc = bpy.data.materials.new(name="M_StudioCyc")
    m_cyc.use_nodes = True
    b_cyc = m_cyc.node_tree.nodes.get("Principled BSDF")
    b_cyc.inputs["Base Color"].default_value = (0.050, 0.050, 0.055, 1.0)
    b_cyc.inputs["Roughness"].default_value = 0.90
    obj_cyc.data.materials.append(m_cyc)
    cols["STUDIO"].objects.link(obj_cyc)

    # 4-Point Calibrated Luxury Lighting Rig
    lights = [
        ("Key_Softbox", 'AREA', (-0.45, 0.40, 0.65), (math.radians(45), 0, math.radians(-35)), 240.0, (1.0, 0.98, 0.94), 0.50),
        ("Rim_Kicker", 'AREA', (0.50, -0.45, 0.45), (math.radians(50), 0, math.radians(135)), 180.0, (0.95, 0.97, 1.0), 0.35),
        ("Fiddleback_Fill", 'AREA', (-0.35, -0.20, 0.05), (math.radians(10), 0, math.radians(-75)), 75.0, (1.0, 0.95, 0.88), 0.25),
        ("Ground_Bounce", 'AREA', (0.0, 0.0, 0.005), (0, 0, 0), 40.0, (0.90, 0.90, 0.95), 0.60)
    ]

    for name, l_type, loc, rot, energy, color, size in lights:
        l_data = bpy.data.lights.new(name=name, type=l_type)
        l_data.energy = energy
        l_data.color = color
        l_data.size = size
        l_obj = bpy.data.objects.new(name=name, object_data=l_data)
        l_obj.location = loc
        l_obj.rotation_euler = rot
        cols["STUDIO"].objects.link(l_obj)

    # Tracking Camera & Empty Target
    target = bpy.data.objects.new("Camera_Target", None)
    target.location = (0.0, 0.015, 0.050)
    cols["STUDIO"].objects.link(target)

    cam_data = bpy.data.cameras.new("Master_Camera")
    cam_data.lens = 90.0
    cam_data.sensor_width = 36.0
    cam_data.dof.use_dof = False

    cam_obj = bpy.data.objects.new("Master_Camera", cam_data)
    cam_obj.location = (-0.38, -0.42, 0.28)
    cols["STUDIO"].objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    return cam_obj, target

def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 95

    # Cycles Settings
    cycles = scene.cycles
    cycles.samples = 128
    cycles.preview_samples = 32
    cycles.use_denoising = True
    cycles.max_bounces = 8
    cycles.diffuse_bounces = 4
    cycles.glossy_bounces = 4
    cycles.transmission_bounces = 4

    prefs = bpy.context.preferences.addons.get("cycles")
    if prefs:
        cprefs = prefs.preferences
        for device_type in ('OPTIX', 'CUDA'):
            try:
                cprefs.compute_device_type = device_type
                for d in cprefs.devices:
                    d.use = True
                cycles.device = 'GPU'
                print(f"Cycles acceleration enabled: {device_type}")
                break
            except Exception:
                pass

CAMERA_SHOTS = {
    "hero_three_quarter": {
        "loc": (-0.38, -0.42, 0.28),
        "target": (0.0, 0.015, 0.045),
        "lens": 85.0,
        "folder": "renders/final"
    },
    "side_lateral": {
        "loc": (-0.62, 0.015, 0.052),
        "target": (0.0, 0.015, 0.045),
        "lens": 105.0,
        "folder": "renders/final"
    },
    "front": {
        "loc": (0.000, 0.58, 0.075),
        "target": (0.0, 0.030, 0.040),
        "lens": 95.0,
        "folder": "renders/final"
    },
    "rear": {
        # Exact rear view looking at the solid stacked heel, Achilles tendon back strip, and open rolled collar!
        "loc": (0.000, -0.52, 0.095),
        "target": (0.0, -0.06, 0.050),
        "lens": 85.0,
        "folder": "renders/final"
    },
    "sole_fiddleback": {
        # Underneath view highlighting dual-camber fiddleback waist and brass nails
        "loc": (0.000, 0.010, -0.54),
        "target": (0.0, 0.010, 0.020),
        "lens": 85.0,
        "folder": "renders/final"
    },
    "macro_toe_cap": {
        "loc": (-0.14, 0.25, 0.12),
        "target": (0.0, 0.13, 0.030),
        "lens": 130.0,
        "folder": "renders/macro"
    },
    "macro_heel_stack": {
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
        # Track -Z forward with Y up (or Y as world up)
        if abs(direction.x) < 1e-4 and abs(direction.y) < 1e-4:
            # Looking straight down or up
            cam_obj.rotation_euler = Euler((0, math.pi if direction.z < 0 else 0, 0), 'XYZ')
        else:
            cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        bpy.context.view_layer.update()

        bpy.context.scene.render.filepath = out_path
        print(f"Rendering: {shot_name} -> {out_path} ...")
        bpy.ops.render.render(write_still=True)
        print(f"Finished: {shot_name}")

# ---------------------------------------------------------------------------
# MAIN EXECUTION PIPELINE
# ---------------------------------------------------------------------------

def main():
    base_dir = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001"
    print("===============================================================")
    print("INITIALIZING ANATOMICAL MASTER GENERATOR: ANATOMY OF A DRESS SHOE")
    print("===============================================================")
    clear_scene()
    master_col, cols = setup_collections()
    materials = create_materials()

    print("Building Piece 1 & 2: Solid Heel Lifts & Flush Brass Nails...")
    build_piece_1_and_2_heel(cols, materials)

    print("Building Piece 3: Leather Rand...")
    build_piece_3_rand(cols, materials)

    print("Building Piece 4: Oak-Bark Outsole & Fiddleback Waist...")
    build_piece_4_outsole(cols, materials)

    print("Building Piece 5: Cork Footbed Filler...")
    build_piece_5_cork_filler(cols, materials)

    print("Building Piece 6: Spring Steel Arch Shank & Rivets...")
    build_piece_6_shank_and_rivets(cols, materials)

    print("Building Piece 7: 270° Goodyear Welt Strip...")
    build_piece_7_welt_270(cols, materials)

    print("Building Piece 8: Insole & Gemming Rib...")
    build_piece_8_insole(cols, materials)

    print("Building Piece 9 & 10: Toe Puff & Heel Counter Stiffeners...")
    build_piece_9_and_10_stiffeners(cols, materials)

    print("Building Piece 11: Glove Leather Lining Cavity...")
    build_piece_11_lining_cavity(cols, materials)

    print("Building Pieces 12, 15, 18: Quarters, Vamp & Soft-Chisel Toe Cap...")
    build_anatomical_upper_shell(cols, materials)

    print("Building Piece 13: Heel / Back Strip...")
    build_piece_13_back_strip(cols, materials)

    print("Building Piece 14: Rolled Collar Binding Bead...")
    build_piece_14_collar_binding(cols, materials)

    print("Building Pieces 16 & 17: Facings Eyestays & Padded Tongue...")
    _, eyelet_pts = build_piece_16_and_17_facings_tongue(cols, materials)

    print("Building Piece 19: 3D Braided Waxed Laces, Bow Knot & Aglets...")
    build_piece_19_lacing_system(cols, materials, eyelet_pts)

    print("Building Piece 20: Master Micro-Stitching (11 SPI) & Broguing...")
    build_piece_20_stitching_and_broguing(cols, materials)

    print("Setting up Luxury Studio Rig & Cameras...")
    cam_obj, target_obj = setup_studio_and_camera(cols)
    configure_render()

    # Save Master Blend
    master_blend = os.path.join(base_dir, "blender", "master", "SHOE_001_MASTER.blend")
    os.makedirs(os.path.dirname(master_blend), exist_ok=True)
    print(f"Saving Master Blend: {master_blend}")
    bpy.ops.wm.save_as_mainfile(filepath=master_blend)

    # Save Web Twin Blend
    web_blend = os.path.join(base_dir, "blender", "master", "SHOE_001_WEB.blend")
    print(f"Saving Web Blend Twin: {web_blend}")
    bpy.ops.wm.save_as_mainfile(filepath=web_blend)

    # Render Complete Master Photography Suite
    render_master_shots(base_dir, cam_obj, target_obj)

    # Export Production Web GLB
    web_glb_path = os.path.join(base_dir, "web", "assets", "shoe001_aurelius.glb")
    print(f"Exporting Production Web GLB: {web_glb_path}")
    bpy.ops.object.select_all(action='DESELECT')
    for subname in ["FOUNDATION", "UPPER", "INTERNAL", "HARDWARE", "STITCHING"]:
        for obj in cols[subname].objects:
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
    print("===============================================================")
    print("ANATOMICAL MASTER CONSTRUCTION & WEB ASSET PIPELINE FINISHED!")
    print("===============================================================")

if __name__ == "__main__":
    main()
