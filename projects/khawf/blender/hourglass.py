"""hourglass.py: a glass hourglass in a turned wooden and brass frame whose sand runs out over the
sequence (frame 1 = full top bulb, last frame = empty), turning slowly (30 degrees) as it drains.

    tools/blender_run.sh projects/khawf/blender/hourglass.py -- --out /work/data/vibe/khawf/blender/hourglass --frames 48 --w 384 --h 512
One-shot asset: draw frame = clamp(f(t)) so the sand level is a pure function of the sung time
("وإن تطعه يوماً تمت بأناة", obey him and you die slowly).
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from _common import args, scene, mat, assign, smooth, light, camera, empty, parent, linear_keys

a = args({"frames": 48, "w": 384, "h": 512, "samples": 64})
sc = scene(a)
glass = mat("glass", (0.95, 0.97, 1.0), rough=0.03, transmission=1.0, ior=1.45)
sand = mat("sand", (0.92, 0.66, 0.32), rough=0.9, emit=0.35, emit_rgb=(0.9, 0.55, 0.2))
wood = mat("wood", (0.28, 0.12, 0.05), rough=0.55)
brass = mat("brass", (0.86, 0.6, 0.26), rough=0.28, metal=1.0)


def lathe(name, prof, segs=48):
    """Solid of revolution around Z from a (r, z) profile."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0, z)) for r, z in prof]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    bmesh.ops.spin(bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1), steps=segs, angle=math.radians(360))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def bulb_r(z):  # inner glass radius as a function of height (z in [-1, 1]); neck at 0
    u = abs(z)
    return 0.07 + 0.55 * math.sin(min(1.0, u / 0.92) * math.pi * 0.62) ** 1.4 * (1 - max(0, u - 0.85) * 3)


prof = [(max(0.001, bulb_r(z)), z) for z in [i / 40 - 1 for i in range(81)]]
piv = empty()
objs = [smooth(lathe("glass", prof))]
sol = objs[0].modifiers.new("s", "SOLIDIFY"); sol.thickness = 0.02
assign(objs[0], glass)
# frame: discs + posts
for z in (1.06, -1.06):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.78, depth=0.14, location=(0, 0, z))
    objs.append(smooth(assign(bpy.context.object, wood)))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.78, minor_radius=0.03, location=(0, 0, z + (0.07 if z > 0 else -0.07)))
    objs.append(smooth(assign(bpy.context.object, brass)))
for i in range(3):
    ang = math.radians(120 * i + 30)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=2.0, location=(0.66 * math.cos(ang), 0.66 * math.sin(ang), 0))
    objs.append(smooth(assign(bpy.context.object, wood)))
    for z in (-0.5, 0.0, 0.5):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.075, location=(0.66 * math.cos(ang), 0.66 * math.sin(ang), z))
        objs.append(smooth(assign(bpy.context.object, brass)))
# sand meshes, one pair per frame (visibility keyed): top = bulb filled from the neck up to level hT,
# bottom = a heap growing from the floor; volume moves from top to bottom linearly.
def top_sand(level):
    zs = [0.02 + (level - 0.02) * i / 24 for i in range(25)]
    p = [(0.001, 0.02)] + [(bulb_r(z) * 0.96, z) for z in zs] + [(0.001, level)]
    return p


def heap(h):
    base = -0.93
    p = [(0.001, base)]
    for i in range(25):
        z = base + h * i / 24
        rmax = bulb_r(z) * 0.96
        cone = (1 - i / 24) * 0.62
        p.append((max(0.001, min(rmax, cone + 0.08 * (1 - i / 24))), z))
    p.append((0.001, base + h))
    return p


sand_objs = []
for f in range(a.frames):
    k = f / (a.frames - 1)
    lev = 0.02 + 0.68 * (1 - k) ** 0.75
    ob_t = smooth(lathe(f"top{f}", top_sand(lev))) if k < 0.995 else None
    ob_b = smooth(lathe(f"bot{f}", heap(0.03 + 0.5 * k ** 0.8)))
    stream = None
    if 0.01 < k < 0.99:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.95, location=(0, 0, -0.45))
        stream = bpy.context.object
    for ob in (ob_t, ob_b, stream):
        if ob is None:
            continue
        assign(ob, sand)
        for fr, vis in ((f, False), (f + 1, True), (f + 2, False)):
            if fr < 1:
                continue
            ob.hide_render = not vis
            ob.keyframe_insert("hide_render", frame=fr)
        sand_objs.append(ob)
parent(objs + sand_objs, piv)
light("AREA", (-3, -4, 3), (55, 0, -35), 700, size=4, color=(1.0, 0.86, 0.7))
light("AREA", (3.5, 3, 1.5), (75, 0, 130), 500, size=3, color=(0.6, 0.78, 1.0))
light("AREA", (0, 4, 0), (-90, 0, 0), 300, size=4, color=(1.0, 0.75, 0.45))
camera((0, -7.5, 0.4), (87, 0, 0), lens=62)
for f in range(a.frames):
    piv.rotation_euler[2] = math.radians(30 * f / (a.frames - 1))
    piv.keyframe_insert("rotation_euler", index=2, frame=f + 1)
linear_keys(piv)
bpy.ops.render.render(animation=True)
print(f"hourglass: wrote {a.frames} frames to {a.out}_####.png")
