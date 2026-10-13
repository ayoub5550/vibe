"""rifle.py: Death's weapon, a long sniper rifle (barrel, receiver, scope with a red lens, magazine,
stock, bipod) whose muzzle carries a crescent scythe blade: the hunter (قناص) as the reaper.
Cel-shaded with Freestyle ink lines (see _common.py). It turns 360 degrees about the vertical axis
(frame frames+1 equals frame 1); frame 1 is the clean side view used when Death holds it.
    tools/blender_run.sh projects/mawt/blender/rifle.py -- --out /work/data/vibe/mawt/blender/rifle --frames 48 --w 384 --h 192
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from _common import args, scene, toon, flat, assign, smooth, camera, spin, empty, parent

a = args({"frames": 48, "w": 384, "h": 192, "samples": 16, "line": 2.0})
sc = scene(a)
gun = toon("gun", (0.24, 0.27, 0.40), (0.10, 0.11, 0.18), (0.50, 0.56, 0.76))
wood = toon("wood", (0.36, 0.20, 0.30), (0.18, 0.08, 0.14), (0.55, 0.34, 0.46))
blade = toon("blade", (0.84, 0.88, 0.96), (0.45, 0.50, 0.66), (1.0, 1.0, 1.0))
lens = flat("lens", (1.0, 0.18, 0.28), 1.0)
piv = empty()
objs = []

def box(loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    objs.append(assign(o, m))
    return o

def cyl(loc, r, depth, m, rot=(0, math.pi / 2, 0), v=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=depth, location=loc, rotation=rot)
    o = smooth(assign(bpy.context.object, m))
    objs.append(o)
    return o

cyl((0.55, 0, 0.0), 0.035, 2.3, gun)                 # barrel along +x
cyl((1.72, 0, 0.0), 0.06, 0.16, gun)                  # muzzle brake
box((-0.55, 0, -0.02), (0.75, 0.12, 0.17), gun)      # receiver
cyl((-0.45, 0, 0.17), 0.065, 0.78, gun)               # scope tube
cyl((-0.06, 0, 0.17), 0.085, 0.12, gun)               # objective bell
cyl((-0.01, 0, 0.17), 0.07, 0.02, lens)               # red lens
box((-0.62, 0, -0.17), (0.12, 0.08, 0.26), gun, rot=(0, 0.25, 0))   # magazine
box((-1.25, 0, -0.08), (0.72, 0.1, 0.2), wood, rot=(0, -0.12, 0))   # stock
box((-1.6, 0, -0.16), (0.08, 0.1, 0.4), wood)                       # butt plate
for s in (-1, 1):                                                    # bipod legs
    box((0.62, s * 0.06, -0.24), (0.025, 0.025, 0.46), gun, rot=(s * 0.35, 0.3, 0))
# crescent scythe blade at the muzzle, in the x-z plane, extruded in y
bm = bmesh.new()
pts = []
for k in range(25):
    th = math.radians(90 - 150 * k / 24)
    pts.append((1.55 + 0.72 * math.cos(th) - 0.1, 0.0 + 0.72 * math.sin(th) - 0.05))
for k in range(24, -1, -1):
    th = math.radians(90 - 150 * k / 24)
    rr = 0.72 - 0.2 * math.sin(math.pi * k / 24) ** 0.8
    pts.append((1.55 + rr * math.cos(th) - 0.1 + 0.12 * (1 - k / 24), 0.0 + rr * math.sin(th) - 0.05))
verts = [bm.verts.new((x - 0.4, -0.02, z)) for x, z in pts]
f = bm.faces.new(verts)
ext = bmesh.ops.extrude_face_region(bm, geom=[f])
for v in [e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)]:
    v.co.y += 0.04
me = bpy.data.meshes.new("blade")
bm.to_mesh(me)
bm.free()
ob = bpy.data.objects.new("blade", me)
bpy.context.collection.objects.link(ob)
objs.append(assign(ob, blade))
parent(objs, piv)
piv.rotation_euler[0] = 0
spin(piv, 2, 0, 360, a.frames, loop=True)
camera((0.2, -8.0, 0.25), (88, 0, 0), ortho_scale=4.3)
bpy.ops.render.render(animation=True)
