"""card_spin.py: a procedural 3D playing card spinning once, rendered by Blender (Cycles, CPU).

Run through the runner (never the GUI):
    tools/blender_run.sh tools/blender/card_spin.py -- --out <dir>/card --frames 48 --size 384
Output: <dir>/card_0001.png … card_00NN.png (RGBA, transparent background), one full 360° spin,
loop-safe (frame N+1 == frame 1). Pack the frames with tools/sprite_atlas.py and draw them in
the composition by frame index = f(t). See AGENTS.md §4b.

Rules this script demonstrates (copy them into any new Blender script):
  * Everything is built from code: geometry, materials, text, lights. No imported models or images.
  * Deterministic: fixed Cycles seed, no animated seed, linear keyframes, fixed sample count.
  * CPU only: Cycles device CPU, denoiser off (OIDN is CPU and deterministic, but costs time).
  * Transparent film so the result composites over the three.js / Canvas 2D world.
"""
import argparse
import math
import sys

import bpy


def args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True, help="output prefix, e.g. assets/blender/card")
    p.add_argument("--frames", type=int, default=48)
    p.add_argument("--size", type=int, default=384)
    p.add_argument("--samples", type=int, default=24)
    p.add_argument("--face", default="A", help="rank letter on the face")
    return p.parse_args(argv)


def mat(name, rgb, rough=0.35, metal=0.0, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*rgb, 1)
        b.inputs["Emission Strength"].default_value = emit
    return m


def text(body, size, loc, rot, material, parent):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    t = bpy.context.object
    t.data.body = body
    t.data.size = size
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    t.data.extrude = 0.004
    t.data.materials.append(material)
    t.parent = parent
    return t


def build(a):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = a.samples
    sc.cycles.seed = 0
    sc.cycles.use_animated_seed = False
    sc.cycles.use_denoising = False
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = a.size
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"  # no Filmic/AgX tone curve: colours match the palette
    sc.frame_start, sc.frame_end = 1, a.frames

    # card: thin bevelled box (2.5 × 3.5 ratio), cream face, gold rim
    bpy.ops.mesh.primitive_cube_add(size=1)
    card = bpy.context.object
    card.scale = (2.5, 0.04, 3.5)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)  # children must not inherit a scale
    bev = card.modifiers.new("bevel", "BEVEL")
    bev.width, bev.segments = 0.12, 6
    bev.affect = "EDGES"
    card.data.materials.append(mat("face", (0.96, 0.92, 0.82), rough=0.45))
    bpy.ops.object.shade_smooth()

    red = mat("red", (0.75, 0.05, 0.08), rough=0.3)
    gold = mat("gold", (1.0, 0.72, 0.25), rough=0.3, metal=0.5, emit=0.25)
    half = math.pi / 2
    # front (−Y): rank + pip; back (+Y): gold diamond and border
    text(a.face, 1.25, (0, -0.03, 0.1), (half, 0, 0), red, card)
    text(a.face, 0.42, (-0.78, -0.03, 1.3), (half, 0, 0), red, card)
    bpy.ops.mesh.primitive_plane_add(size=1.3, location=(0, 0.03, 0), rotation=(half, math.pi / 4, 0))
    dia = bpy.context.object
    dia.data.materials.append(gold)
    dia.parent = card

    # lights + camera
    bpy.ops.object.light_add(type="AREA", location=(-3, -4, 3))
    key = bpy.context.object
    key.data.energy, key.data.size = 320, 3
    key.rotation_euler = (math.radians(55), 0, math.radians(-35))
    bpy.ops.object.light_add(type="AREA", location=(3.5, 3, 1))
    rim = bpy.context.object
    rim.data.energy, rim.data.size, rim.data.color = 260, 2, (1.0, 0.8, 0.5)
    rim.rotation_euler = (math.radians(75), 0, math.radians(130))
    bpy.ops.object.camera_add(location=(0, -9, 0), rotation=(half, 0, 0))
    cam = bpy.context.object
    cam.data.lens = 60
    sc.camera = cam
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.25
    sc.world = world

    # one full spin around Z, linear, loop-safe: frame frames+1 would equal frame 1
    card.rotation_euler = (math.radians(-8), 0, 0)
    card.keyframe_insert("rotation_euler", index=2, frame=1)
    card.rotation_euler[2] = 2 * math.pi
    card.keyframe_insert("rotation_euler", index=2, frame=a.frames + 1)
    for fc in card.animation_data.action.fcurves:
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
    sc.render.filepath = a.out + "_"  # Blender appends 0001 …


def main():
    a = args()
    build(a)
    bpy.ops.render.render(animation=True)
    print(f"card_spin: wrote {a.frames} frames to {a.out}_####.png")


main()
