import bpy
import bmesh
import math

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

# Proportions
L = 0.295 # 295mm
y_heel_rear = -0.125
y_heel_breast = -0.045 # 80mm heel length
y_waist_apex = -0.005 # Apex of arch
y_ball = 0.065 # 104mm ball width
y_cap = 0.115 # Cap seam
y_toe_tip = 0.170 # Chisel tip

# Widths
w_heel_med = 0.034
w_heel_lat = 0.034
w_waist_med = 0.028
w_waist_lat = 0.026
w_ball_med = 0.054
w_ball_lat = 0.050
w_toe_med = 0.016
w_toe_lat = 0.014

def get_widths(y):
    if y <= y_heel_breast:
        t = (y - y_heel_rear) / (y_heel_breast - y_heel_rear)
        if t < 0.55:
            theta = (t / 0.55) * (math.pi / 2.0)
            wm = w_heel_med * math.sin(theta)
            wl = w_heel_lat * math.sin(theta)
        else:
            wm = w_heel_med
            wl = w_heel_lat
    elif y <= y_ball:
        t = (y - y_heel_breast) / (y_ball - y_heel_breast)
        if t < 0.40:
            s = t / 0.40
            wm = w_heel_med + (w_waist_med - w_heel_med) * (3*s*s - 2*s*s*s)
            wl = w_heel_lat + (w_waist_lat - w_heel_lat) * (3*s*s - 2*s*s*s)
        else:
            s = (t - 0.40) / 0.60
            wm = w_waist_med + (w_ball_med - w_waist_med) * (3*s*s - 2*s*s*s)
            wl = w_waist_lat + (w_ball_lat - w_waist_lat) * (3*s*s - 2*s*s*s)
    elif y <= y_cap:
        s = (y - y_ball) / (y_cap - y_ball)
        wm = w_ball_med + (0.046 - w_ball_med) * s
        wl = w_ball_lat + (0.042 - w_ball_lat) * s
    else:
        s = (y - y_cap) / (y_toe_tip - y_cap)
        if s < 0.70:
            u = s / 0.70
            wm = 0.046 + (0.034 - 0.046) * (u * u)
            wl = 0.042 + (0.030 - 0.042) * (u * u)
        else:
            u = (s - 0.70) / 0.30
            wm = 0.034 + (w_toe_med - 0.034) * u
            wl = 0.030 + (w_toe_lat - 0.030) * u
    return max(0.001, wm), max(0.001, wl)

def get_vertical_profile(y):
    thickness = 0.0052 # 5.2mm base
    
    if y <= y_heel_breast:
        z_bot_center = 0.0264
        z_bot_edge = 0.0264
        z_top_edge = z_bot_edge + thickness
        z_top_center = z_top_edge
        fiddle = 0.0
    elif y <= y_ball:
        t = (y - y_heel_breast) / (y_ball - y_heel_breast)
        # Arch elevation
        arch_height = 0.016 * math.sin(t * math.pi)
        z_base = 0.0264 * (1.0 - t*t*(3 - 2*t))
        z_bot_edge = z_base + arch_height
        
        # Fiddleback spine hanging down
        fiddle = math.sin(t * math.pi) ** 1.3
        z_bot_center = z_bot_edge - 0.0048 * fiddle
        
        # In waist, edge thickness reduces to ~3.0mm (beveled waist!)
        waist_edge_thickness = thickness - 0.0024 * fiddle
        z_top_edge = z_bot_edge + waist_edge_thickness
        z_top_center = z_bot_center + thickness # Center retains full thickness
    else:
        t = (y - y_ball) / (y_toe_tip - y_ball)
        toe_spring = 0.014 * (t ** 2.2)
        z_bot_center = toe_spring
        z_bot_edge = toe_spring
        z_top_edge = toe_spring + thickness
        z_top_center = z_top_edge
        fiddle = 0.0
        
    return z_bot_center, z_bot_edge, z_top_center, z_top_edge, fiddle

def build_outsole_mesh():
    clean_scene()
    mesh = bpy.data.meshes.new("Mesh_Piece_04_Outsole")
    bm = bmesh.new()
    
    # 80 longitudinal stations
    num_y = 80
    # 21 transverse points across bottom and top (-X lateral to +X medial)
    num_x = 21
    mid_idx = num_x // 2
    
    y_stations = []
    for j in range(num_y):
        t = j / float(num_y - 1)
        y = y_heel_rear + t * (y_toe_tip - y_heel_rear)
        y_stations.append(y)
        
    bot_grid = [] # [j][i]
    top_grid = [] # [j][i]
    
    for j, y in enumerate(y_stations):
        wm, wl = get_widths(y)
        z_bc, z_be, z_tc, z_te, fiddle = get_vertical_profile(y)
        
        bot_row = []
        top_row = []
        
        for i in range(num_x):
            u = -1.0 + 2.0 * (i / float(num_x - 1))
            abs_u = abs(u)
            x = (u * wm) if u >= 0 else (u * wl)
            
            # Bottom surface
            if fiddle > 0.01:
                # Fiddleback spine profile: u^0.75 gives steep triangular crest
                crest = (1.0 - (abs_u ** 0.85))
                zb = z_be - (z_be - z_bc) * crest
            else:
                # Flat tread with subtle 0.5mm transverse crown
                zb = z_bc + 0.0005 * (abs_u ** 2)
                # Closed channel stitch groove around forefoot perimeter (at abs_u ≈ 0.90)
                if y > y_ball and y < y_toe_tip - 0.005:
                    groove = math.exp(-((abs_u - 0.88) / 0.035) ** 2)
                    zb += 0.0006 * groove
                    
            # Top surface
            if y <= y_heel_breast:
                zt = z_tc # Flat heel seat
            elif y <= y_ball:
                # Waist insole bed: slight cupping to seat the steel shank
                zt = z_te - 0.0006 * (1.0 - abs_u ** 2) * fiddle
            else:
                # Forefoot: cork filler recess inside the 2.5mm welt margin (abs_u < 0.80)
                if abs_u < 0.80:
                    recess = 0.0012 * (1.0 - (abs_u / 0.80) ** 4)
                    zt = z_te - recess
                else:
                    zt = z_te
                    
            v_bot = bm.verts.new((x, y, zb))
            v_top = bm.verts.new((x, y, zt))
            bot_row.append(v_bot)
            top_row.append(v_top)
            
        bot_grid.append(bot_row)
        top_grid.append(top_row)
        
    bm.verts.ensure_lookup_table()
    
    # Faces: Bottom surface
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
            
    # Faces: Top surface
    for j in range(num_y - 1):
        for i in range(num_x - 1):
            f_top = bm.faces.new((
                top_grid[j][i],
                top_grid[j][i+1],
                top_grid[j+1][i+1],
                top_grid[j+1][i]
            ))
            f_top.material_index = 1
            f_top.smooth = True
            
    # Faces: Lateral Sidewall (i = 0)
    for j in range(num_y - 1):
        f_lat = bm.faces.new((
            top_grid[j][0],
            top_grid[j+1][0],
            bot_grid[j+1][0],
            bot_grid[j][0]
        ))
        f_lat.material_index = 2
        f_lat.smooth = True
        
    # Faces: Medial Sidewall (i = num_x - 1)
    for j in range(num_y - 1):
        f_med = bm.faces.new((
            bot_grid[j][num_x-1],
            bot_grid[j+1][num_x-1],
            top_grid[j+1][num_x-1],
            top_grid[j][num_x-1]
        ))
        f_med.material_index = 2
        f_med.smooth = True
        
    # Faces: Heel Back Edge (j = 0)
    for i in range(num_x - 1):
        f_rear = bm.faces.new((
            bot_grid[0][i],
            bot_grid[0][i+1],
            top_grid[0][i+1],
            top_grid[0][i]
        ))
        f_rear.material_index = 2
        f_rear.smooth = True
        
    # Faces: Toe Tip Front Edge (j = num_y - 1)
    for i in range(num_x - 1):
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
    bpy.context.scene.collection.objects.link(obj)
    
    print(f"Generated Outsole Mesh: {len(mesh.vertices)} verts, {len(mesh.polygons)} polygons")
    print(f"Dimensions: X={obj.dimensions.x*1000:.1f}mm, Y={obj.dimensions.y*1000:.1f}mm, Z={obj.dimensions.z*1000:.1f}mm")
    return obj

build_outsole_mesh()
