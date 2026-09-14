
import bpy
import bmesh
import math
import os
import shutil
from mathutils import Vector, Matrix

BASE_DIR = os.path.abspath('luxury-shoe-001')
OUTPUT_DIR = os.path.join(BASE_DIR, 'renders', 'pieces', 'outsole')
WEB_DIR = os.path.join(BASE_DIR, 'web', 'public', 'pieces', 'outsole')
MODEL_DIR = os.path.join(BASE_DIR, 'models', 'pieces')
WEB_MODEL_DIR = os.path.join(BASE_DIR, 'web', 'public', 'models', 'pieces')
MASTER_PIECE_IMG = os.path.join(BASE_DIR, 'renders', 'pieces', 'Piece_04_Outsole.jpg')
WEB_PIECE_IMG = os.path.join(BASE_DIR, 'web', 'public', 'pieces', 'Piece_04_Outsole.jpg')
BRAIN_DIR = r'C:\Users\doyen\.gemini\antigravity\brain\2ed145f7-63b4-4eb7-ae5d-17c50948cbc7'

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(WEB_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(WEB_MODEL_DIR, exist_ok=True)

# Master Stations: Size 10.5 / 294mm length
STATIONS_REF = [
    (-0.126, 0.0240, 0.0240, 0.0262, 0.0052, 0.00), # 0 Heel rear
    (-0.105, 0.0310, 0.0310, 0.0262, 0.0052, 0.00), # 1 Heel seat apex
    (-0.082, 0.0320, 0.0320, 0.0262, 0.0052, 0.00), # 2 Heel breast
    (-0.055, 0.0285, 0.0265, 0.0225, 0.0033, 0.70), # 3 Waist rear
    (-0.025, 0.0265, 0.0245, 0.0180, 0.0029, 1.00), # 4 Waist apex (fiddleback keel)
    ( 0.005, 0.0350, 0.0310, 0.0130, 0.0036, 0.60), # 5 Instep throat entry
    ( 0.035, 0.0460, 0.0420, 0.0080, 0.0050, 0.00), # 6 Ball rear
    ( 0.055, 0.0540, 0.0500, 0.0052, 0.0052, 0.00), # 7 Ball pivot (touches Z=0)
    ( 0.085, 0.0500, 0.0460, 0.0075, 0.0052, 0.00), # 8 Cap-toe seam
    ( 0.115, 0.0430, 0.0390, 0.0110, 0.0052, 0.00), # 9 Toe vamp
    ( 0.142, 0.0340, 0.0300, 0.0145, 0.0052, 0.00), # 10 Chisel shoulder
    ( 0.158, 0.0230, 0.0210, 0.0175, 0.0052, 0.00), # 11 Chisel cliff dive
    ( 0.168, 0.0150, 0.0130, 0.0205, 0.0052, 0.00)  # 12 Toe tip (15.5mm toe spring)
]

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

def interpolate_station(y):
    if y <= STATIONS_REF[0][0]:
        return STATIONS_REF[0][1:]
    if y >= STATIONS_REF[-1][0]:
        return STATIONS_REF[-1][1:]
    for i in range(len(STATIONS_REF) - 1):
        y0, y1 = STATIONS_REF[i][0], STATIONS_REF[i+1][0]
        if y0 <= y <= y1:
            t = (y - y0) / (y1 - y0)
            s = t * t * (3.0 - 2.0 * t)
            p0, p1 = STATIONS_REF[i][1:], STATIONS_REF[i+1][1:]
            return [p0[k] + (p1[k] - p0[k]) * s for k in range(len(p0))]
    return STATIONS_REF[-1][1:]

# ---------------------------------------------------------------------------
# PBR SHADERS
# ---------------------------------------------------------------------------
def create_materials():
    # 1. Bottom Oak-Bark Leather with UV-based procedural shading & rich chestnut patina
    mat_bottom = bpy.data.materials.new(name='M_Outsole_OakBark_Bottom')
    mat_bottom.use_nodes = True
    tree = mat_bottom.node_tree
    tree.nodes.clear()
    
    out_node = tree.nodes.new('ShaderNodeOutputMaterial')
    bsdf_bot = tree.nodes.new('ShaderNodeBsdfPrincipled')
    tree.links.new(bsdf_bot.outputs['BSDF'], out_node.inputs['Surface'])
    
    bsdf_bot.inputs['Roughness'].default_value = 0.26
    bsdf_bot.inputs['Coat Weight'].default_value = 0.75
    bsdf_bot.inputs['Coat Roughness'].default_value = 0.14
    
    tc = tree.nodes.new('ShaderNodeTexCoord')
    sep_uv = tree.nodes.new('ShaderNodeSeparateXYZ')
    tree.links.new(tc.outputs['UV'], sep_uv.inputs['Vector'])
    
    # Distance from center: w_norm = abs(u - 0.5) * 2.0 in [0, 1]
    m_sub = tree.nodes.new('ShaderNodeMath')
    m_sub.operation = 'SUBTRACT'
    m_sub.inputs[1].default_value = 0.5
    tree.links.new(sep_uv.outputs['X'], m_sub.inputs[0])
    
    m_abs = tree.nodes.new('ShaderNodeMath')
    m_abs.operation = 'ABSOLUTE'
    tree.links.new(m_sub.outputs['Value'], m_abs.inputs[0])
    
    m_mul = tree.nodes.new('ShaderNodeMath')
    m_mul.operation = 'MULTIPLY'
    m_mul.inputs[1].default_value = 2.0
    tree.links.new(m_abs.outputs['Value'], m_mul.inputs[0])
    
    # Leather cloudy tanning mottling
    noise_cloud = tree.nodes.new('ShaderNodeTexNoise')
    noise_cloud.inputs['Scale'].default_value = 35.0
    noise_cloud.inputs['Detail'].default_value = 4.0
    noise_cloud.inputs['Roughness'].default_value = 0.55
    tree.links.new(tc.outputs['UV'], noise_cloud.inputs['Vector'])
    
    cr_mottle = tree.nodes.new('ShaderNodeValToRGB')
    cr_mottle.color_ramp.elements[0].position = 0.2
    cr_mottle.color_ramp.elements[0].color = (0.28, 0.12, 0.04, 1.0) # Deep rich chestnut
    cr_mottle.color_ramp.elements[1].position = 0.8
    cr_mottle.color_ramp.elements[1].color = (0.48, 0.22, 0.07, 1.0) # Warm cognac amber
    tree.links.new(noise_cloud.outputs['Fac'], cr_mottle.inputs['Fac'])
    
    # Antique Edge & Flank Burnishing Ramp
    cr_burnish = tree.nodes.new('ShaderNodeValToRGB')
    cr_burnish.color_ramp.elements[0].position = 0.00
    cr_burnish.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0) # Center highlight
    cr_burnish.color_ramp.elements[1].position = 0.60
    cr_burnish.color_ramp.elements[1].color = (0.72, 0.55, 0.42, 1.0)
    cr_burnish.color_ramp.elements.new(0.86)
    cr_burnish.color_ramp.elements[2].color = (0.35, 0.18, 0.06, 1.0) # Stitch groove shadow
    cr_burnish.color_ramp.elements.new(1.00)
    cr_burnish.color_ramp.elements[3].color = (0.12, 0.04, 0.01, 1.0) # Dark rim
    tree.links.new(m_mul.outputs['Value'], cr_burnish.inputs['Fac'])
    
    mix_color = tree.nodes.new('ShaderNodeMix')
    mix_color.data_type = 'RGBA'
    mix_color.blend_type = 'MULTIPLY'
    mix_color.inputs['Factor'].default_value = 1.0
    tree.links.new(cr_mottle.outputs['Color'], mix_color.inputs['A'])
    tree.links.new(cr_burnish.outputs['Color'], mix_color.inputs['B'])
    tree.links.new(mix_color.outputs['Result'], bsdf_bot.inputs['Base Color'])
    
    # Micro pores bump
    voro_pores = tree.nodes.new('ShaderNodeTexVoronoi')
    voro_pores.feature = 'DISTANCE_TO_EDGE'
    voro_pores.inputs['Scale'].default_value = 3200.0
    tree.links.new(tc.outputs['Object'], voro_pores.inputs['Vector'])
    
    bump_p = tree.nodes.new('ShaderNodeBump')
    bump_p.inputs['Strength'].default_value = 0.09
    bump_p.inputs['Distance'].default_value = 0.00010
    tree.links.new(voro_pores.outputs['Distance'], bump_p.inputs['Height'])
    tree.links.new(bump_p.outputs['Normal'], bsdf_bot.inputs['Normal'])
    
    # 2. Top Foot-Facing Leather (Natural Ecru Veg-Tan)
    mat_top = bpy.data.materials.new(name='M_Outsole_VegTan_Top')
    mat_top.use_nodes = True
    bsdf_t = mat_top.node_tree.nodes['Principled BSDF']
    bsdf_t.inputs['Base Color'].default_value = (0.75, 0.66, 0.53, 1.0)
    bsdf_t.inputs['Roughness'].default_value = 0.82
    
    # 3. Edge Dressing
    mat_edge = bpy.data.materials.new(name='M_Outsole_Edge_Dressing')
    mat_edge.use_nodes = True
    bsdf_e = mat_edge.node_tree.nodes['Principled BSDF']
    bsdf_e.inputs['Base Color'].default_value = (0.016, 0.006, 0.002, 1.0)
    bsdf_e.inputs['Roughness'].default_value = 0.18
    bsdf_e.inputs['Coat Weight'].default_value = 0.85
    bsdf_e.inputs['Coat Roughness'].default_value = 0.10
    
    return mat_bottom, mat_top, mat_edge

def build_outsole_mesh():
    mesh = bpy.data.meshes.new('Mesh_Piece_04_Outsole')
    bm = bmesh.new()
    mat_bottom, mat_top, mat_edge = create_materials()
    
    num_y = 110
    num_x = 31
    y_start, y_end = STATIONS_REF[0][0], STATIONS_REF[-1][0]
    
    bot_grid, top_grid = [], []
    bot_uv, top_uv = [], []
    
    for j in range(num_y):
        t = j / float(num_y - 1)
        y = y_start + t * (y_end - y_start)
        wm, wl, zf, th_edge, spine_strength = interpolate_station(y)
        
        if y < -0.082:
            t_heel = (y - y_start) / (-0.082 - y_start)
            ang = (t_heel * 0.5) * math.pi
            scale_heel = max(0.15, math.sin(ang))
            wm *= scale_heel
            wl *= scale_heel
            
        if y > 0.145:
            t_toe = (y - 0.145) / (y_end - 0.145)
            chisel_factor = max(0.48, 1.0 - 0.52 * (t_toe ** 1.3))
            wm *= chisel_factor
            wl *= chisel_factor
            
        bot_row, top_row = [], []
        bot_uv_row, top_uv_row = [], []
        
        for i in range(num_x):
            u_norm = i / float(num_x - 1)
            u = -1.0 + 2.0 * u_norm
            abs_u = abs(u)
            x = (u * wm) if u >= 0 else (u * wl)
            
            # Top Z
            if y < -0.082:
                zt = zf
            elif y <= 0.035:
                zt = zf - 0.0004 * (1.0 - abs_u ** 2) * spine_strength
            else:
                if abs_u < 0.82:
                    recess = 0.0012 * (1.0 - (abs_u / 0.82) ** 4)
                    zt = zf - recess
                else:
                    zt = zf
                    
            # Bottom Z
            if y < -0.082:
                zb = zf - 0.0052
            elif y <= 0.035:
                z_bot_edge = zf - th_edge
                th_spine = 0.0065
                z_bot_center = zf - th_spine
                spine_crest = math.exp(-((abs_u / 0.38) ** 2)) * spine_strength
                flank_concave = (1.0 - spine_crest) * (abs_u ** 1.8) * 0.0006 * spine_strength
                zb = z_bot_edge - (z_bot_edge - z_bot_center) * spine_crest + flank_concave
            else:
                z_bot_edge = zf - 0.0052
                z_bot_center = zf - 0.0052
                zb = z_bot_center + 0.0003 * (abs_u ** 2)
                if 0.038 < y < 0.162:
                    groove = math.exp(-(((abs_u - 0.86) / 0.030) ** 2))
                    zb += 0.00075 * groove
                    
            v_bot = bm.verts.new((x, y, zb))
            v_top = bm.verts.new((x, y, zt))
            bot_row.append(v_bot)
            top_row.append(v_top)
            bot_uv_row.append((u_norm, t))
            top_uv_row.append((u_norm, t))
            
        bot_grid.append(bot_row)
        top_grid.append(top_row)
        bot_uv.append(bot_uv_row)
        top_uv.append(top_uv_row)
        
    bm.verts.ensure_lookup_table()
    uv_layer = bm.loops.layers.uv.new('UVMap')
    
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
            f_bot.loops[0][uv_layer].uv = bot_uv[j][i]
            f_bot.loops[1][uv_layer].uv = bot_uv[j+1][i]
            f_bot.loops[2][uv_layer].uv = bot_uv[j+1][i+1]
            f_bot.loops[3][uv_layer].uv = bot_uv[j][i+1]
            
            f_top = bm.faces.new((
                top_grid[j][i],
                top_grid[j][i+1],
                top_grid[j+1][i+1],
                top_grid[j+1][i]
            ))
            f_top.material_index = 1
            f_top.smooth = True
            f_top.loops[0][uv_layer].uv = top_uv[j][i]
            f_top.loops[1][uv_layer].uv = top_uv[j][i+1]
            f_top.loops[2][uv_layer].uv = top_uv[j+1][i+1]
            f_top.loops[3][uv_layer].uv = top_uv[j+1][i]
            
    for j in range(num_y - 1):
        f_lat = bm.faces.new((top_grid[j][0], top_grid[j+1][0], bot_grid[j+1][0], bot_grid[j][0]))
        f_lat.material_index = 2
        f_lat.smooth = True
        f_med = bm.faces.new((bot_grid[j][num_x-1], bot_grid[j+1][num_x-1], top_grid[j+1][num_x-1], top_grid[j][num_x-1]))
        f_med.material_index = 2
        f_med.smooth = True
        
    for i in range(num_x - 1):
        f_rear = bm.faces.new((bot_grid[0][i], bot_grid[0][i+1], top_grid[0][i+1], top_grid[0][i]))
        f_rear.material_index = 2
        f_rear.smooth = True
        f_toe = bm.faces.new((bot_grid[-1][i+1], bot_grid[-1][i], top_grid[-1][i], top_grid[-1][i+1]))
        f_toe.material_index = 2
        f_toe.smooth = True
        
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    
    outsole_obj = bpy.data.objects.new('Piece_04_Outsole_OakBark', mesh)
    outsole_obj.data.materials.append(mat_bottom)
    outsole_obj.data.materials.append(mat_top)
    outsole_obj.data.materials.append(mat_edge)
    
    sub = outsole_obj.modifiers.new(name='Subdivision', type='SUBSURF')
    sub.levels = 1
    sub.render_levels = 2
    return outsole_obj

def build_assembled_heel_stack():
    heel_objs = []
    mat_edge = bpy.data.materials.get('M_Outsole_Edge_Dressing')
    
    # Dovetail Rubber Material
    m_rub = bpy.data.materials.new('M_Heel_Rubber_Dovetail')
    m_rub.use_nodes = True
    bsdf_r = m_rub.node_tree.nodes['Principled BSDF']
    bsdf_r.inputs['Base Color'].default_value = (0.05, 0.05, 0.05, 1.0)
    bsdf_r.inputs['Roughness'].default_value = 0.65
    
    # Leather Face Material
    m_hleather = bpy.data.materials.new('M_Heel_Leather_Face')
    m_hleather.use_nodes = True
    bsdf_hl = m_hleather.node_tree.nodes['Principled BSDF']
    bsdf_hl.inputs['Base Color'].default_value = (0.35, 0.16, 0.05, 1.0)
    bsdf_hl.inputs['Roughness'].default_value = 0.32
    bsdf_hl.inputs['Coat Weight'].default_value = 0.60
    bsdf_hl.inputs['Coat Roughness'].default_value = 0.16
    
    # Brass Nails
    m_brass = bpy.data.materials.new('M_Heel_Brass_Nails')
    m_brass.use_nodes = True
    bsdf_b = m_brass.node_tree.nodes['Principled BSDF']
    bsdf_b.inputs['Base Color'].default_value = (0.86, 0.69, 0.29, 1.0)
    bsdf_b.inputs['Metallic'].default_value = 0.95
    bsdf_b.inputs['Roughness'].default_value = 0.22
    
    pts_perimeter = []
    y_rear, y_breast = -0.126, -0.082
    r_med, r_lat = 0.032, 0.032
    
    for i in range(8):
        u = i / 7.0
        x = r_med * (1.0 - u) + (-r_lat) * u
        y = y_breast - 0.0010 * (1.0 - (2.0 * u - 1.0)**2)
        pts_perimeter.append((x, y))
        
    for i in range(1, 24):
        ang = math.pi * (i / 24.0)
        rx = r_lat if ang < math.pi * 0.5 else r_med
        x = -rx * math.cos(ang)
        y = y_breast - (y_breast - y_rear) * math.sin(ang)
        pts_perimeter.append((x, y))
        
    # 4 Solid Leather Lifts (from Z = 0.0060 to 0.0210)
    for layer in range(4):
        z_lo = 0.0060 + layer * 0.00375
        z_hi = z_lo + 0.00375
        m = bpy.data.meshes.new(f'Heel_Lift_{layer+1}')
        bm = bmesh.new()
        v_lo = [bm.verts.new((px, py, z_lo)) for px, py in pts_perimeter]
        v_hi = [bm.verts.new((px, py, z_hi)) for px, py in pts_perimeter]
        n = len(pts_perimeter)
        for k in range(n):
            k_next = (k + 1) % n
            f = bm.faces.new((v_lo[k], v_lo[k_next], v_hi[k_next], v_hi[k]))
            f.material_index = 0
            f.smooth = True
        bm.faces.new(v_lo).smooth = True
        bm.faces.new(list(reversed(v_hi))).smooth = True
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(m)
        bm.free()
        o = bpy.data.objects.new(f'Heel_Lift_{layer+1}', m)
        o.data.materials.append(mat_edge)
        heel_objs.append(o)
        
    # Bottom Dovetail Layer (Z: 0.0 to 0.0060)
    m_bot = bpy.data.meshes.new('Heel_Bottom_Layer')
    bm_b = bmesh.new()
    
    ng_x = 21
    ng_y = 21
    grid_verts_lo = []
    grid_verts_hi = []
    
    for gy in range(ng_y):
        vy = gy / float(ng_y - 1)
        py = y_rear + vy * (y_breast - y_rear)
        if py < y_breast - 0.002:
            ang = math.asin(min(1.0, max(0.0, (y_breast - py) / (y_breast - y_rear))))
            w_max = r_med * math.cos(ang)
        else:
            w_max = r_med
            
        row_lo = []
        row_hi = []
        for gx in range(ng_x):
            vx = -1.0 + 2.0 * (gx / float(ng_x - 1))
            px = vx * w_max
            v_lo = bm_b.verts.new((px, py, 0.0))
            v_hi = bm_b.verts.new((px, py, 0.0060))
            row_lo.append((v_lo, px, py))
            row_hi.append((v_hi, px, py))
        grid_verts_lo.append(row_lo)
        grid_verts_hi.append(row_hi)
        
    bm_b.verts.ensure_lookup_table()
    
    for gy in range(ng_y - 1):
        for gx in range(ng_x - 1):
            v0_lo, px0, py0 = grid_verts_lo[gy][gx]
            v1_lo, px1, py1 = grid_verts_lo[gy][gx+1]
            v2_lo, px2, py2 = grid_verts_lo[gy+1][gx+1]
            v3_lo, px3, py3 = grid_verts_lo[gy+1][gx]
            
            v0_hi = grid_verts_hi[gy][gx][0]
            v1_hi = grid_verts_hi[gy][gx+1][0]
            v2_hi = grid_verts_hi[gy+1][gx+1][0]
            v3_hi = grid_verts_hi[gy+1][gx][0]
            
            mid_y = (py0 + py2) * 0.5
            mid_x = (px0 + px2) * 0.5
            
            y_dovetail = -0.104 + 0.005 * max(0.0, 1.0 - (mid_x / 0.032)**2)
            mat_idx = 0 if mid_y < y_dovetail else 1
            
            fb = bm_b.faces.new((v0_lo, v3_lo, v2_lo, v1_lo))
            fb.material_index = mat_idx
            fb.smooth = True
            
            ft = bm_b.faces.new((v0_hi, v1_hi, v2_hi, v3_hi))
            ft.material_index = 1
            ft.smooth = True
            
    for gy in range(ng_y - 1):
        v_bl = grid_verts_lo[gy][0][0]
        v_tl = grid_verts_hi[gy][0][0]
        v_bl_next = grid_verts_lo[gy+1][0][0]
        v_tl_next = grid_verts_hi[gy+1][0][0]
        f_l = bm_b.faces.new((v_bl, v_tl, v_tl_next, v_bl_next))
        f_l.material_index = 2
        f_l.smooth = True
        
        v_br = grid_verts_lo[gy][-1][0]
        v_tr = grid_verts_hi[gy][-1][0]
        v_br_next = grid_verts_lo[gy+1][-1][0]
        v_tr_next = grid_verts_hi[gy+1][-1][0]
        f_r = bm_b.faces.new((v_br, v_br_next, v_tr_next, v_tr))
        f_r.material_index = 2
        f_r.smooth = True
        
    bmesh.ops.recalc_face_normals(bm_b, faces=bm_b.faces)
    bm_b.to_mesh(m_bot)
    bm_b.free()
    
    o_bot = bpy.data.objects.new('Heel_Bottom_Layer', m_bot)
    o_bot.data.materials.append(m_rub)      # Slot 0: Rubber
    o_bot.data.materials.append(m_hleather) # Slot 1: Leather
    o_bot.data.materials.append(mat_edge)   # Slot 2: Edge dressing
    heel_objs.append(o_bot)
    
    # 8 Brass Nails (defined in absolute mesh coordinates so they stay rigidly anchored)
    bm_nail_all = bmesh.new()
    nail_pts = [
        (-0.018, -0.114), (-0.021, -0.102), (-0.019, -0.090),
        (-0.009, -0.119), ( 0.009, -0.119),
        ( 0.018, -0.114), ( 0.021, -0.102), ( 0.019, -0.090)
    ]
    for nx, ny in nail_pts:
        matrix_nail = Matrix.Translation(Vector((nx, ny, 0.0003)))
        bmesh.ops.create_cone(
            bm_nail_all,
            cap_ends=True,
            cap_tris=False,
            segments=12,
            radius1=0.0008,
            radius2=0.0008,
            depth=0.0012,
            matrix=matrix_nail
        )
    m_nails = bpy.data.meshes.new('Heel_Brass_Nails')
    bm_nail_all.to_mesh(m_nails)
    bm_nail_all.free()
    o_nails = bpy.data.objects.new('Heel_Brass_Nails', m_nails)
    o_nails.data.materials.append(m_brass)
    heel_objs.append(o_nails)
    
    return heel_objs

def setup_studio():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 96
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = 0.02
    
    world = bpy.data.worlds.new('StudioWorld')
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.55, 0.54, 0.53, 1.0)
        bg.inputs['Strength'].default_value = 1.0
        
    bpy.ops.mesh.primitive_plane_add(size=12.0, location=(0, 0, 0.0))
    floor = bpy.context.active_object
    floor.name = 'Studio_Floor_ShadowCatcher'
    floor.is_shadow_catcher = True
    
    l_key = bpy.data.lights.new('Key', 'AREA')
    l_key.energy = 6.8
    l_key.size = 0.60
    l_key.color = (1.0, 0.98, 0.95)
    ok = bpy.data.objects.new('Key', l_key)
    ok.location = (0.32, -0.05, 0.45)
    ok.rotation_euler = (math.radians(45), math.radians(18), math.radians(35))
    scene.collection.objects.link(ok)
    
    l_fill = bpy.data.lights.new('Fill', 'AREA')
    l_fill.energy = 2.4
    l_fill.size = 0.80
    l_fill.color = (0.95, 0.97, 1.0)
    of = bpy.data.objects.new('Fill', l_fill)
    of.location = (-0.35, -0.05, 0.38)
    of.rotation_euler = (math.radians(40), math.radians(-25), math.radians(-45))
    scene.collection.objects.link(of)
    
    l_rim = bpy.data.lights.new('Rim', 'AREA')
    l_rim.energy = 5.2
    l_rim.size = 0.40
    l_rim.color = (1.0, 1.0, 0.98)
    orim = bpy.data.objects.new('Rim', l_rim)
    orim.location = (0.0, 0.35, 0.32)
    orim.rotation_euler = (math.radians(-50), 0, math.radians(180))
    scene.collection.objects.link(orim)
    
    l_bounce = bpy.data.lights.new('Bounce', 'AREA')
    l_bounce.energy = 1.2
    l_bounce.size = 0.80
    l_bounce.color = (0.98, 0.95, 0.90)
    ob = bpy.data.objects.new('Bounce', l_bounce)
    ob.location = (0.0, 0.0, -0.30)
    ob.rotation_euler = (math.radians(180), 0, 0)
    scene.collection.objects.link(ob)

def setup_camera(name, loc, rot_euler=None, target_loc=None, is_ortho=False, ortho_scale=0.33, lens=85.0):
    scene = bpy.context.scene
    if scene.camera:
        old_cam = scene.camera
        for con in old_cam.constraints:
            if con.type == 'TRACK_TO' and con.target:
                bpy.data.objects.remove(con.target, do_unlink=True)
        bpy.data.objects.remove(old_cam, do_unlink=True)
        
    cam_data = bpy.data.cameras.new(name)
    cam_data.clip_start = 0.001
    cam_data.dof.use_dof = False
    
    if is_ortho:
        cam_data.type = 'ORTHO'
        cam_data.ortho_scale = ortho_scale
    else:
        cam_data.type = 'PERSP'
        cam_data.lens = lens
        
    cam_obj = bpy.data.objects.new(name, cam_data)
    cam_obj.location = loc
    if rot_euler:
        cam_obj.rotation_euler = rot_euler
        
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    
    if target_loc:
        empty = bpy.data.objects.new(f'{name}_Target', None)
        empty.location = target_loc
        scene.collection.objects.link(empty)
        track = cam_obj.constraints.new(type='TRACK_TO')
        track.target = empty
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y' # Camera local Y is up!
        
    bpy.context.view_layer.update()
    return cam_obj

def run_suite():
    import sys
    target_shots = None
    if '--' in sys.argv:
        idx = sys.argv.index('--')
        custom_args = sys.argv[idx+1:]
        if '--shot' in custom_args:
            s_idx = custom_args.index('--shot')
            target_shots = [int(x) for x in custom_args[s_idx+1].split(',')]
            print(f'Targeting specific shots: {target_shots}')

    bpy.ops.wm.read_factory_settings(use_empty=True)
    setup_studio()
    outsole = build_outsole_mesh()
    bpy.context.scene.collection.objects.link(outsole)
    
    # Heel objects parented to outsole!
    heel_objs = build_assembled_heel_stack()
    for ho in heel_objs:
        bpy.context.scene.collection.objects.link(ho)
        ho.parent = outsole # Parented so they move and rotate seamlessly with outsole!
        
    scene = bpy.context.scene
    
    # -----------------------------------------------------------------------
    # SHOT 1: BOTTOM VIEW (Ground-facing side, Heel Left, Toe Right)
    # -----------------------------------------------------------------------
    if target_shots is None or 1 in target_shots:
        print('[1/10] Bottom View...')
        outsole.rotation_euler = (math.radians(180), 0, math.radians(-90))
        outsole.location = (0.0, 0.0, 0.045)
        for ho in heel_objs:
            ho.hide_render = False
        bpy.context.view_layer.update()
        setup_camera('Cam_Bottom', loc=(0.0, 0.0, 0.45), rot_euler=(0, 0, math.radians(180)), is_ortho=True, ortho_scale=0.33)
        out1 = os.path.join(OUTPUT_DIR, 'Outsole_Piece_04_Bottom_View.jpg')
        scene.render.filepath = out1
        bpy.ops.render.render(write_still=True)
        shutil.copy2(out1, os.path.join(WEB_DIR, 'Outsole_Piece_04_Bottom_View.jpg'))
        shutil.copy2(out1, os.path.join(BRAIN_DIR, 'Outsole_Piece_04_Bottom_View.jpg'))
    
    # -----------------------------------------------------------------------
    # SHOT 2: TOP VIEW (Corrected Insole-facing side, Heel Left, Toe Right)
    # -----------------------------------------------------------------------
    if target_shots is None or 2 in target_shots:
        print('[2/10] Top View...')
        outsole.rotation_euler = (0, 0, math.radians(-90))
        outsole.location = (0.0, 0.0, 0.010)
        for ho in heel_objs:
            ho.hide_render = True # Hide heel stack for clean footbed view
        bpy.context.view_layer.update()
        setup_camera('Cam_Top', loc=(0.0, 0.0, 0.45), rot_euler=(0, 0, 0), is_ortho=True, ortho_scale=0.33)
        out2 = os.path.join(OUTPUT_DIR, 'Outsole_Piece_04_Top_View.jpg')
        scene.render.filepath = out2
        bpy.ops.render.render(write_still=True)
        shutil.copy2(out2, os.path.join(WEB_DIR, 'Outsole_Piece_04_Top_View.jpg'))
        shutil.copy2(out2, os.path.join(BRAIN_DIR, 'Outsole_Piece_04_Top_View.jpg'))
    
    # Restore heel visibility & reset posture for natural ground resting views
    for ho in heel_objs:
        ho.hide_render = False
    outsole.rotation_euler = (0, 0, 0)
    outsole.location = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()
    
    # -----------------------------------------------------------------------
    # SHOT 3: LEFT VIEW (Lateral Side Profile: Heel Left, Toe Right)
    # -----------------------------------------------------------------------
    if target_shots is None or 3 in target_shots:
        print('[3/10] Left Lateral View...')
        setup_camera('Cam_Lateral', loc=(-0.45, 0.020, 0.016), rot_euler=(math.radians(90), 0, math.radians(-90)), is_ortho=True, ortho_scale=0.33)
        out3 = os.path.join(OUTPUT_DIR, 'Outsole_Piece_04_Left_Lateral_View.jpg')
        scene.render.filepath = out3
        bpy.ops.render.render(write_still=True)
        shutil.copy2(out3, os.path.join(WEB_DIR, 'Outsole_Piece_04_Left_Lateral_View.jpg'))
        shutil.copy2(out3, os.path.join(BRAIN_DIR, 'Outsole_Piece_04_Left_Lateral_View.jpg'))
    
    # -----------------------------------------------------------------------
    # SHOT 4: RIGHT VIEW (Medial Side Profile: Toe Left, Heel Right)
    # -----------------------------------------------------------------------
    if target_shots is None or 4 in target_shots:
        print('[4/10] Right Medial View...')
        setup_camera('Cam_Medial', loc=(0.45, 0.020, 0.016), rot_euler=(math.radians(90), 0, math.radians(90)), is_ortho=True, ortho_scale=0.33)
        out4 = os.path.join(OUTPUT_DIR, 'Outsole_Piece_04_Right_Medial_View.jpg')
        scene.render.filepath = out4
        bpy.ops.render.render(write_still=True)
        shutil.copy2(out4, os.path.join(WEB_DIR, 'Outsole_Piece_04_Right_Medial_View.jpg'))
        shutil.copy2(out4, os.path.join(BRAIN_DIR, 'Outsole_Piece_04_Right_Medial_View.jpg'))
    
    # -----------------------------------------------------------------------
    # SHOT 5: FRONT VIEW (Toe End View, looking from toe towards heel)
    # -----------------------------------------------------------------------
    if target_shots is None or 5 in target_shots:
        print('[5/10] Front Toe View...')
        outsole.rotation_euler = (0, math.radians(180), 0)
        outsole.location = (0.0, 0.0, 0.032)
        for ho in heel_objs:
            ho.hide_render = True # Hide heel stack so toe profile and ball crest are clean and unobstructed
        bpy.context.view_layer.update()
        # Camera in front of toe (+Y), looking towards -Y
        setup_camera('Cam_Front', loc=(0.0, 0.38, 0.045), target_loc=(0.0, 0.020, 0.015), is_ortho=False, lens=90.0)
        out5 = os.path.join(OUTPUT_DIR, 'Outsole_Piece_04_Front_Toe_View.jpg')
        scene.render.filepath = out5
        bpy.ops.render.render(write_still=True)
        shutil.copy2(out5, os.path.join(WEB_DIR, 'Outsole_Piece_04_Front_Toe_View.jpg'))
        shutil.copy2(out5, os.path.join(BRAIN_DIR, 'Outsole_Piece_04_Front_Toe_View.jpg'))
    
    # -----------------------------------------------------------------------
    # SHOT 6: BACK VIEW (Heel End View, looking from heel towards toe)
    # -----------------------------------------------------------------------
    if target_shots is None or 6 in target_shots:
        print('[6/10] Back Heel View...')
        outsole.rotation_euler = (0, math.radians(180), 0)
        outsole.location = (0.0, 0.0, 0.032)
        for ho in heel_objs:
            ho.hide_render = False # Restore heel visibility for Back View
        bpy.context.view_layer.update()
        # Camera behind heel (-Y), looking towards +Y
        setup_camera('Cam_Back', loc=(0.0, -0.34, 0.052), target_loc=(0.0, -0.020, 0.015), is_ortho=False, lens=90.0)
        out6 = os.path.join(OUTPUT_DIR, 'Outsole_Piece_04_Back_Heel_View.jpg')
        scene.render.filepath = out6
        bpy.ops.render.render(write_still=True)
        shutil.copy2(out6, os.path.join(WEB_DIR, 'Outsole_Piece_04_Back_Heel_View.jpg'))
        shutil.copy2(out6, os.path.join(BRAIN_DIR, 'Outsole_Piece_04_Back_Heel_View.jpg'))
    
    # -----------------------------------------------------------------------
    # SHOT 7: HERO THREE-QUARTER (Dynamic Oblique Beauty Perspective)
    # -----------------------------------------------------------------------
    if target_shots is None or 7 in target_shots:
        print('[7/10] Hero Three Quarter...')
        outsole.rotation_euler = (math.radians(180), 0, math.radians(-30))
        outsole.location = (0.0, 0.0, 0.035)
        for ho in heel_objs:
            ho.hide_render = False
        bpy.context.view_layer.update()
        setup_camera('Cam_Hero', loc=(0.42, -0.40, 0.26), target_loc=(-0.015, -0.025, 0.015), is_ortho=False, lens=55.0)
        out7 = os.path.join(OUTPUT_DIR, 'Outsole_Piece_04_Hero_ThreeQuarter.jpg')
        scene.render.filepath = out7
        bpy.ops.render.render(write_still=True)
        shutil.copy2(out7, os.path.join(WEB_DIR, 'Outsole_Piece_04_Hero_ThreeQuarter.jpg'))
        shutil.copy2(out7, MASTER_PIECE_IMG)
        shutil.copy2(out7, WEB_PIECE_IMG)
        shutil.copy2(out7, os.path.join(BRAIN_DIR, 'Outsole_Piece_04_Hero_ThreeQuarter.jpg'))
        shutil.copy2(out7, os.path.join(BRAIN_DIR, 'Piece_04_Outsole.jpg'))
    
    # -----------------------------------------------------------------------
    # SHOT 8: MACRO FIDDLEBACK (Close-up of sculpted spine & flanks)
    # -----------------------------------------------------------------------
    if target_shots is None or 8 in target_shots:
        print('[8/10] Macro Fiddleback Spine...')
        outsole.rotation_euler = (math.radians(180), 0, math.radians(-90))
        outsole.location = (0.0, 0.0, 0.045)
        bpy.context.view_layer.update()
        setup_camera('Cam_Macro', loc=(-0.015, 0.0, 0.18), rot_euler=(0, 0, math.radians(180)), is_ortho=True, ortho_scale=0.10)
        out8 = os.path.join(OUTPUT_DIR, 'Outsole_Piece_04_Macro_Fiddleback_Spine.jpg')
        scene.render.filepath = out8
        bpy.ops.render.render(write_still=True)
        shutil.copy2(out8, os.path.join(WEB_DIR, 'Outsole_Piece_04_Macro_Fiddleback_Spine.jpg'))
        shutil.copy2(out8, os.path.join(BRAIN_DIR, 'Outsole_Piece_04_Macro_Fiddleback_Spine.jpg'))
    
    # -----------------------------------------------------------------------
    # SHOT 9: HEEL ASSEMBLY CONTEXT (Natural Ground Posture)
    # -----------------------------------------------------------------------
    if target_shots is None or 9 in target_shots:
        print('[9/10] Heel Assembly Context...')
        outsole.rotation_euler = (0, 0, 0)
        outsole.location = (0.0, 0.0, 0.0)
        bpy.context.view_layer.update()
        setup_camera('Cam_Asm', loc=(-0.36, -0.26, 0.16), target_loc=(0.0, 0.010, 0.015), is_ortho=False, lens=65.0)
        out9 = os.path.join(OUTPUT_DIR, 'Outsole_Piece_04_Heel_Assembly_Context.jpg')
        scene.render.filepath = out9
        bpy.ops.render.render(write_still=True)
        shutil.copy2(out9, os.path.join(WEB_DIR, 'Outsole_Piece_04_Heel_Assembly_Context.jpg'))
        shutil.copy2(out9, os.path.join(BRAIN_DIR, 'Outsole_Piece_04_Heel_Assembly_Context.jpg'))
    
    # -----------------------------------------------------------------------
    # SHOT 10 / EXPORT: STANDALONE GLB
    # -----------------------------------------------------------------------
    if target_shots is None or 10 in target_shots:
        print('[10/10] Exporting Standalone GLB...')
        for ho in heel_objs:
            bpy.data.objects.remove(ho, do_unlink=True)
        outsole.rotation_euler = (0, 0, 0)
        outsole.location = (0.0, 0.0, 0.0)
        bpy.context.view_layer.update()
        bpy.ops.object.select_all(action='DESELECT')
        outsole.select_set(True)
        bpy.context.view_layer.objects.active = outsole
        glb_out = os.path.join(MODEL_DIR, 'Piece_04_Outsole.glb')
        web_glb_out = os.path.join(WEB_MODEL_DIR, 'Piece_04_Outsole.glb')
        bpy.ops.export_scene.gltf(filepath=glb_out, use_selection=True, export_format='GLB', export_apply=True)
        shutil.copy2(glb_out, web_glb_out)
    print('Suite execution finished successfully!')

if __name__ == '__main__':
    run_suite()
