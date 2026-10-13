"""_common.py: shared helpers for the mawt Blender scripts (anime cel look + Freestyle ink lines).

Rules (AGENTS.md section 4b): every object is built from primitives in code, Cycles on CPU, fixed seed,
no animated seed, linear keys, transparent film, view transform Standard. No imported models,
HDRIs or image textures.

The anime look in Cycles (EEVEE's Shader-to-RGB is not available headless):
  * cel shading = pure node maths: dot(world normal, fixed light direction) -> constant ColorRamp
    with 3 steps (shadow / base / highlight) -> Emission. No scene lights are needed, so the
    colours are exact and noise-free.
  * ink = Freestyle line art (silhouette, border, crease, contour), absolute thickness, black.
"""
import argparse
import math
import sys

import bpy


def args(defaults):
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True, help="output prefix, e.g. /work/data/vibe/mawt/blender/cage")
    p.add_argument("--frames", type=int, default=defaults.get("frames", 24))
    p.add_argument("--w", type=int, default=defaults.get("w", 320))
    p.add_argument("--h", type=int, default=defaults.get("h", 400))
    p.add_argument("--samples", type=int, default=defaults.get("samples", 16))
    p.add_argument("--line", type=float, default=defaults.get("line", 2.6))
    p.add_argument("--mode", default=defaults.get("mode", "spin"))
    return p.parse_args(argv)


def scene(a):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = a.samples
    sc.cycles.seed = 0
    sc.cycles.use_animated_seed = False
    sc.cycles.use_denoising = False          # emission-only shading has no noise; OIDN would blur the ink
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = a.w, a.h
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.frame_start, sc.frame_end = 1, a.frames
    sc.render.filepath = a.out + "_"
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
    sc.world = w
    # ---- Freestyle ink
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = "ABSOLUTE"
    sc.render.line_thickness = a.line
    vl = sc.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    fs.crease_angle = math.radians(134)
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("ink")
    ls.select_by_visibility = True
    ls.select_by_edge_types = True
    ls.select_silhouette = True
    ls.select_border = True
    ls.select_crease = True
    ls.select_contour = True
    ls.select_external_contour = True
    st = ls.linestyle
    if st is None:
        st = ls.linestyle = bpy.data.linestyles.new("ink")
    st.color = (0.03, 0.02, 0.05)
    st.thickness = 1.0
    st.caps = "ROUND"
    return sc


def toon(name, base, shade, hi=None, light=(-0.45, -0.55, 0.7), steps=(0.08, 0.72)):
    """Cel material: 3 flat tones chosen by dot(N, L). base/shade/hi are sRGB-ish 0..1 triples."""
    hi = hi or tuple(min(1.0, c * 1.25 + 0.08) for c in base)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    dot = nt.nodes.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    L = math.sqrt(sum(c * c for c in light))
    dot.inputs[1].default_value = tuple(c / L for c in light)
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    cr = ramp.color_ramp
    cr.interpolation = "CONSTANT"
    srgb = lambda c: tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)  # sRGB -> linear
    cr.elements[0].position = 0.0
    cr.elements[0].color = (*srgb(shade), 1)
    cr.elements[1].position = 0.5 + 0.5 * steps[0]
    cr.elements[1].color = (*srgb(base), 1)
    e = cr.elements.new(0.5 + 0.5 * steps[1])
    e.color = (*srgb(hi), 1)
    rng = nt.nodes.new("ShaderNodeMapRange")  # dot in [-1, 1] -> [0, 1]
    rng.inputs["From Min"].default_value = -1.0
    rng.inputs["From Max"].default_value = 1.0
    nt.links.new(geo.outputs["Normal"], dot.inputs[0])
    nt.links.new(dot.outputs["Value"], rng.inputs["Value"])
    nt.links.new(rng.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    em.inputs["Strength"].default_value = 1.0
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return m


def flat(name, rgb, strength=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    lin = tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in rgb)
    em.inputs["Color"].default_value = (*lin, 1)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return m


def assign(obj, m):
    obj.data.materials.clear()
    obj.data.materials.append(m)
    return obj


def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


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


def spin(pivot, axis, deg_from, deg_to, frames, loop=True):
    """Rotate `pivot` around axis (0=X, 1=Y, 2=Z), linear. loop=True: frame frames+1 equals frame 1."""
    pivot.rotation_euler[axis] = math.radians(deg_from)
    pivot.keyframe_insert("rotation_euler", index=axis, frame=1)
    pivot.rotation_euler[axis] = math.radians(deg_to)
    pivot.keyframe_insert("rotation_euler", index=axis, frame=frames + 1 if loop else frames)
    linear_keys(pivot)


def empty(name="pivot"):
    bpy.ops.object.empty_add(location=(0, 0, 0))
    e = bpy.context.object
    e.name = name
    return e


def parent(objs, p):
    for o in objs:
        o.parent = p


def poly_tube(name, pts, radius, mat_, res=6):
    """A tube along a polyline (curve with bevel), converted to a mesh so Freestyle sees its edges."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 2
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.convert(target="MESH")
    ob = bpy.context.object
    assign(ob, mat_)
    smooth(ob)
    return ob
