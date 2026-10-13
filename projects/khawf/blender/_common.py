"""_common.py: shared helpers for the khawf Blender scripts (imported by each script).

Rules (AGENTS.md section 4b): every object is built from primitives in code, Cycles on CPU, fixed seed,
no animated seed, linear keys, transparent film, view transform Standard. No imported models,
HDRIs or image textures.
"""
import argparse
import math
import sys

import bpy


def args(defaults):
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True, help="output prefix, e.g. /work/data/x/lantern")
    p.add_argument("--frames", type=int, default=defaults.get("frames", 48))
    p.add_argument("--w", type=int, default=defaults.get("w", 384))
    p.add_argument("--h", type=int, default=defaults.get("h", 384))
    p.add_argument("--samples", type=int, default=defaults.get("samples", 48))
    return p.parse_args(argv)


def scene(a):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = a.samples
    sc.cycles.seed = 0
    sc.cycles.use_animated_seed = False
    sc.cycles.use_denoising = True          # OIDN runs on the CPU and is deterministic
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.render.film_transparent = True
    sc.cycles.film_transparent_glass = True
    sc.render.resolution_x, sc.render.resolution_y = a.w, a.h
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.frame_start, sc.frame_end = 1, a.frames
    sc.render.filepath = a.out + "_"
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.05, 0.06, 0.12, 1)
    bg.inputs["Strength"].default_value = 0.6
    sc.world = w
    return sc


def mat(name, rgb, rough=0.35, metal=0.0, emit=0.0, emit_rgb=None, transmission=0.0, ior=1.45, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Transmission Weight"].default_value = transmission
    b.inputs["IOR"].default_value = ior
    b.inputs["Alpha"].default_value = alpha
    if emit:
        b.inputs["Emission Color"].default_value = (*(emit_rgb or rgb), 1)
        b.inputs["Emission Strength"].default_value = emit
    return m


def assign(obj, m):
    obj.data.materials.clear()
    obj.data.materials.append(m)
    return obj


def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def light(kind, loc, rot_deg, energy, size=1.0, color=(1, 1, 1)):
    bpy.ops.object.light_add(type=kind, location=loc)
    L = bpy.context.object
    L.rotation_euler = tuple(math.radians(r) for r in rot_deg)
    L.data.energy = energy
    L.data.color = color
    if kind == "AREA":
        L.data.size = size
    elif kind == "POINT":
        L.data.shadow_soft_size = size
    return L


def camera(loc, rot_deg, lens=50, ortho_scale=None):
    bpy.ops.object.camera_add(location=loc)
    c = bpy.context.object
    c.rotation_euler = tuple(math.radians(r) for r in rot_deg)
    if ortho_scale:
        c.data.type = "ORTHO"
        c.data.ortho_scale = ortho_scale
    else:
        c.data.lens = lens
    bpy.context.scene.camera = c
    return c


def linear_keys(obj):
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for k in fc.keyframe_points:
                k.interpolation = "LINEAR"


def spin_z(pivot, deg_from, deg_to, frames, loop=True):
    """Rotate `pivot` around Z, linear. loop=True: frame frames+1 equals frame 1 (cyclic asset)."""
    pivot.rotation_euler[2] = math.radians(deg_from)
    pivot.keyframe_insert("rotation_euler", index=2, frame=1)
    pivot.rotation_euler[2] = math.radians(deg_to)
    pivot.keyframe_insert("rotation_euler", index=2, frame=frames + 1 if loop else frames)
    linear_keys(pivot)


def empty(name="pivot"):
    bpy.ops.object.empty_add(location=(0, 0, 0))
    e = bpy.context.object
    e.name = name
    return e


def parent(objs, p):
    for o in objs:
        o.parent = p
