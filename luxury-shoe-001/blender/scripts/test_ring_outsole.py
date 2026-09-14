import bpy
import bmesh
import math
import os

OUTPUT_DIR = os.path.abspath("luxury-shoe-001/renders/pieces/outsole")

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

# 2D Perimeter Profile of Bespoke Shoe Last Outsole (Size 10.5 / 295mm)
# Built from 60 stations from heel rear to toe tip
def get_perimeter_and_centerline(num_stations=60):
    # Longitudinal coordinate y from -0.126 to +0.168
    # Returns:
    # center_pts: list of (x=0, y, z_top, z_bot)
    # lat_pts: list of (x_lat, y, z_top_edge, z_bot_edge)
    # med_pts: list of (x_med, y, z_top_edge, z_bot_edge)
    
    y_heel_rear = -0.126
    y_heel_breast = -0.082
    y_waist_apex = -0.025
    y_ball = 0.055
    y_cap = 0.110
    y_chisel_shoulder = 0.145
    y_toe_tip = 0.168
    
    stations = []
    
    for i in range(num_stations):
        t = i / float(num_stations - 1)
        y = y_heel_rear + t * (y_toe_tip - y_heel_rear)
        
        # 1. Widths (Lateral and Medial)
        if y <= y_heel_breast:
            # Heel section: U-curve
            u = (y - y_heel_rear) / (y_heel_breast - y_heel_rear) # 0 to 1
            # Semicircle heel back
            ang = u * (math.pi / 2.0)
            wl = 0.031 * math.sin(ang)
            wm = 0.032 * math.sin(ang)
        elif y <= y_ball:
            # Waist arch: hourglass narrowing
            u = (y - y_heel_breast) / (y_ball - y_heel_breast)
            # Waist dip at u = 0.35 (y = -0.025)
            if u < 0.35:
                s = u / 0.35
                wl = 0.031 + (0.026 - 0.031) * (3*s*s - 2*s*s*s)
                wm = 0.032 + (0.028 - 0.032) * (3*s*s - 2*s*s*s)
            else:
                s = (u - 0.35) / 0.65
                wl = 0.026 + (0.050 - 0.026) * (3*s*s - 2*s*s*s)
                wm = 0.028 + (0.055 - 0.028) * (3*s*s - 2*s*s*s)
        elif y <= y_cap:
            u = (y - y_ball) / (y_cap - y_ball)
            wl = 0.050 + (0.042 - 0.050) * u
            wm = 0.055 + (0.046 - 0.055) * u
        elif y <= y_chisel_shoulder:
            u = (y - y_cap) / (y_chisel_shoulder - y_cap)
            wl = 0.042 + (0.032 - 0.042) * (u ** 1.5)
            wm = 0.046 + (0.036 - 0.046) * (u ** 1.5)
        else:
            # Soft-chisel toe tip
            u = (y - y_chisel_shoulder) / (y_toe_tip - y_chisel_shoulder)
            wl = 0.032 + (0.013 - 0.032) * u
            wm = 0.036 + (0.015 - 0.036) * u
            
        wl = max(0.001, wl)
        wm = max(0.001, wm)
        
        # 2. Elevations (Z)
        th_forefoot = 0.0055
        
        if y <= y_heel_breast:
            # Heel seat: resting at heel height 27mm
            zt = 0.0270
            zb_edge = 0.0270 - th_forefoot
            zb_center = zb_edge
            fiddle = 0.0
        elif y <= y_ball:
            # Waist arch
            u = (y - y_heel_breast) / (y_ball - y_heel_breast)
            # Longitudinal arch curve
            zt = 0.0270 - 0.0210 * (u ** 1.2) + 0.008 * math.sin(u * math.pi)
            fiddle = math.sin(u * math.pi) ** 1.2
            # Beveled edge thins down to 3.0mm
            th_edge = th_forefoot - 0.0025 * fiddle
            zb_edge = zt - th_edge
            # Center spine retains full 6.2mm substance
            zb_center = zt - 0.0062
        else:
            # Forefoot and toe spring
            u = (y - y_ball) / (y_toe_tip - y_ball)
            toe_spring = 0.014 * (u ** 2.2)
            zb_edge = toe_spring
            zb_center = toe_spring
            zt = toe_spring + th_forefoot
            fiddle = 0.0
            
        stations.append({
            'y': y,
            'wl': wl,
            'wm': wm,
            'zt': zt,
            'zb_edge': zb_edge,
            'zb_center': zb_center,
            'fiddle': fiddle
        })
        
    return stations

def build_ring_outsole():
    clean_scene()
    mesh = bpy.data.meshes.new("Mesh_Outsole_Ring")
    bm = bmesh.new()
    
    stations = get_perimeter_and_centerline(num_stations=70)
    num_y = len(stations)
    # Number of transverse points across sole (-X to +X)
    num_x = 23
    
    top_grid = []
    bot_grid = []
    
    for j, s in enumerate(stations):
        y = s['y']
        wl = s['wl']
        wm = s['wm']
        zt = s['zt']
        zbe = s['zb_edge']
        zbc = s['zb_center']
        fiddle = s['fiddle']
        
        top_row = []
        bot_row = []
        
        for i in range(num_x):
            # u: -1.0 (lateral edge) to 0.0 (center) to +1.0 (medial edge)
            u = -1.0 + 2.0 * (i / float(num_x - 1))
            abs_u = abs(u)
            x = (u * wm) if u >= 0 else (u * wl)
            
            # Bottom surface
            if fiddle > 0.01:
                # Fiddleback spine: sharp parabolic/triangular keel
                crest = (1.0 - (abs_u ** 0.80))
                zb = zbe - (zbe - zbc) * crest
            else:
                # Flat tread with subtle crown
                zb = zbc + 0.0004 * (abs_u ** 2)
                # Closed channel stitch groove around forefoot
                if s['y'] > 0.055 and s['y'] < 0.160:
                    groove = math.exp(-((abs_u - 0.88) / 0.030) ** 2)
                    zb += 0.00065 * groove
                    
            # Top surface
            if s['y'] <= -0.082:
                # Flat insole heel seat
                zt_v = zt
            elif s['y'] <= 0.055:
                # Arched waist with slight hollow for steel shank
                zt_v = zt - 0.0008 * (1.0 - abs_u ** 2) * fiddle
            else:
                # Forefoot: cork filler cavity inside welt margin
                if abs_u < 0.80:
                    recess = 0.0012 * (1.0 - (abs_u / 0.80) ** 4)
                    zt_v = zt - recess
                else:
                    zt_v = zt
                    
            v_bot = bm.verts.new((x, y, zb))
            v_top = bm.verts.new((x, y, zt_v))
            bot_row.append(v_bot)
            top_row.append(v_top)
            
        bot_grid.append(bot_row)
        top_grid.append(top_row)
        
    bm.verts.ensure_lookup_table()
    
    # Faces: Bottom
    for j in range(num_y - 1):
        for i in range(num_x - 1):
            f_bot = bm.faces.new((
                bot_grid[j][i],
                bot_grid[j+1][i],
                bot_grid[j+1][i+1],
                bot_grid[j][i+1]
            ))
            f_bot.smooth = True
            
    # Faces: Top
    for j in range(num_y - 1):
        for i in range(num_x - 1):
            f_top = bm.faces.new((
                top_grid[j][i],
                top_grid[j][i+1],
                top_grid[j+1][i+1],
                top_grid[j+1][i]
            ))
            f_top.smooth = True
            
    # Lateral Sidewall
    for j in range(num_y - 1):
        f_lat = bm.faces.new((
            top_grid[j][0],
            top_grid[j+1][0],
            bot_grid[j+1][0],
            bot_grid[j][0]
        ))
        f_lat.smooth = True
        
    # Medial Sidewall
    for j in range(num_y - 1):
        f_med = bm.faces.new((
            bot_grid[j][num_x-1],
            bot_grid[j+1][num_x-1],
            top_grid[j+1][num_x-1],
            top_grid[j][num_x-1]
        ))
        f_med.smooth = True
        
    # Heel rear edge
    for i in range(num_x - 1):
        f_rear = bm.faces.new((
            bot_grid[0][i],
            bot_grid[0][i+1],
            top_grid[0][i+1],
            top_grid[0][i]
        ))
        f_rear.smooth = True
        
    # Toe front edge
    for i in range(num_x - 1):
        f_front = bm.faces.new((
            top_grid[num_y-1][i],
            top_grid[num_y-1][i+1],
            bot_grid[num_y-1][i+1],
            bot_grid[num_y-1][i]
        ))
        f_front.smooth = True
        
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new("Outsole_Test", mesh)
    bpy.context.scene.collection.objects.link(obj)
    print(f"Generated Outsole: {len(mesh.vertices)} verts, {len(mesh.polygons)} polygons")
    print(f"Bounds: X={obj.dimensions.x*1000:.1f}mm, Y={obj.dimensions.y*1000:.1f}mm, Z={obj.dimensions.z*1000:.1f}mm")
    return obj

build_ring_outsole()
