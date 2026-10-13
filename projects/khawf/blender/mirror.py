"""mirror.py: an ornate pointed-arch (Islamic) mirror frame in gold and turquoise enamel that turns
from -80 to +80 degrees to face the viewer. The glass is left OPEN (transparent): the composition
draws the reflection itself behind the frame, clipped to the opening.

    tools/blender_run.sh projects/khawf/blender/mirror.py -- --out /work/data/vibe/khawf/blender/mirror --frames 49 --w 384 --h 480
Orthographic camera, rotation about the vertical axis through the opening's plane, so at angle th
the opening is exactly the frontal opening squeezed horizontally by cos(th) about the image centre.
Frame i (0-based) has angle -80 + 160 * i / (frames - 1). Opening geometry: see OPENING below
(normalised image coordinates, written to <out>_opening.json).
"""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _common import args, scene, mat, assign, smooth, light, camera, empty, parent, linear_keys

a = args({"frames": 49, "w": 384, "h": 480, "samples": 48})
sc = scene(a)
gold = mat("gold", (0.95, 0.68, 0.28), rough=0.22, metal=1.0)
teal = mat("teal", (0.03, 0.33, 0.34), rough=0.3, metal=0.2)
pearl = mat("pearl", (0.95, 0.92, 0.85), rough=0.15)


def arch(w, base, c_ratio=0.38, n=28):
    """Pointed arch outline: straight sides from y=0 to `base`, two arcs meeting at the apex."""
    c = c_ratio * w
    r = w + c
    pts = [(-w, 0.0), (w, 0.0), (w, base)]
    a0 = 0.0
    a1 = math.acos(c / r)  # angle at apex for the right arc centred at (-c, base)
    for i in range(1, n + 1):
        t = a0 + (a1 - a0) * i / n
        pts.append((-c + r * math.cos(t), base + r * math.sin(t)))
    apex = pts[-1]
    left = []
    for i in range(n - 1, -1, -1):
        t = a0 + (a1 - a0) * i / n
        left.append((c - r * math.cos(t), base + r * math.sin(t)))
    pts += left[0:]
    pts.append((-w, base))
    return pts, apex


def curve_obj(name, outlines, depth, bevel, material):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    cu.extrude = depth
    cu.bevel_depth = bevel
    cu.bevel_resolution = 3
    for pts in outlines:
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for i, (x, y) in enumerate(pts):
            sp.points[i].co = (x, y, 0, 1)
        sp.use_cyclic_u = True
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    ob.rotation_euler = (math.radians(90), 0, 0)  # curve XY -> world XZ, facing -Y (the camera)
    ob.data.materials.append(material)
    return ob


piv = empty()
outer, apex_o = arch(1.12, 1.55)
inner, apex_i = arch(0.86, 1.31)
inner = [(x, y + 0.14) for x, y in inner]  # a bottom bar under the glass
band, _ = arch(0.97, 1.4)
band = [(x, y + 0.07) for x, y in band]
objs = [curve_obj("frame", [outer, inner], 0.07, 0.025, gold)]
b2 = curve_obj("enamel", [band, inner], 0.115, 0.0, teal)
objs.append(b2)
# pearls along the outer edge
for i in range(0, len(outer), 3):
    x, y = outer[i]
    if y < 0.05:
        continue
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(x * 1.04, -0.05, y * 1.0 + 0.02))
    objs.append(smooth(assign(bpy.context.object, pearl)))
# crescent finial above the apex: a torus slice made by a boolean
bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=0.06, location=(0, 0, apex_o[1] + 0.3), rotation=(math.radians(90), 0, 0))
cr = bpy.context.object
bpy.ops.mesh.primitive_cylinder_add(radius=0.17, depth=0.2, location=(0.08, 0, apex_o[1] + 0.35), rotation=(math.radians(90), 0, 0))
cutter = bpy.context.object
m = cr.modifiers.new("cut", "BOOLEAN"); m.operation = "DIFFERENCE"; m.object = cutter; m.solver = "EXACT"
bpy.context.view_layer.objects.active = cr
bpy.ops.object.modifier_apply(modifier="cut")
bpy.data.objects.remove(cutter, do_unlink=True)
objs.append(assign(cr, gold))
bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.2, location=(0, 0, apex_o[1] + 0.08))
objs.append(assign(bpy.context.object, gold))
# feet
for sx in (-1, 1):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(sx * 0.8, 0, -0.06))
    f = bpy.context.object
    f.scale = (0.32, 0.22, 0.12)
    objs.append(assign(f, gold))
parent(objs, piv)
light("AREA", (-3, -5, 4), (55, 0, -30), 1100, size=4, color=(1.0, 0.86, 0.68))
light("AREA", (4, -2, 1), (80, 0, 60), 300, size=3, color=(0.6, 0.8, 1.0))
light("AREA", (0, 3, 3), (-60, 0, 0), 200, size=3, color=(1.0, 0.7, 0.4))
top = apex_o[1] + 0.55
H = top + 0.25
cam_z = H / 2 - 0.2
camera((0, -10, cam_z), (90, 0, 0), ortho_scale=H * 1.02)
for i in range(a.frames):
    piv.rotation_euler[2] = math.radians(-80 + 160 * i / (a.frames - 1))
    piv.keyframe_insert("rotation_euler", index=2, frame=i + 1)
linear_keys(piv)
# opening polygon in normalised image coords (x right, y down) at angle 0
sw = H * 1.02  # ortho scale spans the larger image side (height here)
aspect = a.w / a.h
def to_img(x, z):
    u = 0.5 + x / (sw * aspect)
    v = 0.5 - (z - cam_z) / sw
    return [round(u, 4), round(v, 4)]
json.dump({"frames": a.frames, "angle_from": -80, "angle_to": 80, "cx": 0.5,
           "opening": [to_img(x, y) for x, y in inner]}, open(a.out + "_opening.json", "w"))
bpy.ops.render.render(animation=True)
print(f"mirror: wrote {a.frames} frames to {a.out}_####.png")
