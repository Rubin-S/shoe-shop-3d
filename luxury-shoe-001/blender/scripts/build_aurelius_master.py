"""
Bespoke Footwear Master Production Generator for SHOE_001 "AEROPRO AURELIUS"
Blender 4.2+ LTS Master Authoring Script.
Complies with:
- product/SHOE_001_SPEC.md
- .agents/rules/luxury-product-quality.md
- QA_AUDIT_REPORT_001.md
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
    
    subcols = ["UPPER", "LACING", "CONSTRUCTION", "DETAILS", "STUDIO"]
    col_dict = {}
    for name in subcols:
        col = bpy.data.collections.new(name)
        master_col.children.link(col)
        col_dict[name] = col
    return master_col, col_dict

# ---------------------------------------------------------------------------
# MATERIALS: Multi-Scale Physically Based Shaders
# ---------------------------------------------------------------------------

def create_leather_material(name="M_BoxCalf_ImperialEspresso", is_cap_toe=False):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    out_node = nodes.new(type="ShaderNodeOutputMaterial")
    out_node.location = (600, 0)
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (250, 0)
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

    if is_cap_toe:
        # Hand-burnished Obsidian mirror glaze
        bsdf.inputs["Base Color"].default_value = (0.032, 0.018, 0.012, 1.0) # #140c09
        bsdf.inputs["Roughness"].default_value = 0.14
        bsdf.inputs["Coat Weight"].default_value = 0.96 # Carnauba mirror gloss
        bsdf.inputs["Coat Roughness"].default_value = 0.03
        bsdf.inputs["Specular IOR Level"].default_value = 0.60
    else:
        # Imperial Espresso French Box Calf
        bsdf.inputs["Base Color"].default_value = (0.075, 0.042, 0.026, 1.0) # #271912
        bsdf.inputs["Roughness"].default_value = 0.32
        bsdf.inputs["Coat Weight"].default_value = 0.38
        bsdf.inputs["Coat Roughness"].default_value = 0.14
        bsdf.inputs["Specular IOR Level"].default_value = 0.52

    # Procedural micro-pore grain
    tex_coord = nodes.new(type="ShaderNodeTexCoord")
    mapping = nodes.new(type="ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (140.0, 140.0, 140.0)
    mat.node_tree.links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])

    voronoi = nodes.new(type="ShaderNodeTexVoronoi")
    voronoi.inputs["Scale"].default_value = 350.0
    mat.node_tree.links.new(mapping.outputs["Vector"], voronoi.inputs["Vector"])

    bump = nodes.new(type="ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.008 if not is_cap_toe else 0.002
    bump.inputs["Distance"].default_value = 0.001
    mat.node_tree.links.new(voronoi.outputs["Distance"], bump.inputs["Height"])
    mat.node_tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat

def create_oak_bark_sole_material():
    mat = bpy.data.materials.new(name="M_OakBark_Sole")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    # Two-tone stained oak bark
    bsdf.inputs["Base Color"].default_value = (0.24, 0.15, 0.08, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.52
    bsdf.inputs["Specular IOR Level"].default_value = 0.40
    return mat

def create_stacked_heel_material():
    mat = bpy.data.materials.new(name="M_StackedHeel")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.055, 0.034, 0.020, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.38
    bsdf.inputs["Coat Weight"].default_value = 0.40
    return mat

def create_dovetail_rubber_material():
    mat = bpy.data.materials.new(name="M_Dovetail_Rubber")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.030, 0.030, 0.032, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.75
    return mat

def create_brass_material():
    mat = bpy.data.materials.new(name="M_AntiqueBrass")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.75, 0.58, 0.32, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.95
    bsdf.inputs["Roughness"].default_value = 0.22
    return mat

def create_waxed_laces_material():
    mat = bpy.data.materials.new(name="M_WaxedLaces")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.038, 0.025, 0.016, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.42
    bsdf.inputs["Sheen Weight"].default_value = 0.55
    return mat

def create_glove_lining_material():
    mat = bpy.data.materials.new(name="M_GloveLining")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.86, 0.82, 0.74, 1.0) # Warm parchment #f2ede4
    bsdf.inputs["Roughness"].default_value = 0.65
    return mat

def create_stitch_material():
    mat = bpy.data.materials.new(name="M_WaxedStitch")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.32, 0.22, 0.14, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.38
    return mat

# ---------------------------------------------------------------------------
# ANATOMICAL GEOMETRY ENGINE
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

def build_shoe_components(master_col, materials):
    num_radial = 20

    # 1. UPPER (Watertight anatomical volume with dual materials: Vamp vs Cap Toe)
    mesh_upper = bpy.data.meshes.new("Upper_Master")
    bm_u = bmesh.new()

    rings = []
    for s_idx, (y, wm, wl, zb_sole, zb_up, zt_up) in enumerate(STATIONS):
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
                    dip = 0.022 if x < 0 else 0.016 # Asymmetric malleolus dip
                    z = z_mid + z_rad * cos_t - dip * (cos_t - 0.25) / 0.75
                else:
                    z = z_mid + z_rad * cos_t
            elif s_idx >= 8: # Soft chisel top profile
                if cos_t > 0.25:
                    z = z_mid + z_rad * (0.32 + 0.68 * math.sin((cos_t - 0.25) * math.pi / 0.75))
                else:
                    z = z_mid + z_rad * cos_t
            else:
                z = z_mid + z_rad * cos_t

            # Micro-ridge for physical cap-toe lap seam
            if s_idx >= 8:
                x *= 1.012
                z += 0.0005

            v = bm_u.verts.new((x, y, z))
            ring.append(v)
        rings.append(ring)

    # Faces
    for r in range(len(rings) - 1):
        mat_idx = 1 if r >= 8 else 0 # Slot 1: Mirror Obsidian Cap Toe; Slot 0: Imperial Espresso
        for i in range(num_radial):
            v1 = rings[r][i]
            v2 = rings[r][(i + 1) % num_radial]
            v3 = rings[r + 1][(i + 1) % num_radial]
            v4 = rings[r + 1][i]
            f = bm_u.faces.new((v1, v2, v3, v4))
            f.material_index = mat_idx
            f.smooth = True

    # Heel back closure
    heel_pt = bm_u.verts.new((0.0, -0.127, 0.056))
    for i in range(num_radial):
        f = bm_u.faces.new((rings[0][i], rings[0][(i + 1) % num_radial], heel_pt))
        f.material_index = 0
        f.smooth = True

    # Toe tip closure
    toe_pt = bm_u.verts.new((0.0, 0.168, 0.021))
    for i in range(num_radial):
        f = bm_u.faces.new((rings[-1][i], rings[-1][(i + 1) % num_radial], toe_pt))
        f.material_index = 1
        f.smooth = True

    bm_u.to_mesh(mesh_upper)
    bm_u.free()
    for p in mesh_upper.polygons:
        p.use_smooth = True

    obj_upper = bpy.data.objects.new("Upper_Master", mesh_upper)
    obj_upper.data.materials.append(materials["leather"])
    obj_upper.data.materials.append(materials["toe_cap"])
    master_col.children["UPPER"].objects.link(obj_upper)
    sub_u = obj_upper.modifiers.new(name="Subsurf", type='SUBSURF')
    sub_u.levels = 2
    sub_u.render_levels = 2

    # 2. CONTINUOUS SOLE & WELT UNIT (Watertight bond to upper)
    mesh_sole = bpy.data.meshes.new("Construction_Sole_Unit")
    bm_s = bmesh.new()

    sole_top_rings = []
    sole_bot_rings = []
    for s_idx, (y, wm, wl, zb_sole, zb_up, zt_up) in enumerate(STATIONS):
        top_r = []
        bot_r = []
        # Welt shelf extends ~3.2mm outward from upper
        w_shelf = 0.0032 if s_idx >= 3 else 0.0018
        for i in range(num_radial):
            theta = 2.0 * math.pi * i / num_radial
            w_top = (wm + w_shelf) if math.sin(theta) >= 0 else (wl + w_shelf)
            w_bot = (wm + w_shelf * 0.90) if math.sin(theta) >= 0 else (wl + w_shelf * 0.90)
            x_top = w_top * math.sin(theta)
            x_bot = w_bot * math.sin(theta)

            # Top surface meets the upper feather edge
            z_top = zb_up + 0.0005
            # Bottom surface forms the outsole
            z_bot = zb_sole

            # Triangular fiddleback waist arch ridge along centerline
            if 3 <= s_idx <= 5 and math.cos(theta) < -0.2:
                spine = max(0.0, 1.0 - abs(x_bot) / (w_bot * 0.45))
                z_bot -= 0.0045 * spine

            top_r.append(bm_s.verts.new((x_top, y, z_top)))
            bot_r.append(bm_s.verts.new((x_bot, y, z_bot)))
        sole_top_rings.append(top_r)
        sole_bot_rings.append(bot_r)

    # Bridge top rings, bottom rings, and outer sidewall edge
    for r in range(len(STATIONS) - 1):
        for i in range(num_radial):
            # Top welt shelf surface
            f_top = bm_s.faces.new((sole_top_rings[r][i], sole_top_rings[r][(i + 1) % num_radial], sole_top_rings[r + 1][(i + 1) % num_radial], sole_top_rings[r + 1][i]))
            f_top.smooth = True
            # Bottom outsole surface
            f_bot = bm_s.faces.new((sole_bot_rings[r][i], sole_bot_rings[r + 1][i], sole_bot_rings[r + 1][(i + 1) % num_radial], sole_bot_rings[r][(i + 1) % num_radial]))
            f_bot.smooth = True
            # Outer sidewall bevel
            f_wall = bm_s.faces.new((sole_top_rings[r][i], sole_top_rings[r + 1][i], sole_bot_rings[r + 1][i], sole_bot_rings[r][i]))
            f_wall.smooth = True

    # Close heel back & toe tip on sole
    heel_s_top = bm_s.verts.new((0.0, -0.126, 0.027))
    heel_s_bot = bm_s.verts.new((0.0, -0.126, 0.000))
    toe_s_top = bm_s.verts.new((0.0, 0.169, 0.020))
    toe_s_bot = bm_s.verts.new((0.0, 0.169, 0.014))

    for i in range(num_radial):
        bm_s.faces.new((sole_top_rings[0][i], sole_top_rings[0][(i + 1) % num_radial], heel_s_top)).smooth = True
        bm_s.faces.new((sole_bot_rings[0][(i + 1) % num_radial], sole_bot_rings[0][i], heel_s_bot)).smooth = True
        bm_s.faces.new((sole_top_rings[-1][(i + 1) % num_radial], sole_top_rings[-1][i], toe_s_top)).smooth = True
        bm_s.faces.new((sole_bot_rings[-1][i], sole_bot_rings[-1][(i + 1) % num_radial], toe_s_bot)).smooth = True

    bm_s.to_mesh(mesh_sole)
    bm_s.free()
    for p in mesh_sole.polygons:
        p.use_smooth = True

    obj_sole = bpy.data.objects.new("Construction_Sole_Unit", mesh_sole)
    obj_sole.data.materials.append(materials["sole"])
    master_col.children["CONSTRUCTION"].objects.link(obj_sole)
    obj_sole.modifiers.new(name="Subsurf", type='SUBSURF').levels = 2

    # 3. STACKED LEATHER HEEL (4 compressed leather lifts + dovetail rubber strike plate)
    mesh_heel = bpy.data.meshes.new("Construction_HeelStack")
    bm_h = bmesh.new()
    num_lifts = 4
    lift_h = 0.027 / num_lifts
    for l in range(num_lifts):
        zt = 0.027 - l * lift_h
        zb = zt - lift_h
        taper = 1.0 - l * 0.022
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
            bm_h.faces.new((r_top[i], r_top[(i + 1) % n_pts], r_bot[(i + 1) % n_pts], r_bot[i])).smooth = True

    # Close bottom face of heel
    heel_bot_center = bm_h.verts.new((0.0, -0.104, 0.000))
    for i in range(n_pts):
        bm_h.faces.new((r_bot[(i + 1) % n_pts], r_bot[i], heel_bot_center)).smooth = True

    bm_h.to_mesh(mesh_heel)
    bm_h.free()
    for p in mesh_heel.polygons:
        p.use_smooth = True
    obj_heel = bpy.data.objects.new("Construction_HeelStack", mesh_heel)
    obj_heel.data.materials.append(materials["heel"])
    master_col.children["CONSTRUCTION"].objects.link(obj_heel)
    obj_heel.modifiers.new(name="Subsurf", type='SUBSURF').levels = 1

    # 4. BRASS HARDWARE & HEEL NAILS
    nail_coords = [
        (-0.022, -0.118, 0.0002),
        (-0.024, -0.108, 0.0002),
        (-0.022, -0.098, 0.0002),
        (-0.012, -0.122, 0.0002),
        ( 0.000, -0.123, 0.0002),
        ( 0.012, -0.122, 0.0002),
        ( 0.022, -0.118, 0.0002),
        ( 0.024, -0.108, 0.0002),
        ( 0.022, -0.098, 0.0002)
    ]
    for idx, (nx, ny, nz) in enumerate(nail_coords):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.0007,
            depth=0.0015,
            vertices=12,
            location=(nx, ny, nz)
        )
        nail = bpy.context.active_object
        for p in nail.data.polygons:
            p.use_smooth = True
        nail.name = f"Heel_Brass_Nail_{idx+1}"
        nail.data.materials.append(materials["brass"])
        master_col.children["DETAILS"].objects.link(nail)
        bpy.context.scene.collection.objects.unlink(nail)

    # 5. 5-PAIR EYELETS & 3D BÉZIER LACES
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
        # Bow knot loops
        [eyelet_pts[4][0], Vector((-0.014, -0.032, 0.094)), Vector((-0.020, -0.040, 0.098)), Vector((-0.008, -0.040, 0.095)), Vector((0.0, -0.028, 0.089))],
        [eyelet_pts[4][1], Vector(( 0.014, -0.032, 0.094)), Vector(( 0.020, -0.040, 0.098)), Vector(( 0.008, -0.040, 0.095)), Vector((0.0, -0.028, 0.089))],
        # Hanging ends with brass aglets
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

    # 6. TWIN PARALLEL MICRO-STITCHING (Phase N)
    mesh_stitch = bpy.data.meshes.new("Upper_Stitching_TwinSeam")
    bm_st = bmesh.new()
    num_stitches = 36
    for i in range(num_stitches):
        theta = math.pi * (0.08 + 0.84 * i / (num_stitches - 1))
        x = 0.050 * math.cos(theta)
        y1 = 0.077 + 0.001 * math.sin(theta)
        y2 = 0.079 + 0.001 * math.sin(theta)
        z = 0.054 * math.sin(theta) + 0.003
        for y_seam in [y1, y2]:
            bmesh.ops.create_cube(bm_st, size=1.0)
            for v in bm_st.verts[-8:]:
                v.co = Vector((
                    x + v.co.x * 0.0003,
                    y_seam + v.co.y * 0.0015 * 0.5,
                    z + v.co.z * 0.0003
                ))
    bm_st.to_mesh(mesh_stitch)
    bm_st.free()
    for p in mesh_stitch.polygons:
        p.use_smooth = True
    obj_stitch = bpy.data.objects.new("Upper_Stitching_TwinSeam", mesh_stitch)
    obj_stitch.data.materials.append(materials["stitch"])
    master_col.children["DETAILS"].objects.link(obj_stitch)

    return obj_upper, obj_sole, obj_heel, obj_laces

# ---------------------------------------------------------------------------
# STUDIO RIG & MASTER CYCLES RENDER PIPELINE
# ---------------------------------------------------------------------------

def setup_studio(master_col):
    world = bpy.data.worlds.new("World_Studio")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.050, 0.050, 0.055, 1.0)
        bg.inputs["Strength"].default_value = 0.55
    bpy.context.scene.world = world

    # Seamless Cyclorama Backdrop
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
    key_obj.rotation_euler = (math.radians(45), math.radians(20), math.radians(-50))
    master_col.children["STUDIO"].objects.link(key_obj)

    # Fill Softbox (Cool 6000K, 10W)
    fill_l = bpy.data.lights.new(name="Fill_Light", type='AREA')
    fill_l.energy = 10.0
    fill_l.size = 0.6
    fill_l.color = (0.88, 0.92, 1.0)
    fill_obj = bpy.data.objects.new("Fill_Light", fill_l)
    fill_obj.location = (0.45, 0.12, 0.35)
    fill_obj.rotation_euler = (math.radians(35), math.radians(-20), math.radians(65))
    master_col.children["STUDIO"].objects.link(fill_obj)

    # Rim Strip Light (Crisp 5600K, 16W)
    rim_l = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_l.energy = 16.0
    rim_l.size = 0.12
    rim_l.size_y = 1.2
    rim_l.color = (1.0, 0.98, 0.95)
    rim_obj = bpy.data.objects.new("Rim_Light", rim_l)
    rim_obj.location = (0.18, -0.48, 0.40)
    rim_obj.rotation_euler = (math.radians(-35), math.radians(-10), math.radians(160))
    master_col.children["STUDIO"].objects.link(rim_obj)

def setup_camera():
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
        "loc": (0.000, -0.54, 0.080),
        "target": (0.0, -0.04, 0.050),
        "lens": 85.0,
        "folder": "renders/final"
    },
    "sole_fiddleback": {
        "loc": (0.000, 0.010, -0.48),
        "target": (0.0, 0.010, 0.010),
        "lens": 80.0,
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
    "macro_welt_fudging": {
        "loc": (-0.16, 0.05, 0.050),
        "target": (-0.05, 0.05, 0.010),
        "lens": 140.0,
        "folder": "renders/macro"
    },
    "macro_lacing_throat": {
        "loc": (0.000, -0.04, 0.18),
        "target": (0.0, 0.01, 0.080),
        "lens": 130.0,
        "folder": "renders/macro"
    },
    "macro_heel_stack": {
        "loc": (-0.15, -0.16, 0.060),
        "target": (-0.02, -0.10, 0.015),
        "lens": 130.0,
        "folder": "renders/macro"
    }
}

def render_all_shots(base_dir, cam_obj, target_obj):
    print("=== STARTING MASTER CYCLES RENDER PIPELINE ===")
    for shot_name, cfg in CAMERA_SHOTS.items():
        out_folder = os.path.join(base_dir, cfg["folder"])
        os.makedirs(out_folder, exist_ok=True)
        out_path = os.path.join(out_folder, f"{shot_name}.jpg")

        target_obj.location = Vector(cfg["target"])
        cam_obj.location = Vector(cfg["loc"])
        cam_obj.data.lens = cfg["lens"]

        # Directly compute tracked look-at rotation with world UP_Z
        direction = (target_obj.location - cam_obj.location).normalized()
        cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        bpy.context.view_layer.update()

        bpy.context.scene.render.filepath = out_path
        print(f"Rendering: {shot_name} -> {out_path} ...")
        bpy.ops.render.render(write_still=True)
        print(f"Finished: {shot_name}")
    print("=== ALL MASTER RENDERS COMPLETE ===")

def main():
    base_dir = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001"
    print("Building SHOE_001 Master Footwear Model...")
    clear_scene()
    master_col, subcols = setup_collections()

    materials = {
        "leather": create_leather_material("M_BoxCalf_ImperialEspresso", is_cap_toe=False),
        "toe_cap": create_leather_material("M_BoxCalf_MirrorObsidian", is_cap_toe=True),
        "sole": create_oak_bark_sole_material(),
        "heel": create_stacked_heel_material(),
        "rubber": create_dovetail_rubber_material(),
        "brass": create_brass_material(),
        "laces": create_waxed_laces_material(),
        "lining": create_glove_lining_material(),
        "stitch": create_stitch_material()
    }

    build_shoe_components(master_col, materials)
    setup_studio(master_col)
    cam_obj, target_obj = setup_camera()
    configure_render()

    # Phase S: Declare Blender Master
    master_blend = os.path.join(base_dir, "blender", "master", "SHOE_001_MASTER.blend")
    print(f"Saving Master Blend: {master_blend}")
    bpy.ops.wm.save_as_mainfile(filepath=master_blend)

    # Phase T: Save Web Twin Blend
    web_blend = os.path.join(base_dir, "blender", "master", "SHOE_001_WEB.blend")
    print(f"Saving Web Twin Blend: {web_blend}")
    bpy.ops.wm.save_as_mainfile(filepath=web_blend)

    # Phase Q: Render all master photography shots
    render_all_shots(base_dir, cam_obj, target_obj)

    # Phase W: Export Web GLB (Blender 4.2 LTS compatible arguments)
    web_glb_path = os.path.join(base_dir, "web", "assets", "shoe001_aurelius.glb")
    print(f"Exporting GLB: {web_glb_path}")
    bpy.ops.object.select_all(action='DESELECT')
    for subname in ["UPPER", "LACING", "CONSTRUCTION", "DETAILS"]:
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
    print("Master Pipeline Execution Complete!")

if __name__ == "__main__":
    main()
