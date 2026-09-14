"""
=============================================================================
MASTER 20-PIECE ANATOMICAL GLB EXPORTER: "ANATOMY OF A DRESS SHOE"
Flagship Bespoke Oxford Shoe (SHOE_001 "AEROPRO AURELIUS")
Exports all 20 independent anatomical components as discrete named meshes
in a single GLTF/GLB file, enabling true 20-piece interactive 3D deconstruction!
=============================================================================
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix, Euler
import os
import shutil

# Import the builder logic from render_all_20_pieces
import sys
scripts_dir = os.path.dirname(os.path.abspath(__file__))
if scripts_dir not in sys.path:
    sys.path.append(scripts_dir)

from render_all_20_pieces import clear_scene, create_materials, build_all_20_pieces

def main():
    base_dir = r"c:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001"
    print("\n=======================================================")
    print("BUILDING 20-PIECE MASTER ANATOMICAL ASSEMBLY FOR GLB")
    print("=======================================================")

    clear_scene()
    col = bpy.data.collections.new("SHOE_001_AURELIUS_20_PIECES")
    bpy.context.scene.collection.children.link(col)
    materials = create_materials()

    print("Generating all 20 individual anatomical components...")
    raw_pieces = build_all_20_pieces(col, materials)

    # Convert curve objects to mesh objects for GLTF export
    bpy.context.view_layer.update()

    consolidated_pieces = {}
    for p_id in sorted(raw_pieces.keys()):
        p_name, obj_list = raw_pieces[p_id]
        print(f"Processing Piece {p_id:02d}: {p_name} ({len(obj_list)} objects)...")

        # If any object in list is a curve, convert it to mesh
        mesh_objs = []
        for obj in obj_list:
            if obj.type == 'CURVE':
                bpy.ops.object.select_all(action='DESELECT')
                obj.select_set(True)
                bpy.context.view_layer.objects.active = obj
                bpy.ops.object.convert(target='MESH')
                mesh_objs.append(bpy.context.view_layer.objects.active)
            else:
                mesh_objs.append(obj)

        if len(mesh_objs) == 1:
            final_obj = mesh_objs[0]
            final_obj.name = p_name
            consolidated_pieces[p_id] = final_obj
        else:
            # Join multi-mesh components (e.g. Shank + Rivets, Facings + Eyelets, Laces + Aglets)
            bpy.ops.object.select_all(action='DESELECT')
            for obj in mesh_objs:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = mesh_objs[0]
            bpy.ops.object.join()
            final_obj = bpy.context.view_layer.objects.active
            final_obj.name = p_name
            consolidated_pieces[p_id] = final_obj

    print("\nVerifying 20 consolidated objects:")
    for p_id, obj in consolidated_pieces.items():
        print(f"  [{p_id:02d}] {obj.name} | Verts: {len(obj.data.vertices)} | Faces: {len(obj.data.polygons)} | Mats: {[m.name for m in obj.data.materials if m]}")

    # Ensure all objects are selected for export
    bpy.ops.object.select_all(action='DESELECT')
    for obj in consolidated_pieces.values():
        obj.select_set(True)

    # Save Blend file
    blend_file = os.path.join(base_dir, "blender", "master", "SHOE_001_20_PIECES_MASTER.blend")
    os.makedirs(os.path.dirname(blend_file), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend_file)
    print(f"\nSaved master blend -> {blend_file}")

    # Export Production GLB
    web_assets = os.path.join(base_dir, "web", "assets")
    dist_assets = os.path.join(base_dir, "web", "dist", "assets")
    os.makedirs(web_assets, exist_ok=True)
    os.makedirs(dist_assets, exist_ok=True)

    target_glb = os.path.join(web_assets, "shoe001_aurelius.glb")
    dist_glb = os.path.join(dist_assets, "shoe001_aurelius.glb")

    print(f"Exporting Production GLB -> {target_glb}...")
    bpy.ops.export_scene.gltf(
        filepath=target_glb,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_normals=True
    )
    shutil.copyfile(target_glb, dist_glb)
    print(f"Synced to dist -> {dist_glb}")
    print("\nSUCCESS: All 20 independent pieces exported to GLB!")

if __name__ == "__main__":
    main()
