"""
=============================================================================
ISOLATED 20-PIECE ANATOMICAL RENDERER: "ANATOMY OF A DRESS SHOE"
Flagship Bespoke Oxford Shoe (SHOE_001 "AEROPRO AURELIUS")
Constructs every single one of the 20 anatomical components individually,
automatically frames each piece with auto-focus bounding box tracking,
and renders 20 high-resolution individual studio portraits in Blender Cycles.
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

# ---------------------------------------------------------------------------
# MATERIALS (Calibrated PBR Shaders)
# ---------------------------------------------------------------------------

def create_materials():
    mats = {}

    # 1. French Box Calf - Imperial Espresso (Upper, Quarters, Vamp)
    m_upper = bpy.data.materials.new(name="M_BoxCalf_ImperialEspresso")
    m_upper.use_nodes = True
    b_u = m_upper.node_tree.nodes.get("Principled BSDF")
    b_u.inputs["Base Color"].default_value = (0.065, 0.036, 0.022, 1.0) # #271912
    b_u.inputs["Roughness"].default_value = 0.32
    b_u.inputs["Coat Weight"].default_value = 0.35
    b_u.inputs["Coat Roughness"].default_value = 0.15
    b_u.inputs["Specular IOR Level"].default_value = 0.50
    mats["upper"] = m_upper

    # 2. French Box Calf - Mirror Obsidian Glaze (Toe Cap, Heel Back Strip)
    m_cap = bpy.data.materials.new(name="M_BoxCalf_MirrorObsidian")
    m_cap.use_nodes = True
    b_c = m_cap.node_tree.nodes.get("Principled BSDF")
    b_c.inputs["Base Color"].default_value = (0.018, 0.010, 0.007, 1.0) # Deep Obsidian
    b_c.inputs["Roughness"].default_value = 0.14
    b_c.inputs["Coat Weight"].default_value = 0.85
    b_c.inputs["Coat Roughness"].default_value = 0.04
    b_c.inputs["Specular IOR Level"].default_value = 0.58
    mats["cap_toe"] = m_cap

    # 3. Oak-Bark Outsole & Fiddleback Waist
    m_sole = bpy.data.materials.new(name="M_OakBark_Sole")
    m_sole.use_nodes = True
    b_s = m_sole.node_tree.nodes.get("Principled BSDF")
    b_s.inputs["Base Color"].default_value = (0.22, 0.13, 0.065, 1.0)
    b_s.inputs["Roughness"].default_value = 0.48
    b_s.inputs["Specular IOR Level"].default_value = 0.45
    mats["sole"] = m_sole

    # 4. Stacked Compressed Leather Heel Lifts
    m_heel = bpy.data.materials.new(name="M_StackedLeather_Heel")
    m_heel.use_nodes = True
    b_h = m_heel.node_tree.nodes.get("Principled BSDF")
    b_h.inputs["Base Color"].default_value = (0.050, 0.028, 0.016, 1.0)
    b_h.inputs["Roughness"].default_value = 0.38
    b_h.inputs["Coat Weight"].default_value = 0.30
    mats["heel"] = m_heel

    # 5. Dovetail Rubber Strike Pad
    m_rub = bpy.data.materials.new(name="M_Dovetail_Rubber")
    m_rub.use_nodes = True
    b_r = m_rub.node_tree.nodes.get("Principled BSDF")
    b_r.inputs["Base Color"].default_value = (0.018, 0.018, 0.020, 1.0)
    b_r.inputs["Roughness"].default_value = 0.70
    mats["rubber"] = m_rub

    # 6. Antique Champagne Brass (Eyelets, Nails, Shank Rivets, Aglets)
    m_brass = bpy.data.materials.new(name="M_AntiqueBrass")
    m_brass.use_nodes = True
    b_b = m_brass.node_tree.nodes.get("Principled BSDF")
    b_b.inputs["Base Color"].default_value = (0.78, 0.58, 0.28, 1.0)
    b_b.inputs["Metallic"].default_value = 0.92
    b_b.inputs["Roughness"].default_value = 0.25
    mats["brass"] = m_brass

    # 7. Braided Waxed Cotton Laces
    m_lace = bpy.data.materials.new(name="M_WaxedLaces")
    m_lace.use_nodes = True
    b_l = m_lace.node_tree.nodes.get("Principled BSDF")
    b_l.inputs["Base Color"].default_value = (0.028, 0.018, 0.012, 1.0)
    b_l.inputs["Roughness"].default_value = 0.45
    b_l.inputs["Sheen Weight"].default_value = 0.40
    mats["laces"] = m_lace

    # 8. Glove Leather Lining (Warm Parchment #f2ede4)
    m_lining = bpy.data.materials.new(name="M_GloveLining")
    m_lining.use_nodes = True
    b_li = m_lining.node_tree.nodes.get("Principled BSDF")
    b_li.inputs["Base Color"].default_value = (0.82, 0.77, 0.68, 1.0)
    b_li.inputs["Roughness"].default_value = 0.60
    mats["lining"] = m_lining

    # 9. Natural Granulated Cork Filler
    m_cork = bpy.data.materials.new(name="M_Cork_Filler")
    m_cork.use_nodes = True
    b_ck = m_cork.node_tree.nodes.get("Principled BSDF")
    b_ck.inputs["Base Color"].default_value = (0.36, 0.23, 0.13, 1.0)
    b_ck.inputs["Roughness"].default_value = 0.85
    mats["cork"] = m_cork

    # 10. Tempered Spring Steel (Arch Shank)
    m_steel = bpy.data.materials.new(name="M_TemperedSteel")
    m_steel.use_nodes = True
    b_st = m_steel.node_tree.nodes.get("Principled BSDF")
    b_st.inputs["Base Color"].default_value = (0.18, 0.19, 0.21, 1.0)
    b_st.inputs["Metallic"].default_value = 0.88
    b_st.inputs["Roughness"].default_value = 0.32
    mats["steel"] = m_steel

    # 11. Stiffener Board (Toe Puff & Heel Counter)
    m_stiff = bpy.data.materials.new(name="M_StiffenerBoard")
    m_stiff.use_nodes = True
    b_sf = m_stiff.node_tree.nodes.get("Principled BSDF")
    b_sf.inputs["Base Color"].default_value = (0.48, 0.38, 0.26, 1.0)
    b_sf.inputs["Roughness"].default_value = 0.70
    mats["stiffener"] = m_stiff

    # 12. Waxed Stitching Thread (11 SPI)
    m_thread = bpy.data.materials.new(name="M_WaxedThread")
    m_thread.use_nodes = True
    b_th = m_thread.node_tree.nodes.get("Principled BSDF")
    b_th.inputs["Base Color"].default_value = (0.28, 0.18, 0.11, 1.0)
    b_th.inputs["Roughness"].default_value = 0.45
    mats["thread"] = m_thread

    # 13. Vegetable Tanned Insole
    m_insole = bpy.data.materials.new(name="M_VegTan_Insole")
    m_insole.use_nodes = True
    b_in = m_insole.node_tree.nodes.get("Principled BSDF")
    b_in.inputs["Base Color"].default_value = (0.55, 0.42, 0.28, 1.0)
    b_in.inputs["Roughness"].default_value = 0.55
    mats["insole"] = m_insole

    return mats

# ---------------------------------------------------------------------------
# STATIONS
# ---------------------------------------------------------------------------

STATIONS = [
    (-0.126, 0.024, 0.024, 0.0270, 0.088,  0.000), # 0 Heel rear
    (-0.105, 0.031, 0.030, 0.0270, 0.086,  0.000), # 1 Heel seat
    (-0.082, 0.033, 0.032, 0.0270, 0.083,  0.000), # 2 Heel breast
    (-0.055, 0.030, 0.027, 0.0220, 0.078,  0.001), # 3 Waist rear
    (-0.025, 0.034, 0.029, 0.0180, 0.076,  0.002), # 4 Waist apex
    ( 0.005, 0.044, 0.038, 0.0140, 0.073,  0.002), # 5 Instep throat
    ( 0.035, 0.052, 0.046, 0.0080, 0.065,  0.002), # 6 Ball rear
    ( 0.055, 0.055, 0.050, 0.0060, 0.057,  0.001), # 7 Ball pivot
    ( 0.080, 0.051, 0.047, 0.0080, 0.046,  0.001), # 8 Cap seam
    ( 0.110, 0.045, 0.040, 0.0120, 0.042,  0.000), # 9 Toe vamp
    ( 0.138, 0.037, 0.032, 0.0150, 0.039,  0.000), # 10 Chisel shoulder
    ( 0.158, 0.026, 0.022, 0.0180, 0.032,  0.000), # 11 Chisel taper
    ( 0.168, 0.015, 0.013, 0.0190, 0.023,  0.000)  # 12 Toe tip
]

def make_horseshoe_profile(y_rear=-0.126, y_breast=-0.082, r_med=0.031, r_lat=0.030, num_curve=16, num_breast=8):
    pts = []
    for i in range(num_breast):
        u = i / (num_breast - 1)
        x = r_med * (1.0 - u) + (-r_lat) * u
        y = y_breast - 0.0015 * (1.0 - (2.0 * u - 1.0)**2)
        pts.append((x, y))
    for i in range(1, num_curve):
        alpha = math.pi * i / num_curve
        rx = r_lat if alpha < math.pi * 0.5 else r_med
        x = -rx * math.cos(alpha)
        y = y_breast - (y_breast - y_rear) * math.sin(alpha)
        pts.append((x, y))
    return pts

def create_torus_mesh(bm, r_major, r_minor, seg_maj=16, seg_min=8, matrix=Matrix.Identity(4)):
    verts = []
    for i in range(seg_maj):
        theta = 2.0 * math.pi * i / seg_maj
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        ring = []
        for j in range(seg_min):
            phi = 2.0 * math.pi * j / seg_min
            cos_p = math.cos(phi)
            sin_p = math.sin(phi)
            x = (r_major + r_minor * cos_p) * cos_t
            y = (r_major + r_minor * cos_p) * sin_t
            z = r_minor * sin_p
            v = bm.verts.new(matrix @ Vector((x, y, z)))
            ring.append(v)
        verts.append(ring)
    for i in range(seg_maj):
        i_next = (i + 1) % seg_maj
        for j in range(seg_min):
            j_next = (j + 1) % seg_min
            bm.faces.new((verts[i][j], verts[i_next][j], verts[i_next][j_next], verts[i][j_next]))

# ---------------------------------------------------------------------------
# 20 INDIVIDUAL COMPONENT BUILDERS
# ---------------------------------------------------------------------------

def build_all_20_pieces(col, mats):
    pieces = {}

    # =========================================================================
    # Piece 01: Heel Nails (9 Flush Antique Brass Pins with Disc Heads)
    # =========================================================================
    nails_mesh = bpy.data.meshes.new("Piece_01_Heel_Nails")
    bm_n = bmesh.new()
    nail_coords = [
        (-0.018, -0.116, 0.001), (-0.020, -0.106, 0.001), (-0.018, -0.094, 0.001),
        (-0.010, -0.121, 0.001), ( 0.000, -0.122, 0.001), ( 0.010, -0.121, 0.001),
        ( 0.018, -0.116, 0.001), ( 0.020, -0.106, 0.001), ( 0.018, -0.094, 0.001)
    ]
    try:
        from render_complete_nail_suite import create_fluted_nail_bmesh
    except ImportError:
        from build_photorealistic_heel_nails import create_fluted_nail_bmesh
    for nx, ny, nz in nail_coords:
        bm_single = create_fluted_nail_bmesh()
        mat_xform = Matrix.Translation(Vector((nx, ny, nz))) @ Matrix.Rotation(math.pi, 4, 'X')
        bmesh.ops.transform(bm_single, matrix=mat_xform, verts=bm_single.verts)
        v_map = {}
        for v in bm_single.verts:
            v_map[v] = bm_n.verts.new(v.co)
        for f in bm_single.faces:
            bm_n.faces.new([v_map[v] for v in f.verts])
        bm_single.free()
    bm_n.to_mesh(nails_mesh)
    bm_n.free()
    for p in nails_mesh.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_01_Heel_Nails", nails_mesh)
    obj.data.materials.append(mats["brass"])
    col.objects.link(obj)
    pieces[1] = ("Piece_01_Heel_Nails", [obj])

    # =========================================================================
    # Piece 02: Solid Heel Lifts (5 Lifts: 4 Leather + 1 Dovetail Rubber)
    # =========================================================================
    mesh_hl = bpy.data.meshes.new("Piece_02_Heel_Lifts")
    bm_hl = bmesh.new()
    levels_z = [0.0270, 0.0216, 0.0162, 0.0108, 0.0054, 0.0000]
    rings = []
    for idx, z in enumerate(levels_z):
        taper = 1.0 - idx * 0.010
        pts = make_horseshoe_profile(y_rear=-0.126, y_breast=-0.082, r_med=0.031*taper, r_lat=0.030*taper)
        r = [bm_hl.verts.new((x, y, z)) for x, y in pts]
        rings.append(r)
    n = len(rings[0])
    for l in range(len(levels_z) - 1):
        m_idx = 1 if l == len(levels_z) - 2 else 0
        for i in range(n):
            inxt = (i + 1) % n
            f = bm_hl.faces.new((rings[l][i], rings[l][inxt], rings[l+1][inxt], rings[l+1][i]))
            f.material_index = m_idx
            f.smooth = True
    bm_hl.faces.new(reversed(rings[0])).smooth = True
    bm_hl.faces.new(rings[-1]).smooth = True
    bmesh.ops.recalc_face_normals(bm_hl, faces=bm_hl.faces)
    bm_hl.to_mesh(mesh_hl)
    bm_hl.free()
    for p in mesh_hl.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_02_Heel_Lifts", mesh_hl)
    obj.data.materials.append(mats["heel"])
    obj.data.materials.append(mats["rubber"])
    col.objects.link(obj)
    pieces[2] = ("Piece_02_Heel_Lifts", [obj])

    # =========================================================================
    # Piece 03: Leather Rand (True U-Shaped Heel Transition Rand)
    # =========================================================================
    mesh_r = bpy.data.meshes.new("Piece_03_Leather_Rand")
    bm_r = bmesh.new()
    rand_pts = []
    num_curve = 20
    for i in range(num_curve + 1):
        alpha = math.pi * i / num_curve
        rx = 0.0305 if alpha < math.pi * 0.5 else 0.0315
        x = -rx * math.cos(alpha)
        y = -0.082 - (-0.082 - (-0.126)) * math.sin(alpha)
        rand_pts.append((x, y))
    r_top_in = []; r_top_out = []; r_bot_in = []; r_bot_out = []
    for x, y in rand_pts:
        r_top_in.append(bm_r.verts.new((x * 0.93, y, 0.0292)))
        r_top_out.append(bm_r.verts.new((x * 1.05, y, 0.0292)))
        r_bot_in.append(bm_r.verts.new((x * 0.93, y, 0.0270)))
        r_bot_out.append(bm_r.verts.new((x * 1.05, y, 0.0270)))
    nr = len(rand_pts)
    for i in range(nr - 1):
        inxt = i + 1
        bm_r.faces.new((r_top_in[i], r_top_out[i], r_top_out[inxt], r_top_in[inxt])).smooth = True
        bm_r.faces.new((r_top_out[i], r_bot_out[i], r_bot_out[inxt], r_top_out[inxt])).smooth = True
        bm_r.faces.new((r_bot_out[i], r_bot_in[i], r_bot_in[inxt], r_bot_out[inxt])).smooth = True
        bm_r.faces.new((r_bot_in[i], r_top_in[i], r_top_in[inxt], r_bot_in[inxt])).smooth = True
    # Cap breast ends
    bm_r.faces.new((r_top_in[0], r_bot_in[0], r_bot_out[0], r_top_out[0])).smooth = True
    bm_r.faces.new((r_top_out[-1], r_bot_out[-1], r_bot_in[-1], r_top_in[-1])).smooth = True
    bmesh.ops.recalc_face_normals(bm_r, faces=bm_r.faces)
    bm_r.to_mesh(mesh_r)
    bm_r.free()
    for p in mesh_r.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_03_Leather_Rand", mesh_r)
    obj.data.materials.append(mats["heel"])
    col.objects.link(obj)
    pieces[3] = ("Piece_03_Leather_Rand", [obj])

    # =========================================================================
    # Piece 04: Oak-Bark Outsole with Fiddleback Waist Spine
    # =========================================================================
    mesh_so = bpy.data.meshes.new("Piece_04_Outsole")
    bm_so = bmesh.new()
    sole_thick = 0.0055
    st_so = []
    for idx, s in enumerate(STATIONS):
        y = s[0]; wm = s[1]; wl = s[2]; zf = s[3]; xc = s[5]
        zb = 0.0270 if y < -0.080 else (zf - sole_thick)
        zbc = zb
        if -0.060 <= y <= 0.010:
            zbc -= 0.0042 * max(0.0, 1.0 - abs(y + 0.025) / 0.035)
        v0 = bm_so.verts.new((-wl * 0.98, y, zb))
        v1 = bm_so.verts.new((xc, y, zbc))
        v2 = bm_so.verts.new((+wm * 0.98, y, zb))
        v3 = bm_so.verts.new((+wm * 0.98, y, zf))
        v4 = bm_so.verts.new((-wl * 0.98, y, zf))
        st_so.append((v0, v1, v2, v3, v4))
    for s in range(len(STATIONS) - 1):
        s0 = st_so[s]; s1 = st_so[s + 1]
        bm_so.faces.new((s0[0], s0[1], s1[1], s1[0])).smooth = True
        bm_so.faces.new((s0[1], s0[2], s1[2], s1[1])).smooth = True
        bm_so.faces.new((s0[2], s0[3], s1[3], s1[2])).smooth = True
        bm_so.faces.new((s0[4], s0[0], s1[0], s1[4])).smooth = True
    bm_so.faces.new(reversed([s[3] for s in st_so] + [s[4] for s in reversed(st_so)])).smooth = True
    bmesh.ops.recalc_face_normals(bm_so, faces=bm_so.faces)
    bm_so.to_mesh(mesh_so)
    bm_so.free()
    for p in mesh_so.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_04_Outsole", mesh_so)
    obj.data.materials.append(mats["sole"])
    sub = obj.modifiers.new("Subsurf", 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    col.objects.link(obj)
    pieces[4] = ("Piece_04_Outsole", [obj])

    # =========================================================================
    # Piece 05: Cork Footbed Filler
    # =========================================================================
    mesh_ck = bpy.data.meshes.new("Piece_05_Footbed_Filler")
    bm_ck = bmesh.new()
    ck_top = []; ck_bot = []
    for s in STATIONS[2:11]:
        ck_top.append((
            bm_ck.verts.new(( s[1] * 0.72, s[0], s[3] + 0.0020)),
            bm_ck.verts.new((-s[2] * 0.72, s[0], s[3] + 0.0020))
        ))
        ck_bot.append((
            bm_ck.verts.new(( s[1] * 0.72, s[0], s[3] - 0.0015)),
            bm_ck.verts.new((-s[2] * 0.72, s[0], s[3] - 0.0015))
        ))
    for i in range(len(ck_top) - 1):
        bm_ck.faces.new((ck_top[i][0], ck_top[i][1], ck_top[i+1][1], ck_top[i+1][0])).smooth = True
        bm_ck.faces.new((ck_bot[i][1], ck_bot[i][0], ck_bot[i+1][0], ck_bot[i+1][1])).smooth = True
        bm_ck.faces.new((ck_top[i][0], ck_top[i+1][0], ck_bot[i+1][0], ck_bot[i][0])).smooth = True
        bm_ck.faces.new((ck_top[i][1], ck_bot[i][1], ck_bot[i+1][1], ck_top[i+1][1])).smooth = True
    bmesh.ops.recalc_face_normals(bm_ck, faces=bm_ck.faces)
    bm_ck.to_mesh(mesh_ck)
    bm_ck.free()
    for p in mesh_ck.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_05_Footbed_Filler", mesh_ck)
    obj.data.materials.append(mats["cork"])
    col.objects.link(obj)
    pieces[5] = ("Piece_05_Footbed_Filler", [obj])

    # =========================================================================
    # Piece 06: Spring Steel Arch Shank & Twin Brass Rivets
    # =========================================================================
    shank_objs = []
    mesh_sh = bpy.data.meshes.new("Piece_06_Shank_Body")
    bm_sh = bmesh.new()
    bmesh.ops.create_cube(bm_sh, size=1.0, matrix=Matrix.Scale(0.012, 4, Vector((1,0,0))) @ Matrix.Scale(0.075, 4, Vector((0,1,0))) @ Matrix.Scale(0.002, 4, Vector((0,0,1))))
    for v in bm_sh.verts:
        arch = -0.004 * (1.0 - (v.co.y / 0.0375)**2) if abs(v.co.y) <= 0.0375 else 0
        v.co.z += arch
    bm_sh.to_mesh(mesh_sh)
    bm_sh.free()
    for p in mesh_sh.polygons: p.use_smooth = True
    shank_body = bpy.data.objects.new("Piece_06_Shank_Body", mesh_sh)
    shank_body.location = (0.001, -0.038, 0.022)
    shank_body.rotation_euler = (math.radians(-8), 0, 0)
    shank_body.data.materials.append(mats["steel"])
    col.objects.link(shank_body)
    shank_objs.append(shank_body)

    mesh_rv = bpy.data.meshes.new("Piece_06_Rivets")
    bm_rv = bmesh.new()
    for ry in [-0.062, -0.052]:
        bmesh.ops.create_cone(
            bm_rv, cap_ends=True, cap_tris=False, segments=12,
            radius1=0.0016, radius2=0.0016, depth=0.003,
            matrix=Matrix.Translation(Vector((0.001, ry, 0.024)))
        )
    bm_rv.to_mesh(mesh_rv)
    bm_rv.free()
    for p in mesh_rv.polygons: p.use_smooth = True
    rivets_obj = bpy.data.objects.new("Piece_06_Rivets", mesh_rv)
    rivets_obj.data.materials.append(mats["brass"])
    col.objects.link(rivets_obj)
    shank_objs.append(rivets_obj)
    pieces[6] = ("Piece_06_Shank", shank_objs)

    # =========================================================================
    # Piece 07: 270° Goodyear Welt (Beveled Rib Strip)
    # =========================================================================
    mesh_w = bpy.data.meshes.new("Piece_07_Goodyear_Welt")
    bm_w = bmesh.new()
    w_med_top = []; w_med_bot = []; w_lat_top = []; w_lat_bot = []
    for s in STATIONS[2:]:
        y = s[0]; wm = s[1]; wl = s[2]; zf = s[3]
        ws = 0.0036; wt = 0.0022
        w_med_top.append((
            bm_w.verts.new((+wm,      y, zf + wt)),
            bm_w.verts.new((+wm + ws, y, zf + wt))
        ))
        w_med_bot.append((
            bm_w.verts.new((+wm,      y, zf)),
            bm_w.verts.new((+wm + ws, y, zf))
        ))
        w_lat_top.append((
            bm_w.verts.new((-wl,      y, zf + wt)),
            bm_w.verts.new((-wl - ws, y, zf + wt))
        ))
        w_lat_bot.append((
            bm_w.verts.new((-wl,      y, zf)),
            bm_w.verts.new((-wl - ws, y, zf))
        ))
    for i in range(len(STATIONS[2:]) - 1):
        m_t0, m_t1 = w_med_top[i]; m_t0_n, m_t1_n = w_med_top[i+1]
        m_b0, m_b1 = w_med_bot[i]; m_b0_n, m_b1_n = w_med_bot[i+1]
        bm_w.faces.new((m_t0, m_t1, m_t1_n, m_t0_n)).smooth = True
        bm_w.faces.new((m_t1, m_b1, m_b1_n, m_t1_n)).smooth = True
        bm_w.faces.new((m_b1, m_b0, m_b0_n, m_b1_n)).smooth = True
        l_t0, l_t1 = w_lat_top[i]; l_t0_n, l_t1_n = w_lat_top[i+1]
        l_b0, l_b1 = w_lat_bot[i]; l_b0_n, l_b1_n = w_lat_bot[i+1]
        bm_w.faces.new((l_t1, l_t0, l_t0_n, l_t1_n)).smooth = True
        bm_w.faces.new((l_t1_n, l_b1_n, l_b1, l_t1)).smooth = True
        bm_w.faces.new((l_b0, l_b1, l_b1_n, l_b0_n)).smooth = True
    bm_w.faces.new((w_med_top[-1][1], w_lat_top[-1][1], w_lat_top[-1][0], w_med_top[-1][0])).smooth = True
    bmesh.ops.recalc_face_normals(bm_w, faces=bm_w.faces)
    bm_w.to_mesh(mesh_w)
    bm_w.free()
    for p in mesh_w.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_07_Goodyear_Welt", mesh_w)
    obj.data.materials.append(mats["heel"])
    col.objects.link(obj)
    pieces[7] = ("Piece_07_Goodyear_Welt", [obj])

    # =========================================================================
    # Piece 08: Vegetable Tanned Insole with Carved Gemming Channel
    # =========================================================================
    mesh_in = bpy.data.meshes.new("Piece_08_Insole")
    bm_in = bmesh.new()
    in_top = []; in_bot = []
    for s in STATIONS[1:12]:
        in_top.append((
            bm_in.verts.new(( s[1] * 0.88, s[0], s[3] + 0.0035)),
            bm_in.verts.new((-s[2] * 0.88, s[0], s[3] + 0.0035))
        ))
        in_bot.append((
            bm_in.verts.new(( s[1] * 0.88, s[0], s[3] + 0.0005)),
            bm_in.verts.new((-s[2] * 0.88, s[0], s[3] + 0.0005))
        ))
    for i in range(len(in_top) - 1):
        bm_in.faces.new((in_top[i][0], in_top[i][1], in_top[i+1][1], in_top[i+1][0])).smooth = True
        bm_in.faces.new((in_bot[i][1], in_bot[i][0], in_bot[i+1][0], in_bot[i+1][1])).smooth = True
        bm_in.faces.new((in_top[i][0], in_top[i+1][0], in_bot[i+1][0], in_bot[i][0])).smooth = True
        bm_in.faces.new((in_top[i][1], in_bot[i][1], in_bot[i+1][1], in_top[i+1][1])).smooth = True
    bmesh.ops.recalc_face_normals(bm_in, faces=bm_in.faces)
    bm_in.to_mesh(mesh_in)
    bm_in.free()
    for p in mesh_in.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_08_Insole", mesh_in)
    obj.data.materials.append(mats["insole"])
    sub = obj.modifiers.new("Subsurf", 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    col.objects.link(obj)
    pieces[8] = ("Piece_08_Insole", [obj])

    # =========================================================================
    # Piece 09: Toe Puff (Molded Internal Dome Stiffener)
    # =========================================================================
    mesh_tp = bpy.data.meshes.new("Piece_09_Toe_Puff")
    bm_tp = bmesh.new()
    for s in STATIONS[8:]:
        y = s[0]; wm = s[1] * 0.94; wl = s[2] * 0.94; zf = s[3] + 0.0015; zc = s[4] * 0.95
        for u_step in range(9):
            u = (u_step - 4) / 4.0
            z = zf + (zc - zf) * (math.cos(u * math.pi * 0.5) ** 0.58)
            x = (wm if u >= 0 else -wl) * abs(u)
            bm_tp.verts.new((x, y, z))
    bm_tp.verts.ensure_lookup_table()
    for s_i in range(len(STATIONS[8:]) - 1):
        for j in range(8):
            v1 = bm_tp.verts[s_i * 9 + j]
            v2 = bm_tp.verts[s_i * 9 + j + 1]
            v3 = bm_tp.verts[(s_i + 1) * 9 + j + 1]
            v4 = bm_tp.verts[(s_i + 1) * 9 + j]
            bm_tp.faces.new((v1, v2, v3, v4)).smooth = True
    bmesh.ops.recalc_face_normals(bm_tp, faces=bm_tp.faces)
    bm_tp.to_mesh(mesh_tp)
    bm_tp.free()
    for p in mesh_tp.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_09_Toe_Puff", mesh_tp)
    obj.data.materials.append(mats["stiffener"])
    sub = obj.modifiers.new("Subsurf", 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    col.objects.link(obj)
    pieces[9] = ("Piece_09_Toe_Puff", [obj])

    # =========================================================================
    # Piece 10: Heel Counter (Internal Molded Calcaneus Stiffener)
    # =========================================================================
    mesh_hc = bpy.data.meshes.new("Piece_10_Heel_Counter")
    bm_hc = bmesh.new()
    for s in STATIONS[:4]:
        y = s[0]; wm = s[1] * 0.95; wl = s[2] * 0.95; zf = s[3] + 0.0015; zc = s[4] * 0.92
        for u_step in range(9):
            u = (u_step - 4) / 4.0
            z = zf + (zc - zf) * (math.cos(u * math.pi * 0.5) ** 0.58)
            x = (wm if u >= 0 else -wl) * abs(u)
            bm_hc.verts.new((x, y, z))
    bm_hc.verts.ensure_lookup_table()
    for s_i in range(3):
        for j in range(8):
            v1 = bm_hc.verts[s_i * 9 + j]
            v2 = bm_hc.verts[s_i * 9 + j + 1]
            v3 = bm_hc.verts[(s_i + 1) * 9 + j + 1]
            v4 = bm_hc.verts[(s_i + 1) * 9 + j]
            bm_hc.faces.new((v1, v2, v3, v4)).smooth = True
    v_c = bm_hc.verts.new((0.0, -0.128, 0.055))
    bm_hc.verts.ensure_lookup_table()
    for k in range(8):
        bm_hc.faces.new((bm_hc.verts[k], bm_hc.verts[k+1], v_c)).smooth = True
    bmesh.ops.recalc_face_normals(bm_hc, faces=bm_hc.faces)
    bm_hc.to_mesh(mesh_hc)
    bm_hc.free()
    for p in mesh_hc.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_10_Heel_Counter", mesh_hc)
    obj.data.materials.append(mats["stiffener"])
    sub = obj.modifiers.new("Subsurf", 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    col.objects.link(obj)
    pieces[10] = ("Piece_10_Heel_Counter", [obj])

    # =========================================================================
    # Piece 11: Glove Leather Lining Cavity
    # =========================================================================
    mesh_li = bpy.data.meshes.new("Piece_11_Lining")
    bm_li = bmesh.new()
    for s in STATIONS[:8]:
        y = s[0]; wm = s[1] * 0.92; wl = s[2] * 0.92; zf = s[3] + 0.0025; zc = s[4] * 0.94
        for u_step in range(9):
            u = (u_step - 4) / 4.0
            z = zf + (zc - zf) * (math.cos(u * math.pi * 0.5) ** 0.58)
            x = (wm if u >= 0 else -wl) * abs(u)
            bm_li.verts.new((x, y, z))
    bm_li.verts.ensure_lookup_table()
    for s_i in range(7):
        for j in range(8):
            v1 = bm_li.verts[s_i * 9 + j]
            v2 = bm_li.verts[s_i * 9 + j + 1]
            v3 = bm_li.verts[(s_i + 1) * 9 + j + 1]
            v4 = bm_li.verts[(s_i + 1) * 9 + j]
            bm_li.faces.new((v1, v2, v3, v4)).smooth = True
    v_lc = bm_li.verts.new((0.0, -0.1275, 0.054))
    bm_li.verts.ensure_lookup_table()
    for k in range(8):
        bm_li.faces.new((bm_li.verts[k], bm_li.verts[k+1], v_lc)).smooth = True
    bmesh.ops.recalc_face_normals(bm_li, faces=bm_li.faces)
    bm_li.to_mesh(mesh_li)
    bm_li.free()
    for p in mesh_li.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_11_Lining", mesh_li)
    obj.data.materials.append(mats["lining"])
    sub = obj.modifiers.new("Subsurf", 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    col.objects.link(obj)
    pieces[11] = ("Piece_11_Lining", [obj])

    # =========================================================================
    # Piece 12: Quarters (Medial & Lateral Quarter Panels)
    # =========================================================================
    mesh_q = bpy.data.meshes.new("Piece_12_Quarters")
    bm_q = bmesh.new()
    q_rings = []
    for s in STATIONS[:6]:
        y = s[0]; wm = s[1]; wl = s[2]; zf = s[3]; zc = s[4]
        ring = []
        for u_step in range(11):
            u = (u_step - 5) / 5.0
            z = zf + (zc - zf) * (math.cos(u * math.pi * 0.5) ** 0.58)
            if s[0] < -0.010 and abs(u) < 0.45:
                z -= 0.014 * (1.0 - (abs(u)/0.45)**2)
            x = (wm if u >= 0 else -wl) * abs(u)
            ring.append(bm_q.verts.new((x, y, z)))
        q_rings.append(ring)
    for r in range(len(q_rings) - 1):
        for j in range(10):
            bm_q.faces.new((q_rings[r][j], q_rings[r][j+1], q_rings[r+1][j+1], q_rings[r+1][j])).smooth = True
    v_qc = bm_q.verts.new((0.0, -0.129, 0.055))
    bm_q.verts.ensure_lookup_table()
    for k in range(10):
        bm_q.faces.new((q_rings[0][k], q_rings[0][k+1], v_qc)).smooth = True
    bmesh.ops.recalc_face_normals(bm_q, faces=bm_q.faces)
    bm_q.to_mesh(mesh_q)
    bm_q.free()
    for p in mesh_q.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_12_Quarters", mesh_q)
    obj.data.materials.append(mats["upper"])
    sub = obj.modifiers.new("Subsurf", 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    col.objects.link(obj)
    pieces[12] = ("Piece_12_Quarters", [obj])

    # =========================================================================
    # Piece 13: Heel / Back Strip (3D Reinforcing Leather Stay)
    # =========================================================================
    mesh_bs = bpy.data.meshes.new("Piece_13_Heel_Back_Strip")
    bm_bs = bmesh.new()
    bs_front = []; bs_back = []
    for i in range(13):
        u = i / 12.0
        z = 0.0270 + u * (0.0880 - 0.0270)
        y = -0.1265 - 0.0030 * math.sin(u * math.pi)
        bs_front.append((
            bm_bs.verts.new((-0.0045, y, z)),
            bm_bs.verts.new(( 0.0045, y, z))
        ))
        bs_back.append((
            bm_bs.verts.new((-0.0045, y - 0.0014, z)),
            bm_bs.verts.new(( 0.0045, y - 0.0014, z))
        ))
    for i in range(12):
        # Outer surface
        bm_bs.faces.new((bs_back[i][0], bs_back[i][1], bs_back[i+1][1], bs_back[i+1][0])).smooth = True
        # Inner surface
        bm_bs.faces.new((bs_front[i][1], bs_front[i][0], bs_front[i+1][0], bs_front[i+1][1])).smooth = True
        # Flanks
        bm_bs.faces.new((bs_back[i][0], bs_back[i+1][0], bs_front[i+1][0], bs_front[i][0])).smooth = True
        bm_bs.faces.new((bs_front[i][1], bs_front[i+1][1], bs_back[i+1][1], bs_back[i][1])).smooth = True
    bmesh.ops.recalc_face_normals(bm_bs, faces=bm_bs.faces)
    bm_bs.to_mesh(mesh_bs)
    bm_bs.free()
    for p in mesh_bs.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_13_Heel_Back_Strip", mesh_bs)
    obj.data.materials.append(mats["cap_toe"])
    col.objects.link(obj)
    pieces[13] = ("Piece_13_Heel_Back_Strip", [obj])

    # =========================================================================
    # Piece 14: Rolled Collar Binding Bead
    # =========================================================================
    curve_col = bpy.data.curves.new("Piece_14_Rolled_Collar_Binding", type='CURVE')
    curve_col.dimensions = '3D'
    curve_col.bevel_depth = 0.0018
    sp = curve_col.splines.new('BEZIER')
    c_pts = [
        Vector(( 0.000, -0.126, 0.088)), Vector((-0.016, -0.102, 0.082)),
        Vector((-0.022, -0.065, 0.071)), Vector((-0.014, -0.025, 0.072)),
        Vector((-0.008,  0.005, 0.074)), Vector(( 0.000,  0.008, 0.074)),
        Vector(( 0.008,  0.005, 0.074)), Vector(( 0.014, -0.025, 0.072)),
        Vector(( 0.022, -0.065, 0.073)), Vector(( 0.016, -0.102, 0.084)),
        Vector(( 0.000, -0.126, 0.088))
    ]
    sp.bezier_points.add(len(c_pts) - 1)
    for idx, pt in enumerate(c_pts):
        bp = sp.bezier_points[idx]
        bp.co = pt; bp.handle_left_type = 'AUTO'; bp.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new("Piece_14_Rolled_Collar_Binding", curve_col)
    obj.data.materials.append(mats["upper"])
    col.objects.link(obj)
    pieces[14] = ("Piece_14_Rolled_Collar_Binding", [obj])

    # =========================================================================
    # Piece 15: Vamp & Throat
    # =========================================================================
    mesh_v = bpy.data.meshes.new("Piece_15_Vamp")
    bm_v = bmesh.new()
    for s in STATIONS[5:9]:
        y = s[0]; wm = s[1]; wl = s[2]; zf = s[3]; zc = s[4]
        for u_step in range(9):
            u = (u_step - 4) / 4.0
            z = zf + (zc - zf) * (math.cos(u * math.pi * 0.5) ** 0.58)
            x = (wm if u >= 0 else -wl) * abs(u)
            bm_v.verts.new((x, y, z))
    bm_v.verts.ensure_lookup_table()
    for s_i in range(3):
        for j in range(8):
            v1 = bm_v.verts[s_i * 9 + j]
            v2 = bm_v.verts[s_i * 9 + j + 1]
            v3 = bm_v.verts[(s_i + 1) * 9 + j + 1]
            v4 = bm_v.verts[(s_i + 1) * 9 + j]
            bm_v.faces.new((v1, v2, v3, v4)).smooth = True
    bmesh.ops.recalc_face_normals(bm_v, faces=bm_v.faces)
    bm_v.to_mesh(mesh_v)
    bm_v.free()
    for p in mesh_v.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_15_Vamp", mesh_v)
    obj.data.materials.append(mats["upper"])
    sub = obj.modifiers.new("Subsurf", 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    col.objects.link(obj)
    pieces[15] = ("Piece_15_Vamp", [obj])

    # =========================================================================
    # Piece 16: Facings / Eyestays with Countersunk Brass Eyelets
    # =========================================================================
    facings_objs = []
    eyelet_pts = [
        (Vector((-0.006, 0.035, 0.069)), Vector(( 0.006, 0.035, 0.069))),
        (Vector((-0.0065, 0.024, 0.071)), Vector(( 0.0065, 0.024, 0.071))),
        (Vector((-0.007, 0.013, 0.0725)), Vector(( 0.007, 0.013, 0.0725))),
        (Vector((-0.0075, 0.002, 0.0735)), Vector(( 0.0075, 0.002, 0.0735))),
        (Vector((-0.008, -0.009, 0.0745)), Vector(( 0.008, -0.009, 0.0745)))
    ]
    mesh_fl = bpy.data.meshes.new("Piece_16_Facing_Leather")
    bm_fl = bmesh.new()
    for pl, pr in eyelet_pts:
        bm_fl.verts.new((pl.x - 0.006, pl.y, pl.z))
        bm_fl.verts.new((pl.x + 0.002, pl.y, pl.z))
        bm_fl.verts.new((pr.x - 0.002, pr.y, pr.z))
        bm_fl.verts.new((pr.x + 0.006, pr.y, pr.z))
    bm_fl.verts.ensure_lookup_table()
    for i in range(4):
        i0 = i * 4; i1 = (i + 1) * 4
        bm_fl.faces.new((bm_fl.verts[i0], bm_fl.verts[i0+1], bm_fl.verts[i1+1], bm_fl.verts[i1])).smooth = True
        bm_fl.faces.new((bm_fl.verts[i0+2], bm_fl.verts[i0+3], bm_fl.verts[i1+3], bm_fl.verts[i1+2])).smooth = True
    bmesh.ops.recalc_face_normals(bm_fl, faces=bm_fl.faces)
    bm_fl.to_mesh(mesh_fl)
    bm_fl.free()
    for p in mesh_fl.polygons: p.use_smooth = True
    obj_fl = bpy.data.objects.new("Piece_16_Facing_Leather", mesh_fl)
    obj_fl.data.materials.append(mats["upper"])
    col.objects.link(obj_fl)
    facings_objs.append(obj_fl)

    mesh_ey = bpy.data.meshes.new("Piece_16_Eyelets")
    bm_ey = bmesh.new()
    for idx, (pl, pr) in enumerate(eyelet_pts):
        create_torus_mesh(
            bm_ey, r_major=0.0016, r_minor=0.00045, seg_maj=16, seg_min=8,
            matrix=Matrix.Translation(pl) @ Euler((math.radians(24), 0, 0)).to_matrix().to_4x4()
        )
        create_torus_mesh(
            bm_ey, r_major=0.0016, r_minor=0.00045, seg_maj=16, seg_min=8,
            matrix=Matrix.Translation(pr) @ Euler((math.radians(24), 0, 0)).to_matrix().to_4x4()
        )
    bm_ey.to_mesh(mesh_ey)
    bm_ey.free()
    for p in mesh_ey.polygons: p.use_smooth = True
    obj_ey = bpy.data.objects.new("Piece_16_Eyelets", mesh_ey)
    obj_ey.data.materials.append(mats["brass"])
    col.objects.link(obj_ey)
    facings_objs.append(obj_ey)
    pieces[16] = ("Piece_16_Facings", facings_objs)

    # =========================================================================
    # Piece 17: Padded Tongue (Anatomical Contoured Tongue)
    # =========================================================================
    mesh_t = bpy.data.meshes.new("Piece_17_Padded_Tongue")
    bm_t = bmesh.new()
    t_top = []; t_bot = []
    for i in range(9):
        u = i / 8.0
        y = 0.038 - u * 0.052
        z = 0.067 + u * 0.007 + 0.003 * math.sin(u * math.pi)
        w = 0.011 + u * 0.005
        t_top.append((
            bm_t.verts.new((-w, y, z + 0.0015)),
            bm_t.verts.new(( w, y, z + 0.0015))
        ))
        t_bot.append((
            bm_t.verts.new((-w, y, z - 0.0015)),
            bm_t.verts.new(( w, y, z - 0.0015))
        ))
    for i in range(8):
        bm_t.faces.new((t_top[i][0], t_top[i][1], t_top[i+1][1], t_top[i+1][0])).smooth = True
        bm_t.faces.new((t_bot[i][1], t_bot[i][0], t_bot[i+1][0], t_bot[i+1][1])).smooth = True
        bm_t.faces.new((t_top[i][0], t_top[i+1][0], t_bot[i+1][0], t_bot[i][0])).smooth = True
        bm_t.faces.new((t_top[i][1], t_bot[i][1], t_bot[i+1][1], t_top[i+1][1])).smooth = True
    # Rounded top and bottom ends
    bm_t.faces.new((t_top[0][1], t_top[0][0], t_bot[0][0], t_bot[0][1])).smooth = True
    bm_t.faces.new((t_top[-1][0], t_top[-1][1], t_bot[-1][1], t_bot[-1][0])).smooth = True
    bmesh.ops.recalc_face_normals(bm_t, faces=bm_t.faces)
    bm_t.to_mesh(mesh_t)
    bm_t.free()
    for p in mesh_t.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_17_Padded_Tongue", mesh_t)
    obj.data.materials.append(mats["lining"])
    sub = obj.modifiers.new("Subsurf", 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    col.objects.link(obj)
    pieces[17] = ("Piece_17_Padded_Tongue", [obj])

    # =========================================================================
    # Piece 18: Hand-Burnished Chisel Toe Cap
    # =========================================================================
    mesh_tc = bpy.data.meshes.new("Piece_18_Toe_Cap")
    bm_tc = bmesh.new()
    tc_rings = []
    for s in STATIONS[8:]:
        y = s[0]; wm = s[1]; wl = s[2]; zf = s[3]; zc = s[4]
        ring = []
        for u_step in range(11):
            u = (u_step - 5) / 5.0
            prof = math.cos(u * math.pi * 0.5) ** 0.58
            z = zf + (zc - zf) * prof
            if abs(u) < 0.40:
                z *= 0.994
            x = (wm if u >= 0 else -wl) * abs(u) * 1.008
            ring.append(bm_tc.verts.new((x, y, z)))
        tc_rings.append(ring)
    for r in range(len(tc_rings) - 1):
        for j in range(10):
            bm_tc.faces.new((tc_rings[r][j], tc_rings[r][j+1], tc_rings[r+1][j+1], tc_rings[r+1][j])).smooth = True
    v_prow = bm_tc.verts.new((0.0, 0.170, 0.020))
    bm_tc.verts.ensure_lookup_table()
    for k in range(10):
        bm_tc.faces.new((tc_rings[-1][k+1], tc_rings[-1][k], v_prow)).smooth = True
    bmesh.ops.recalc_face_normals(bm_tc, faces=bm_tc.faces)
    bm_tc.to_mesh(mesh_tc)
    bm_tc.free()
    for p in mesh_tc.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_18_Toe_Cap", mesh_tc)
    obj.data.materials.append(mats["cap_toe"])
    sub = obj.modifiers.new("Subsurf", 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    col.objects.link(obj)
    pieces[18] = ("Piece_18_Toe_Cap", [obj])

    # =========================================================================
    # Piece 19: 3D Braided Waxed Cotton Laces & Aglets
    # =========================================================================
    laces_objs = []
    curve_l = bpy.data.curves.new("Piece_19_Waxed_Laces", type='CURVE')
    curve_l.dimensions = '3D'
    curve_l.bevel_depth = 0.0011
    lace_bars = [
        [eyelet_pts[0][0], eyelet_pts[0][1]],
        [eyelet_pts[1][0], eyelet_pts[1][1]],
        [eyelet_pts[2][0], eyelet_pts[2][1]],
        [eyelet_pts[3][0], eyelet_pts[3][1]],
        [eyelet_pts[4][0], eyelet_pts[4][1]],
        [eyelet_pts[4][0], Vector((-0.012, -0.016, 0.079)), Vector((-0.014, -0.024, 0.078)), Vector((0.0, -0.014, 0.076))],
        [eyelet_pts[4][1], Vector(( 0.012, -0.016, 0.079)), Vector(( 0.014, -0.024, 0.078)), Vector((0.0, -0.014, 0.076))]
    ]
    for seg in lace_bars:
        sp = curve_l.splines.new('BEZIER')
        sp.bezier_points.add(len(seg) - 1)
        for idx, pt in enumerate(seg):
            bp = sp.bezier_points[idx]
            bp.co = pt; bp.handle_left_type = 'AUTO'; bp.handle_right_type = 'AUTO'
    obj_l = bpy.data.objects.new("Piece_19_Waxed_Laces", curve_l)
    obj_l.data.materials.append(mats["laces"])
    col.objects.link(obj_l)
    laces_objs.append(obj_l)

    mesh_ag = bpy.data.meshes.new("Piece_19_Aglets")
    bm_ag = bmesh.new()
    for ag_pt in [Vector((-0.014, -0.024, 0.078)), Vector((0.014, -0.024, 0.078))]:
        bmesh.ops.create_cone(
            bm_ag, cap_ends=True, cap_tris=False, segments=12,
            radius1=0.0012, radius2=0.0012, depth=0.005,
            matrix=Matrix.Translation(ag_pt) @ Euler((math.radians(45), 0, 0)).to_matrix().to_4x4()
        )
    bm_ag.to_mesh(mesh_ag)
    bm_ag.free()
    for p in mesh_ag.polygons: p.use_smooth = True
    obj_ag = bpy.data.objects.new("Piece_19_Aglets", mesh_ag)
    obj_ag.data.materials.append(mats["brass"])
    col.objects.link(obj_ag)
    laces_objs.append(obj_ag)
    pieces[19] = ("Piece_19_Waxed_Laces", laces_objs)

    # =========================================================================
    # Piece 20: 11 SPI Twin Micro-Stitching
    # =========================================================================
    mesh_st = bpy.data.meshes.new("Piece_20_Micro_Stitching")
    bm_st = bmesh.new()
    s_cap = STATIONS[8]
    for i in range(40):
        u = (i - 19.5) / 19.5
        prof = math.cos(u * math.pi * 0.5) ** 0.58
        sz = s_cap[3] + (s_cap[4] - s_cap[3]) * prof + 0.0008
        sx = (s_cap[1] if u >= 0 else -s_cap[2]) * abs(u)
        bmesh.ops.create_cone(
            bm_st, cap_ends=True, cap_tris=False, segments=8, radius1=0.00035, radius2=0.00035, depth=0.0018,
            matrix=Matrix.Translation(Vector((sx, 0.0792, sz))) @ Euler((0, math.radians(u * 35), 0)).to_matrix().to_4x4()
        )
        bmesh.ops.create_cone(
            bm_st, cap_ends=True, cap_tris=False, segments=8, radius1=0.00035, radius2=0.00035, depth=0.0018,
            matrix=Matrix.Translation(Vector((sx, 0.0812, sz))) @ Euler((0, math.radians(u * 35), 0)).to_matrix().to_4x4()
        )
    bm_st.to_mesh(mesh_st)
    bm_st.free()
    for p in mesh_st.polygons: p.use_smooth = True
    obj = bpy.data.objects.new("Piece_20_Micro_Stitching", mesh_st)
    obj.data.materials.append(mats["thread"])
    col.objects.link(obj)
    pieces[20] = ("Piece_20_Micro_Stitching", [obj])

    return pieces

# ---------------------------------------------------------------------------
# STUDIO & AUTO-TRACKING CAMERA
# ---------------------------------------------------------------------------

def setup_studio():
    world = bpy.data.worlds.new("Studio_World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.04, 0.04, 0.045, 1.0) # Deep charcoal
        bg.inputs["Strength"].default_value = 0.35
    bpy.context.scene.world = world

    # Shadow Catcher Floor
    mesh_sh = bpy.data.meshes.new("Shadow_Catcher_Floor")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=2, y_segments=2, size=3.0)
    bm.to_mesh(mesh_sh)
    bm.free()
    catcher = bpy.data.objects.new("Shadow_Catcher_Floor", mesh_sh)
    catcher.is_shadow_catcher = True
    bpy.context.scene.collection.objects.link(catcher)

    # Soft Studio Lights
    lights = {}
    rig = [
        ("Key", 'AREA', 14.0, (0.40, 0.40)),
        ("Fill", 'AREA', 5.5, (0.50, 0.50)),
        ("Rim", 'SPOT', 9.0, (0.25, 0.25))
    ]
    for name, ltype, en, sz in rig:
        ldata = bpy.data.lights.new(name, type=ltype)
        ldata.energy = en
        if ltype == 'AREA':
            ldata.size = sz[0]; ldata.size_y = sz[1]
        elif ltype == 'SPOT':
            ldata.spot_size = math.radians(45); ldata.spot_blend = 0.5
        lobj = bpy.data.objects.new(name, ldata)
        bpy.context.scene.collection.objects.link(lobj)
        lights[name] = lobj

    # Master Camera
    cdata = bpy.data.cameras.new("Piece_Camera")
    cdata.lens = 85
    cobj = bpy.data.objects.new("Piece_Camera", cdata)
    bpy.context.scene.collection.objects.link(cobj)
    bpy.context.scene.camera = cobj

    return cobj, lights, catcher

def get_object_bounds(target_objs):
    pts = []
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for obj in target_objs:
        try:
            eval_obj = obj.evaluated_get(depsgraph)
            eval_mesh = eval_obj.to_mesh()
            for v in eval_mesh.vertices:
                pts.append(obj.matrix_world @ v.co)
            eval_obj.to_mesh_clear()
        except Exception:
            if obj.type == 'CURVE':
                for sp in obj.data.splines:
                    for bp in sp.bezier_points:
                        pts.append(obj.matrix_world @ bp.co)
            else:
                for c in obj.bound_box:
                    pts.append(obj.matrix_world @ Vector(c))
    if not pts:
        return Vector((0, 0, 0.05)), 0.08
    center = sum(pts, Vector()) / len(pts)
    radius = max((p - center).length for p in pts)
    return center, max(radius, 0.015)

def frame_object(cam_obj, target_objs, lights, catcher):
    center, radius = get_object_bounds(target_objs)

    # 85mm lens on 36mm sensor: dist = radius * 6.5 + 0.035
    dist = radius * 6.5 + 0.035
    cam_offset = Vector((0.55, -0.75, 0.48)).normalized() * dist
    cam_obj.location = center + cam_offset

    direction = center - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    # Position shadow catcher plane right below piece
    catcher.location = (center.x, center.y, center.z - radius - 0.002)

    # Soft, balanced lighting distance
    light_dist = max(0.42, radius * 3.5)
    lights["Key"].location = center + Vector((0.55, -0.45, 0.65)).normalized() * light_dist
    lights["Fill"].location = center + Vector((-0.65, 0.35, 0.45)).normalized() * (light_dist * 1.1)
    lights["Rim"].location = center + Vector((-0.30, 0.70, 0.60)).normalized() * (light_dist * 0.95)

# ---------------------------------------------------------------------------
# RENDER ALL 20 PIECES
# ---------------------------------------------------------------------------

def render_pieces(base_dir, pieces, cam_obj, lights, catcher):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 95

    out_dir = os.path.join(base_dir, "renders", "pieces")
    os.makedirs(out_dir, exist_ok=True)

    all_objs = []
    for idx in pieces:
        all_objs.extend(pieces[idx][1])

    print("\n=======================================================")
    print("RENDERING ALL 20 ANATOMICAL PIECES SEPARATELY")
    print("=======================================================")

    for num in range(1, 21):
        name, objs = pieces[num]
        print(f"\n[{num:02d}/20] Isolating {name}...")

        # Hide all objects except current piece
        for o in all_objs:
            o.hide_render = True
            o.hide_viewport = True
        for o in objs:
            o.hide_render = False
            o.hide_viewport = False

        frame_object(cam_obj, objs, lights, catcher)

        filename = f"{name}.jpg"
        out_path = os.path.join(out_dir, filename)
        scene.render.filepath = out_path

        print(f"Rendering -> {out_path}...")
        bpy.ops.render.render(write_still=True)
        print(f"Saved: {filename}")

    print("\n=======================================================")
    print("ALL 20 PIECES RENDERED SUCCESSFULLY!")
    print("=======================================================")

def main():
    base_dir = r"c:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001"
    clear_scene()
    col = bpy.data.collections.new("ANATOMY_20_PIECES")
    bpy.context.scene.collection.children.link(col)
    mats = create_materials()

    print("Building all 20 individual anatomical pieces...")
    pieces = build_all_20_pieces(col, mats)

    print("Setting up studio lighting and camera...")
    cam_obj, lights, catcher = setup_studio()

    render_pieces(base_dir, pieces, cam_obj, lights, catcher)

if __name__ == "__main__":
    main()
