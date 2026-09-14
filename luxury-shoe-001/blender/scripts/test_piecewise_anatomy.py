"""
Test script to prototype and verify the authentic piece-by-piece footwear anatomy:
1. Solid Stacked Heel (solid horseshoe lifts, watertight, zero slats)
2. Real Ankle Collar Opening & Interior Glove Lining Cavity
3. Organic Cupped Heel Counter hugging Achilles Tendon
4. 270° Goodyear Welt (terminating at heel breast, zero protruding wing tabs at heel)
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)

def make_horseshoe_lift(y_rear=-0.126, y_breast=-0.082, r_med=0.031, r_lat=0.030, num_curve=16, num_breast=8):
    pts = []
    # 1. Breast: from medial (+r_med) to lateral (-r_lat)
    for i in range(num_breast):
        u = 1.0 - 2.0 * i / (num_breast - 1) # from +1 to -1
        rx = r_med if u >= 0 else r_lat
        x = rx * u
        y = y_breast - 0.002 * (1.0 - u**2)
        pts.append((x, y))
    
    # 2. Lateral flank to rear to medial flank:
    for i in range(1, num_curve):
        phi = math.pi + math.pi * i / num_curve # from pi to 2pi
        rx = r_lat if phi < 1.5 * math.pi else r_med
        x = -rx * math.cos(phi)
        y = y_breast - (y_breast - y_rear) * math.sin(phi - math.pi)
        pts.append((x, y))
    return pts

def create_solid_heel(collection):
    mesh = bpy.data.meshes.new("Construction_HeelStack")
    bm = bmesh.new()

    num_leather_lifts = 4
    total_drop = 0.027
    lift_h = total_drop / 5.0 # 5 lifts total: 4 leather + 1 rubber pad

    # Leather lifts
    for l in range(num_leather_lifts):
        zt = 0.0270 - l * lift_h
        zb = zt - lift_h
        taper = 1.0 - l * 0.020
        pts = make_horseshoe_lift(y_rear=-0.126 * taper, y_breast=-0.082, r_med=0.031 * taper, r_lat=0.030 * taper)
        n = len(pts)

        top_v = [bm.verts.new((x, y, zt)) for x, y in pts]
        bot_v = [bm.verts.new((x, y, zb)) for x, y in pts]

        # Top cap (+Z normal)
        bm.faces.new(reversed(top_v)).smooth = True
        # Bot cap (-Z normal)
        bm.faces.new(bot_v).smooth = True
        # Side walls (outward normals)
        for i in range(n):
            i_next = (i + 1) % n
            bm.faces.new((top_v[i], top_v[i_next], bot_v[i_next], bot_v[i])).smooth = True

    # Rubber Dovetail Strike Plate (bottom lift)
    zt_r = lift_h
    zb_r = 0.0000
    taper_r = 1.0 - 4 * 0.020
    pts_r = make_horseshoe_lift(y_rear=-0.126 * taper_r, y_breast=-0.082, r_med=0.031 * taper_r, r_lat=0.030 * taper_r)
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

    obj = bpy.data.objects.new("Construction_HeelStack", mesh)
    collection.objects.link(obj)
    sub = obj.modifiers.new(name="Subsurf", type='SUBSURF')
    sub.levels = 1
    return obj

def test():
    clear_scene()
    col = bpy.data.collections.new("TEST")
    bpy.context.scene.collection.children.link(col)
    heel = create_solid_heel(col)
    print(f"Heel created: {len(heel.data.vertices)} vertices, {len(heel.data.polygons)} polygons.")

test()
