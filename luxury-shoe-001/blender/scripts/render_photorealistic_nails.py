"""
Photorealistic Bespoke Shoemaking Heel Nails Generator & Studio Multi-Shot Renderer
Produces high-precision renders matching user reference photo:
1. Nail_Piece_01_Standing_Upright.jpg
2. Nail_Piece_02_Profile_Horizontal.jpg
3. Nail_Piece_03_Macro_Head_Dome.jpg
4. Nail_Piece_04_Macro_Fluted_Shank_Tip.jpg
5. Nail_Piece_05_Underside_CrossSection.jpg
6. Piece_01_Heel_Nails_Studio_Reference.jpg (5-nail scatter matching reference)
7. Piece_01_Heel_Nails.jpg (Updated 9-nail heel horseshoe assembly for the shoe catalog)
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix, Euler

# ---------------------------------------------------------------------------
# 1. GEOMETRY GENERATION: 4-FLUTED DOMED BRASS HEEL NAIL
# ---------------------------------------------------------------------------

def create_fluted_nail_bmesh(
    head_radius=0.0023,       # 4.6mm diameter head
    head_height=0.0014,       # 1.4mm dome height
    head_rim_z=-0.0003,       # rim undercut level
    collar_radius=0.00095,    # 1.9mm diameter collar
    collar_z=-0.0008,         # collar end level
    shank_rib_r=0.00078,      # 1.56mm rib outer diameter
    shank_groove_r=0.00052,   # 1.04mm groove root diameter
    shank_bottom_z=-0.0090,   # fluted section bottom
    tip_z=-0.0120,            # sharp diamond pyramid tip
    num_segs=32,              # 4-fold symmetry (32 = 8 per quadrant)
    num_dome_rings=10,
    num_shank_rings=14,
    num_tip_rings=6
):
    bm = bmesh.new()

    # --- DOMED HEAD ---
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

    # --- 4-FLUTED SHANK ---
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

    # --- 4-FACETED DIAMOND TIP TAPER ---
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
# 2. PBR SHADERS (CARTRIDGE BRASS & FINE STUDIO PAPER)
# ---------------------------------------------------------------------------

def create_brass_material():
    mat = bpy.data.materials.new(name="PBR_Cartridge_Brass")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    
    # Yellow cartridge brass: CuZn30 / CuZn37
    bsdf.inputs["Base Color"].default_value = (0.92, 0.74, 0.28, 1.0)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.16

    # Procedural micro-surface scratches / tumbling texture
    tex_coord = nodes.new(type="ShaderNodeTexCoord")
    mapping = nodes.new(type="ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (80.0, 80.0, 800.0) # elongated along Z axis for wire draw lines
    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])

    noise = nodes.new(type="ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 40.0
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.65
    links.new(mapping.outputs["Vector"], noise.inputs["Vector"])

    bump = nodes.new(type="ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.022
    bump.inputs["Distance"].default_value = 0.0005
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    # Ambient Occlusion node for crevice darkening in the flutes
    ao = nodes.new(type="ShaderNodeAmbientOcclusion")
    ao.inputs["Distance"].default_value = 0.001
    color_ramp = nodes.new(type="ShaderNodeValToRGB")
    color_ramp.color_ramp.elements[0].position = 0.2
    color_ramp.color_ramp.elements[0].color = (0.55, 0.40, 0.14, 1.0) # dark crevice patina
    color_ramp.color_ramp.elements[1].position = 0.8
    color_ramp.color_ramp.elements[1].color = (0.92, 0.74, 0.28, 1.0) # bright polished brass
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
    
    # Warm off-white fine art cotton paper
    bsdf.inputs["Base Color"].default_value = (0.92, 0.91, 0.89, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.88

    # Subtle paper texture grain
    tex_coord = nodes.new(type="ShaderNodeTexCoord")
    noise = nodes.new(type="ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 400.0
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.7
    links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])

    bump = nodes.new(type="ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.015
    bump.inputs["Distance"].default_value = 0.0002
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return mat

# ---------------------------------------------------------------------------
# 3. STUDIO LIGHTING RIG
# ---------------------------------------------------------------------------

def setup_studio_environment():
    world = bpy.data.worlds.new("StudioWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.94, 0.94, 0.94, 1.0)
        bg.inputs["Strength"].default_value = 0.65

    # Key Light: Soft overhead/front-left
    light_key_data = bpy.data.lights.new(name="Key_Light", type="AREA")
    light_key_data.energy = 50.0
    light_key_data.size = 0.25
    light_key_data.color = (1.0, 0.98, 0.95)
    light_key = bpy.data.objects.new("Key_Light", light_key_data)
    light_key.location = (-0.08, -0.10, 0.12)
    light_key.rotation_euler = (math.radians(45), math.radians(-25), math.radians(-30))
    bpy.context.scene.collection.objects.link(light_key)

    # Fill Light: Soft front-right
    light_fill_data = bpy.data.lights.new(name="Fill_Light", type="AREA")
    light_fill_data.energy = 22.0
    light_fill_data.size = 0.35
    light_fill_data.color = (0.95, 0.97, 1.0)
    light_fill = bpy.data.objects.new("Fill_Light", light_fill_data)
    light_fill.location = (0.10, -0.06, 0.10)
    light_fill.rotation_euler = (math.radians(50), math.radians(30), math.radians(45))
    bpy.context.scene.collection.objects.link(light_fill)

    # Rim / Accent Light: Crisp highlight along brass curvature
    light_rim_data = bpy.data.lights.new(name="Rim_Light", type="AREA")
    light_rim_data.energy = 35.0
    light_rim_data.size = 0.15
    light_rim_data.color = (1.0, 0.99, 0.96)
    light_rim = bpy.data.objects.new("Rim_Light", light_rim_data)
    light_rim.location = (0.00, 0.12, 0.08)
    light_rim.rotation_euler = (math.radians(-55), 0, math.radians(180))
    bpy.context.scene.collection.objects.link(light_rim)

# ---------------------------------------------------------------------------
# 4. RENDER SETTINGS (CYCLES MACRO STUDIO)
# ---------------------------------------------------------------------------

def configure_cycles(samples=128):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    prefs = bpy.context.preferences.addons.get("cycles")
    if prefs:
        cprefs = prefs.preferences
        cprefs.compute_device_type = "CUDA"
        for d in cprefs.devices:
            d.use = True
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 95
    scene.view_settings.view_transform = "AgX" # High dynamic range filmic tone mapper
    scene.view_settings.look = "AgX - Medium High Contrast"

print("Setup completed.")

# ---------------------------------------------------------------------------
# 5. CAMERA & MULTI-SHOT COMPOSITION RUNNER
# ---------------------------------------------------------------------------

def create_camera(name="Macro_Camera", location=(0, -0.045, 0.025), target=(0, 0, 0.005), focal_length=90.0, fstop=4.5):
    cam_data = bpy.data.cameras.new(name=name)
    cam_data.lens = focal_length
    cam_data.dof.use_dof = True
    cam_data.dof.aperture_fstop = fstop
    
    # Target empty for precision focus
    target_empty = bpy.data.objects.new(name + "_Target", None)
    target_empty.location = target
    bpy.context.scene.collection.objects.link(target_empty)
    cam_data.dof.focus_object = target_empty

    cam_obj = bpy.data.objects.new(name, cam_data)
    cam_obj.location = location
    bpy.context.scene.collection.objects.link(cam_obj)

    # Track-to constraint
    track = cam_obj.constraints.new(type="TRACK_TO")
    track.target = target_empty
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    bpy.context.scene.camera = cam_obj
    return cam_obj, target_empty

def create_paper_ground(paper_mat):
    # Studio ground plane with subtle paper texture
    plane_mesh = bpy.data.meshes.new("Paper_Ground")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=4, y_segments=4, size=0.5)
    bm.to_mesh(plane_mesh)
    bm.free()
    plane_obj = bpy.data.objects.new("Paper_Ground", plane_mesh)
    plane_obj.location = (0, 0, 0)
    plane_obj.data.materials.append(paper_mat)
    bpy.context.scene.collection.objects.link(plane_obj)
    return plane_obj

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def render_all_nail_views(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # -----------------------------------------------------------------------
    # SHOT 1: Single Nail Standing Upright (Full Macro View)
    # -----------------------------------------------------------------------
    clear_scene()
    configure_cycles(samples=128)
    setup_studio_environment()
    brass_mat = create_brass_material()
    paper_mat = create_paper_material()
    create_paper_ground(paper_mat)

    nail = create_nail_object("Nail_Standing")
    nail.data.materials.append(brass_mat)
    # Position: Tip resting on ground at Z=0. Since tip is at Z=-0.012 in local coordinates, translate Z +0.012
    nail.location = (0, 0, 0.0120)
    nail.rotation_euler = (math.radians(2.5), math.radians(-1.0), math.radians(15))
    bpy.context.scene.collection.objects.link(nail)

    cam, tgt = create_camera(
        location=(0.0, -0.038, 0.018),
        target=(0.0, 0.0, 0.006),
        focal_length=95.0,
        fstop=4.8
    )
    shot1_path = os.path.join(output_dir, "Nail_Piece_01_Standing_Upright.jpg")
    bpy.context.scene.render.filepath = shot1_path
    bpy.ops.render.render(write_still=True)
    print(f"[1/7] Rendered: {shot1_path}")

    # -----------------------------------------------------------------------
    # SHOT 2: Single Nail Profile Horizontal (Lying Flat)
    # -----------------------------------------------------------------------
    clear_scene()
    configure_cycles(samples=128)
    setup_studio_environment()
    brass_mat = create_brass_material()
    paper_mat = create_paper_material()
    create_paper_ground(paper_mat)

    nail2 = create_nail_object("Nail_Horizontal")
    nail2.data.materials.append(brass_mat)
    # Rotate 90 deg around Y so it lies along X axis
    # Radius of head is 0.0023, so center of head is at Z ~ 0.0023
    nail2.location = (-0.005, 0.0, 0.0023)
    nail2.rotation_euler = (math.radians(2), math.radians(88), math.radians(25))
    bpy.context.scene.collection.objects.link(nail2)

    cam2, tgt2 = create_camera(
        location=(0.005, -0.032, 0.016),
        target=(0.0, 0.0, 0.002),
        focal_length=105.0,
        fstop=4.0
    )
    shot2_path = os.path.join(output_dir, "Nail_Piece_02_Profile_Horizontal.jpg")
    bpy.context.scene.render.filepath = shot2_path
    bpy.ops.render.render(write_still=True)
    print(f"[2/7] Rendered: {shot2_path}")

    # -----------------------------------------------------------------------
    # SHOT 3: Macro Close-Up on Domed Head (Brass Sheen & Collar)
    # -----------------------------------------------------------------------
    clear_scene()
    configure_cycles(samples=128)
    setup_studio_environment()
    brass_mat = create_brass_material()
    paper_mat = create_paper_material()
    create_paper_ground(paper_mat)

    nail3 = create_nail_object("Nail_Head_Macro")
    nail3.data.materials.append(brass_mat)
    nail3.location = (0, 0, 0.0120)
    nail3.rotation_euler = (math.radians(12), math.radians(-8), math.radians(40))
    bpy.context.scene.collection.objects.link(nail3)

    cam3, tgt3 = create_camera(
        location=(0.006, -0.018, 0.018),
        target=(0.0, 0.0, 0.0125),
        focal_length=120.0,
        fstop=3.2
    )
    shot3_path = os.path.join(output_dir, "Nail_Piece_03_Macro_Head_Dome.jpg")
    bpy.context.scene.render.filepath = shot3_path
    bpy.ops.render.render(write_still=True)
    print(f"[3/7] Rendered: {shot3_path}")

    # -----------------------------------------------------------------------
    # SHOT 4: Macro Close-Up on 4-Fluted Shank & 4-Faceted Diamond Tip
    # -----------------------------------------------------------------------
    clear_scene()
    configure_cycles(samples=128)
    setup_studio_environment()
    brass_mat = create_brass_material()
    paper_mat = create_paper_material()
    create_paper_ground(paper_mat)

    nail4 = create_nail_object("Nail_Tip_Macro")
    nail4.data.materials.append(brass_mat)
    nail4.location = (0, 0, 0.0120)
    nail4.rotation_euler = (math.radians(-35), math.radians(45), math.radians(-15))
    bpy.context.scene.collection.objects.link(nail4)

    cam4, tgt4 = create_camera(
        location=(0.008, -0.020, 0.008),
        target=(0.001, 0.0, 0.003),
        focal_length=120.0,
        fstop=3.2
    )
    shot4_path = os.path.join(output_dir, "Nail_Piece_04_Macro_Fluted_Shank_Tip.jpg")
    bpy.context.scene.render.filepath = shot4_path
    bpy.ops.render.render(write_still=True)
    print(f"[4/7] Rendered: {shot4_path}")

    # -----------------------------------------------------------------------
    # SHOT 5: Underside View (Showing Rim Undercut & 4-Lobed Cross Section)
    # -----------------------------------------------------------------------
    clear_scene()
    configure_cycles(samples=128)
    setup_studio_environment()
    brass_mat = create_brass_material()
    paper_mat = create_paper_material()
    create_paper_ground(paper_mat)

    nail5 = create_nail_object("Nail_Underside")
    nail5.data.materials.append(brass_mat)
    # Invert so head is tilted showing underside
    nail5.location = (0, 0, 0.006)
    nail5.rotation_euler = (math.radians(135), math.radians(20), math.radians(30))
    bpy.context.scene.collection.objects.link(nail5)

    cam5, tgt5 = create_camera(
        location=(0.0, -0.025, 0.015),
        target=(0.0, 0.0, 0.006),
        focal_length=105.0,
        fstop=3.8
    )
    shot5_path = os.path.join(output_dir, "Nail_Piece_05_Underside_CrossSection.jpg")
    bpy.context.scene.render.filepath = shot5_path
    bpy.ops.render.render(write_still=True)
    print(f"[5/7] Rendered: {shot5_path}")

    # -----------------------------------------------------------------------
    # SHOT 6: The 5-Nail Studio Composition (Replicating User Reference Photo)
    # -----------------------------------------------------------------------
    clear_scene()
    configure_cycles(samples=160)
    setup_studio_environment()
    brass_mat = create_brass_material()
    paper_mat = create_paper_material()
    create_paper_ground(paper_mat)

    # Recreate the 5 nail positions matching media_1789391033927.jpg
    # 1. Standing upright (center-top)
    n1 = create_nail_object("Nail_1_Standing_Center")
    n1.data.materials.append(brass_mat)
    n1.location = (0.003, 0.006, 0.0120)
    n1.rotation_euler = (math.radians(3.0), math.radians(-1.5), math.radians(20))
    bpy.context.scene.collection.objects.link(n1)

    # 2. Left nail: angled pointing down-left, head on right
    n2 = create_nail_object("Nail_2_Angled_Left")
    n2.data.materials.append(brass_mat)
    n2.location = (-0.014, 0.002, 0.0022)
    n2.rotation_euler = (math.radians(-8), math.radians(82), math.radians(165))
    bpy.context.scene.collection.objects.link(n2)

    # 3. Bottom-left nail: tilted with head facing forward-right
    n3 = create_nail_object("Nail_3_Tilted_Bottom_Left")
    n3.data.materials.append(brass_mat)
    n3.location = (-0.008, -0.006, 0.0024)
    n3.rotation_euler = (math.radians(28), math.radians(75), math.radians(50))
    bpy.context.scene.collection.objects.link(n3)

    # 4. Bottom-right nail: horizontal pointing left
    n4 = create_nail_object("Nail_4_Horizontal_Bottom_Right")
    n4.data.materials.append(brass_mat)
    n4.location = (0.008, -0.010, 0.0022)
    n4.rotation_euler = (math.radians(4), math.radians(88), math.radians(185))
    bpy.context.scene.collection.objects.link(n4)

    # 5. Right nail: angled pointing down-left
    n5 = create_nail_object("Nail_5_Angled_Right")
    n5.data.materials.append(brass_mat)
    n5.location = (0.011, 0.000, 0.0023)
    n5.rotation_euler = (math.radians(-12), math.radians(80), math.radians(-130))
    bpy.context.scene.collection.objects.link(n5)

    # Camera matching the overhead 50-degree macro angle of the reference photo
    cam6, tgt6 = create_camera(
        location=(0.0, -0.042, 0.040),
        target=(0.0, -0.002, 0.004),
        focal_length=85.0,
        fstop=4.5
    )
    shot6_path = os.path.join(output_dir, "Piece_01_Heel_Nails_Studio_Reference.jpg")
    bpy.context.scene.render.filepath = shot6_path
    bpy.ops.render.render(write_still=True)
    print(f"[6/7] Rendered: {shot6_path}")

    # -----------------------------------------------------------------------
    # SHOT 7: Piece_01_Heel_Nails.jpg (The 9-Nail Horseshoe Shoe Assembly)
    # -----------------------------------------------------------------------
    clear_scene()
    configure_cycles(samples=140)
    setup_studio_environment()
    brass_mat = create_brass_material()
    paper_mat = create_paper_material()
    create_paper_ground(paper_mat)

    # 9 fluted domed nails in authentic horseshoe curve matching shoe heel
    nail_coords = [
        (-0.018, -0.015, 0.012), (-0.020, -0.005, 0.012), (-0.018,  0.007, 0.012),
        (-0.010, -0.020, 0.012), ( 0.000, -0.021, 0.012), ( 0.010, -0.020, 0.012),
        ( 0.018, -0.015, 0.012), ( 0.020, -0.005, 0.012), ( 0.018,  0.007, 0.012)
    ]
    for idx, (nx, ny, nz) in enumerate(nail_coords):
        n = create_nail_object(f"Shoe_Heel_Nail_{idx+1}")
        n.data.materials.append(brass_mat)
        n.location = (nx, ny, nz)
        # Invert so heads face downward or upward as in shoe assembly
        n.rotation_euler = (math.radians(180), 0, math.radians(idx * 20))
        bpy.context.scene.collection.objects.link(n)

    cam7, tgt7 = create_camera(
        location=(0.0, -0.065, 0.045),
        target=(0.0, -0.005, 0.006),
        focal_length=80.0,
        fstop=4.0
    )
    shot7_path = os.path.join(output_dir, "Piece_01_Heel_Nails.jpg")
    bpy.context.scene.render.filepath = shot7_path
    bpy.ops.render.render(write_still=True)
    print(f"[7/7] Rendered: {shot7_path}")

if __name__ == "__main__":
    out_dir = r"C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001\renders\pieces\nails"
    render_all_nail_views(out_dir)
