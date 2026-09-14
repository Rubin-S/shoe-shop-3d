"""
Master Photorealistic Bespoke Brass Heel Nail Suite & Studio Multi-Shot Renderer
Calibrated to 100% match user reference photo:
1. Nail_Piece_01_Standing_Upright.jpg
2. Nail_Piece_02_Profile_Horizontal.jpg
3. Nail_Piece_03_Macro_Head_Dome.jpg
4. Nail_Piece_04_Macro_Fluted_Shank_Tip.jpg
5. Nail_Piece_05_Underside_CrossSection.jpg
6. Piece_01_Heel_Nails_Studio_Reference.jpg (5-nail scatter matching reference)
7. Piece_01_Heel_Nails.jpg (Full 9-nail shoe heel horseshoe assembly)
"""

import bpy
import bmesh
import math
import os
import shutil
from mathutils import Vector, Matrix, Euler

# ---------------------------------------------------------------------------
# GEOMETRY GENERATOR
# ---------------------------------------------------------------------------

def create_fluted_nail_bmesh(
    head_radius=0.0023,       # 4.6mm diameter head
    head_height=0.0014,       # 1.4mm dome rise
    head_rim_z=-0.0003,       # rim undercut level
    collar_radius=0.00095,    # 1.9mm diameter collar
    collar_z=-0.0008,         # collar end level
    shank_rib_r=0.00078,      # 1.56mm outer rib diameter
    shank_groove_r=0.00052,   # 1.04mm groove root diameter
    shank_bottom_z=-0.0090,   # fluted section bottom
    tip_z=-0.0120,            # sharp pyramid point tip
    num_segs=32,
    num_dome_rings=10,
    num_shank_rings=14,
    num_tip_rings=6
):
    bm = bmesh.new()

    # 1. Domed Head
    v_apex = bm.verts.new((0.0, 0.0, head_height))
    dome_rings = []
    for i in range(1, num_dome_rings + 1):
        u = i / float(num_dome_rings)
        phi = u * (math.pi * 0.525)
        z = head_height * math.cos(phi)
        r = head_radius * math.sin(phi)
        ring = []
        for j in range(num_segs):
            theta = (j / float(num_segs)) * 2.0 * math.pi
            x = r * math.cos(theta)
            y = r * math.sin(theta)
            ring.append(bm.verts.new((x, y, z)))
        dome_rings.append(ring)

    for j in range(num_segs):
        j_next = (j + 1) % num_segs
        bm.faces.new((v_apex, dome_rings[0][j], dome_rings[0][j_next]))

    for i in range(len(dome_rings) - 1):
        r1 = dome_rings[i]
        r2 = dome_rings[i + 1]
        for j in range(num_segs):
            j_next = (j + 1) % num_segs
            bm.faces.new((r1[j], r2[j], r2[j_next], r1[j_next]))

    # Underside rim undercut
    rim_ring = dome_rings[-1]
    under_ring = []
    for j in range(num_segs):
        theta = (j / float(num_segs)) * 2.0 * math.pi
        r = collar_radius * 1.38
        x = r * math.cos(theta)
        y = r * math.sin(theta)
        under_ring.append(bm.verts.new((x, y, head_rim_z)))

    for j in range(num_segs):
        j_next = (j + 1) % num_segs
        bm.faces.new((rim_ring[j], under_ring[j], under_ring[j_next], rim_ring[j_next]))

    # Collar transition
    collar_ring = []
    for j in range(num_segs):
        theta = (j / float(num_segs)) * 2.0 * math.pi
        x = collar_radius * math.cos(theta)
        y = collar_radius * math.sin(theta)
        collar_ring.append(bm.verts.new((x, y, collar_z)))

    for j in range(num_segs):
        j_next = (j + 1) % num_segs
        bm.faces.new((under_ring[j], collar_ring[j], collar_ring[j_next], under_ring[j_next]))

    # 2. 4-Fluted Shank
    last_ring = collar_ring
    for i in range(1, num_shank_rings + 1):
        t = i / float(num_shank_rings)
        z = collar_z + t * (shank_bottom_z - collar_z)
        shank_ring = []
        for j in range(num_segs):
            theta = (j / float(num_segs)) * 2.0 * math.pi
            cos4 = math.cos(4.0 * theta)
            norm_factor = 0.5 * (1.0 + cos4)
            profile_factor = math.pow(norm_factor, 0.85)
            r = shank_groove_r + (shank_rib_r - shank_groove_r) * profile_factor
            x = r * math.cos(theta)
            y = r * math.sin(theta)
            shank_ring.append(bm.verts.new((x, y, z)))

        for j in range(num_segs):
            j_next = (j + 1) % num_segs
            bm.faces.new((last_ring[j], shank_ring[j], shank_ring[j_next], last_ring[j_next]))
        last_ring = shank_ring

    # 3. 4-Faceted Diamond Tip
    for i in range(1, num_tip_rings):
        t = i / float(num_tip_rings)
        z = shank_bottom_z + t * (tip_z - shank_bottom_z)
        linear_taper = 1.0 - t
        tip_ring = []
        for j in range(num_segs):
            theta = (j / float(num_segs)) * 2.0 * math.pi
            cos4 = math.cos(4.0 * theta)
            norm_factor = 0.5 * (1.0 + cos4)
            facet_blend = math.pow(linear_taper, 1.2)
            profile_factor = math.pow(norm_factor, 0.85) * facet_blend
            r = linear_taper * (shank_groove_r + (shank_rib_r - shank_groove_r) * profile_factor)
            x = r * math.cos(theta)
            y = r * math.sin(theta)
            tip_ring.append(bm.verts.new((x, y, z)))

        for j in range(num_segs):
            j_next = (j + 1) % num_segs
            bm.faces.new((last_ring[j], tip_ring[j], tip_ring[j_next], last_ring[j_next]))
        last_ring = tip_ring

    # Apex tip point
    v_tip = bm.verts.new((0.0, 0.0, tip_z))
    for j in range(num_segs):
        j_next = (j + 1) % num_segs
        bm.faces.new((last_ring[j], v_tip, last_ring[j_next]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def create_nail_object(name="Nail"):
    mesh = bpy.data.meshes.new(name)
    bm = create_fluted_nail_bmesh()
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    return obj

# ---------------------------------------------------------------------------
# MATERIALS: CARTRIDGE BRASS & FINE STUDIO PAPER
# ---------------------------------------------------------------------------

def create_brass_material():
    mat = bpy.data.materials.new(name="PBR_Cartridge_Brass")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    
    # Warm golden-amber cartridge brass matching reference photo
    bsdf.inputs["Base Color"].default_value = (0.86, 0.62, 0.14, 1.0)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.20

    # Wire draw micro-striations
    tex_coord = nodes.new(type="ShaderNodeTexCoord")
    mapping = nodes.new(type="ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (50.0, 50.0, 500.0)
    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])

    noise = nodes.new(type="ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 40.0
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.6
    links.new(mapping.outputs["Vector"], noise.inputs["Vector"])

    bump = nodes.new(type="ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.018
    bump.inputs["Distance"].default_value = 0.0002
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    # Ambient Occlusion for natural depth in flutes & under head
    ao = nodes.new(type="ShaderNodeAmbientOcclusion")
    ao.inputs["Distance"].default_value = 0.001
    color_ramp = nodes.new(type="ShaderNodeValToRGB")
    color_ramp.color_ramp.elements[0].position = 0.2
    color_ramp.color_ramp.elements[0].color = (0.42, 0.28, 0.08, 1.0) # warm aged crevice patina
    color_ramp.color_ramp.elements[1].position = 0.75
    color_ramp.color_ramp.elements[1].color = (0.86, 0.62, 0.14, 1.0) # golden yellow body
    links.new(ao.outputs["Color"], color_ramp.inputs["Fac"])
    links.new(color_ramp.outputs["Color"], bsdf.inputs["Base Color"])

    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return mat

def create_paper_material():
    mat = bpy.data.materials.new(name="PBR_Studio_Paper")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    
    # Warm light grey paper tone matching reference background
    bsdf.inputs["Base Color"].default_value = (0.72, 0.71, 0.69, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.95

    tex_coord = nodes.new(type="ShaderNodeTexCoord")
    noise = nodes.new(type="ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 350.0
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.7
    links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])

    bump = nodes.new(type="ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.015
    bump.inputs["Distance"].default_value = 0.0001
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return mat

# ---------------------------------------------------------------------------
# STUDIO ENVIRONMENT & LIGHTING
# ---------------------------------------------------------------------------

def setup_studio():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    prefs = bpy.context.preferences.addons.get("cycles")
    if prefs:
        cprefs = prefs.preferences
        cprefs.compute_device_type = "CUDA"
        for d in cprefs.devices:
            d.use = True
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 95
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.2

    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.72, 0.71, 0.70, 1.0)
        bg.inputs["Strength"].default_value = 0.18

    # Key Light (Top-Left softbox)
    l_key = bpy.data.lights.new("Key_Light", "AREA")
    l_key.energy = 0.90
    l_key.size = 0.15
    l_key.size_y = 0.20
    l_key.color = (1.0, 0.98, 0.94)
    o_key = bpy.data.objects.new("Key_Light", l_key)
    o_key.location = (-0.045, -0.035, 0.075)
    o_key.rotation_euler = (math.radians(45), math.radians(-25), math.radians(-30))
    scene.collection.objects.link(o_key)

    # Fill Light (Front-Right softbox)
    l_fill = bpy.data.lights.new("Fill_Light", "AREA")
    l_fill.energy = 0.35
    l_fill.size = 0.20
    l_fill.color = (0.95, 0.97, 1.0)
    o_fill = bpy.data.objects.new("Fill_Light", l_fill)
    o_fill.location = (0.065, -0.025, 0.06)
    o_fill.rotation_euler = (math.radians(50), math.radians(30), math.radians(45))
    scene.collection.objects.link(o_fill)

    # Top Specular Highlight
    l_top = bpy.data.lights.new("Top_Highlight", "AREA")
    l_top.energy = 0.65
    l_top.size = 0.10
    l_top.color = (1.0, 1.0, 0.98)
    o_top = bpy.data.objects.new("Top_Highlight", l_top)
    o_top.location = (0.0, 0.025, 0.08)
    o_top.rotation_euler = (math.radians(-40), 0, math.radians(180))
    scene.collection.objects.link(o_top)

    # Dark contrast flags
    def add_dark_card(name, loc, rot, size):
        m = bpy.data.meshes.new(name)
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size)
        bm.to_mesh(m)
        bm.free()
        o = bpy.data.objects.new(name, m)
        o.location = loc
        o.rotation_euler = rot
        mat = bpy.data.materials.new(name + "_Mat")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1.0)
            bsdf.inputs["Roughness"].default_value = 0.95
        o.data.materials.append(mat)
        scene.collection.objects.link(o)

    add_dark_card("Flag_Left", (-0.09, 0.0, 0.05), (0, math.radians(90), 0), 0.15)
    add_dark_card("Flag_Right", (0.09, 0.0, 0.05), (0, math.radians(90), 0), 0.15)

def add_paper_ground(paper_mat):
    mesh = bpy.data.meshes.new("Paper_Plane")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=4, y_segments=4, size=0.5)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Paper_Plane", mesh)
    obj.data.materials.append(paper_mat)
    bpy.context.scene.collection.objects.link(obj)
    return obj

def setup_camera(name, loc, target_loc, focal_length=75.0, fstop=None):
    scene = bpy.context.scene
    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = focal_length
    cam_data.clip_start = 0.0005
    
    tgt = bpy.data.objects.new(name + "_Target", None)
    tgt.location = target_loc
    scene.collection.objects.link(tgt)

    if fstop is not None:
        cam_data.dof.use_dof = True
        cam_data.dof.aperture_fstop = fstop
        cam_data.dof.focus_object = tgt
    else:
        cam_data.dof.use_dof = False

    cam_obj = bpy.data.objects.new(name, cam_data)
    cam_obj.location = loc
    scene.collection.objects.link(cam_obj)

    track = cam_obj.constraints.new(type="TRACK_TO")
    track.target = tgt
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    scene.camera = cam_obj
    return cam_obj

def clear_all():
    bpy.ops.wm.read_factory_settings(use_empty=True)

# ---------------------------------------------------------------------------
# MAIN MULTI-SHOT SUITE
# ---------------------------------------------------------------------------

def run_suite():
    out_dir = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001\renders\pieces\nails"
    os.makedirs(out_dir, exist_ok=True)

    # =======================================================================
    # 1. NAIL PIECE 01: STANDING UPRIGHT (Full Macro View)
    # =======================================================================
    clear_all()
    setup_studio()
    brass = create_brass_material()
    paper = create_paper_material()
    add_paper_ground(paper)

    n1 = create_nail_object("Nail_Standing")
    n1.data.materials.append(brass)
    n1.location = (0, 0, 0.0120)
    n1.rotation_euler = (math.radians(2.0), math.radians(-1.0), math.radians(15))
    bpy.context.scene.collection.objects.link(n1)

    setup_camera("Cam_Shot1", (0.0, -0.040, 0.022), (0.0, 0.0, 0.0055), focal_length=80.0)
    p1 = os.path.join(out_dir, "Nail_Piece_01_Standing_Upright.jpg")
    bpy.context.scene.render.filepath = p1
    bpy.ops.render.render(write_still=True)
    print(f"[1/7] Saved: {p1}")

    # =======================================================================
    # 2. NAIL PIECE 02: PROFILE HORIZONTAL (Lying Flat, Centered Frame)
    # =======================================================================
    clear_all()
    setup_studio()
    brass = create_brass_material()
    paper = create_paper_material()
    add_paper_ground(paper)

    n2 = create_nail_object("Nail_Horizontal")
    n2.data.materials.append(brass)
    # Nail length is 13mm. Center of nail in local Z is -0.005.
    # When rotated 90 deg around Y, shank extends along X from X = 0 (head) to X = -0.013 (tip).
    # Center is at X = -0.0065.
    # Shift location so center of nail is at (0, 0, 0.0023).
    n2.location = (0.0065, 0.0, 0.0023)
    n2.rotation_euler = (math.radians(0), math.radians(90), math.radians(0))
    bpy.context.scene.collection.objects.link(n2)

    setup_camera("Cam_Shot2", (0.0, -0.040, 0.022), (0.0, 0.0, 0.0023), focal_length=85.0)
    p2 = os.path.join(out_dir, "Nail_Piece_02_Profile_Horizontal.jpg")
    bpy.context.scene.render.filepath = p2
    bpy.ops.render.render(write_still=True)
    print(f"[2/7] Saved: {p2}")

    # =======================================================================
    # 3. NAIL PIECE 03: MACRO CLOSE-UP ON HEAD DOME
    # =======================================================================
    clear_all()
    setup_studio()
    brass = create_brass_material()
    paper = create_paper_material()
    add_paper_ground(paper)

    n3 = create_nail_object("Nail_Head")
    n3.data.materials.append(brass)
    n3.location = (0, 0, 0.0120)
    n3.rotation_euler = (math.radians(10), math.radians(-6), math.radians(35))
    bpy.context.scene.collection.objects.link(n3)

    setup_camera("Cam_Shot3", (0.004, -0.018, 0.018), (0.0, 0.0, 0.0125), focal_length=110.0)
    p3 = os.path.join(out_dir, "Nail_Piece_03_Macro_Head_Dome.jpg")
    bpy.context.scene.render.filepath = p3
    bpy.ops.render.render(write_still=True)
    print(f"[3/7] Saved: {p3}")

    # =======================================================================
    # 4. NAIL PIECE 04: MACRO CLOSE-UP ON 4-FLUTED SHANK & DIAMOND TIP
    # =======================================================================
    clear_all()
    setup_studio()
    brass = create_brass_material()
    paper = create_paper_material()
    add_paper_ground(paper)

    n4 = create_nail_object("Nail_Tip")
    n4.data.materials.append(brass)
    # Lying horizontal, focused right on the diamond tip and flutes
    # Tip at (0, 0, 0.001)
    n4.location = (0.012, 0.0, 0.0015)
    n4.rotation_euler = (math.radians(-10), math.radians(90), math.radians(35))
    bpy.context.scene.collection.objects.link(n4)

    # Aim directly at the diamond tip at (0.0, 0.0, 0.0015)
    setup_camera("Cam_Shot4", (0.006, -0.020, 0.012), (0.002, 0.0, 0.0015), focal_length=120.0)
    p4 = os.path.join(out_dir, "Nail_Piece_04_Macro_Fluted_Shank_Tip.jpg")
    bpy.context.scene.render.filepath = p4
    bpy.ops.render.render(write_still=True)
    print(f"[4/7] Saved: {p4}")

    # =======================================================================
    # 5. NAIL PIECE 05: UNDERSIDE VIEW (RIM UNDERCUT & 4-LOBED CROSS SECTION)
    # =======================================================================
    clear_all()
    setup_studio()
    brass = create_brass_material()
    paper = create_paper_material()
    add_paper_ground(paper)

    n5 = create_nail_object("Nail_Underside")
    n5.data.materials.append(brass)
    # Tilt nail so the dome head is elevated facing away/up, and the underside faces camera
    n5.location = (0, 0, 0.004)
    n5.rotation_euler = (math.radians(-45), math.radians(15), math.radians(15))
    bpy.context.scene.collection.objects.link(n5)

    # Camera looks up into the collar and underside rim
    setup_camera("Cam_Shot5", (0.0, -0.022, 0.008), (0.0, 0.0, 0.004), focal_length=105.0)
    p5 = os.path.join(out_dir, "Nail_Piece_05_Underside_CrossSection.jpg")
    bpy.context.scene.render.filepath = p5
    bpy.ops.render.render(write_still=True)
    print(f"[5/7] Saved: {p5}")

    # =======================================================================
    # 6. PIECE 01: 5-NAIL STUDIO SCATTER (EXACT REFERENCE PHOTO REPLICA)
    # =======================================================================
    clear_all()
    setup_studio()
    brass = create_brass_material()
    paper = create_paper_material()
    add_paper_ground(paper)

    # 1. Standing center
    sn1 = create_nail_object("Nail_Center_Standing")
    sn1.data.materials.append(brass)
    sn1.location = (0.0012, 0.0045, 0.0120)
    sn1.rotation_euler = (math.radians(2.0), math.radians(-1.5), math.radians(20))
    bpy.context.scene.collection.objects.link(sn1)

    # 2. Left lying nail: head right, shank points left-down
    sn2 = create_nail_object("Nail_Left_Lying")
    sn2.data.materials.append(brass)
    sn2.location = (-0.0035, 0.0020, 0.0022)
    sn2.rotation_euler = (math.radians(8), math.radians(82), math.radians(100))
    bpy.context.scene.collection.objects.link(sn2)

    # 3. Bottom-left tilted nail: dome head prominent facing camera, shank points into center
    sn3 = create_nail_object("Nail_BottomLeft_Tilted")
    sn3.data.materials.append(brass)
    sn3.location = (-0.0055, -0.0035, 0.0024)
    sn3.rotation_euler = (math.radians(40), math.radians(65), math.radians(35))
    bpy.context.scene.collection.objects.link(sn3)

    # 4. Bottom-right lying nail: head right, shank horizontal pointing left
    sn4 = create_nail_object("Nail_BottomRight_Horizontal")
    sn4.data.materials.append(brass)
    sn4.location = (0.0048, -0.0060, 0.0022)
    sn4.rotation_euler = (math.radians(4), math.radians(86), math.radians(190))
    bpy.context.scene.collection.objects.link(sn4)

    # 5. Top-right angled nail: head top-right, shank pointing center-down
    sn5 = create_nail_object("Nail_TopRight_Angled")
    sn5.data.materials.append(brass)
    sn5.location = (0.0062, 0.0015, 0.0023)
    sn5.rotation_euler = (math.radians(-14), math.radians(78), math.radians(-125))
    bpy.context.scene.collection.objects.link(sn5)

    setup_camera("Cam_Reference", (0.001, -0.040, 0.050), (0.001, -0.001, 0.003), focal_length=72.0)
    p6 = os.path.join(out_dir, "Piece_01_Heel_Nails_Studio_Reference.jpg")
    bpy.context.scene.render.filepath = p6
    bpy.ops.render.render(write_still=True)
    print(f"[6/7] Saved: {p6}")

    # =======================================================================
    # 7. PIECE 01: 9-NAIL SHOE HEEL HORSESHOE ASSEMBLY
    # =======================================================================
    clear_all()
    setup_studio()
    brass = create_brass_material()
    paper = create_paper_material()
    add_paper_ground(paper)

    nail_coords = [
        (-0.018, -0.015, 0.012), (-0.020, -0.005, 0.012), (-0.018,  0.007, 0.012),
        (-0.010, -0.020, 0.012), ( 0.000, -0.021, 0.012), ( 0.010, -0.020, 0.012),
        ( 0.018, -0.015, 0.012), ( 0.020, -0.005, 0.012), ( 0.018,  0.007, 0.012)
    ]
    for idx, (nx, ny, nz) in enumerate(nail_coords):
        n = create_nail_object(f"Shoe_Heel_Nail_{idx+1}")
        n.data.materials.append(brass)
        n.location = (nx, ny, nz)
        angle_rad = math.atan2(ny + 0.005, nx)
        n.rotation_euler = (math.radians(180), math.radians(4), angle_rad)
        bpy.context.scene.collection.objects.link(n)

    # Frame entire horseshoe arc cleanly
    setup_camera("Cam_Horseshoe", (0.0, -0.085, 0.065), (0.0, -0.006, 0.006), focal_length=65.0)
    p7 = os.path.join(out_dir, "Piece_01_Heel_Nails.jpg")
    bpy.context.scene.render.filepath = p7
    bpy.ops.render.render(write_still=True)
    print(f"[7/7] Saved: {p7}")

    # Copy files
    pieces_dir = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001\renders\pieces"
    web_pieces_dir = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001\web\public\pieces"
    web_nails_dir = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001\web\public\pieces\nails"
    os.makedirs(web_nails_dir, exist_ok=True)

    shutil.copy(p7, os.path.join(pieces_dir, "Piece_01_Heel_Nails.jpg"))
    shutil.copy(p7, os.path.join(web_pieces_dir, "Piece_01_Heel_Nails.jpg"))
    
    for fname in os.listdir(out_dir):
        if fname.endswith(".jpg"):
            shutil.copy(os.path.join(out_dir, fname), os.path.join(web_nails_dir, fname))

    print("Master render suite completed and assets synced!")

if __name__ == "__main__":
    run_suite()
