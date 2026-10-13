"""cage.py: the boy's birdcage (القفص), brass bars on a round base with a domed top and a hook,
cel-shaded with Freestyle ink lines (anime look, see _common.py).

  --mode spin : 16 bars, so a 22.5 degree turn loops; frame frames+1 equals frame 1 (24 frames).
  --mode burst: the cage breaks open: the bars fly outward and spin, the dome lifts (one-shot).
    tools/blender_run.sh projects/mawt/blender/cage.py -- --out /work/data/vibe/mawt/blender/cage --frames 24 --mode spin
    tools/blender_run.sh projects/mawt/blender/cage.py -- --out /work/data/vibe/mawt/blender/cageburst --frames 32 --mode burst
Used in mawt for «والصبي في القفص» (the boy in the cage) and the outro, where the hero breaks it.
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _common import args, scene, toon, assign, smooth, camera, spin, empty, parent, poly_tube, linear_keys

a = args({"frames": 24, "w": 320, "h": 400, "samples": 16, "mode": "spin"})
sc = scene(a)
brass = toon("brass", (0.88, 0.66, 0.29), (0.48, 0.30, 0.10), (1.0, 0.92, 0.62))
dark = toon("dark", (0.30, 0.20, 0.12), (0.14, 0.09, 0.05))
piv = empty()
N, R, H, TOP = 16, 1.0, 1.7, 2.45
parts = []      # (object, outward direction angle) for the burst

bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=R + 0.08, depth=0.16, location=(0, 0, -0.08))
base = smooth(assign(bpy.context.object, dark))
parts.append((base, None))
for z in (0.04, 0.85, H):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=0.035, major_segments=96, minor_segments=8, location=(0, 0, z))
    parts.append((smooth(assign(bpy.context.object, brass)), None))
for i in range(N):
    ang = 2 * math.pi * i / N
    c, s = math.cos(ang), math.sin(ang)
    pts = [(R * c, R * s, 0.0), (R * c, R * s, H)]
    for k in range(1, 13):                       # dome meridian up to the apex
        th = (math.pi / 2) * k / 12
        r = R * math.cos(th)
        pts.append((r * c, r * s, H + (TOP - H) * math.sin(th)))
    parts.append((poly_tube(f"bar{i}", pts, 0.028, brass), ang))
bpy.ops.mesh.primitive_torus_add(major_radius=0.16, minor_radius=0.035, location=(0, 0, TOP + 0.17), rotation=(math.pi / 2, 0, 0))
hook = smooth(assign(bpy.context.object, brass))
parts.append((hook, None))
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.03, depth=2 * R * 0.96, location=(0, 0, 0.62), rotation=(0, math.pi / 2, 0))
parts.append((smooth(assign(bpy.context.object, dark)), None))
parent([p for p, _ in parts], piv)

if a.mode == "spin":
    spin(piv, 2, 0, 360 / N, a.frames, loop=True)
else:
    piv.rotation_euler[2] = 0
    F = a.frames
    for p, ang in parts:
        p.keyframe_insert("location", frame=1)
        p.keyframe_insert("rotation_euler", frame=1)
        if ang is None:
            if p is hook:
                p.location.z += 2.2
            elif p is base:
                p.location.z -= 0.3
            else:
                p.location.z += (p.location.z - 0.8) * 1.4
        else:
            d = 2.2 + 0.6 * (int(ang * 1000) % 7) / 7
            p.location.x += math.cos(ang) * d
            p.location.y += math.sin(ang) * d
            p.location.z += 0.6 + 0.3 * math.sin(ang * 3)
            p.rotation_euler = (math.sin(ang) * 1.2, -math.cos(ang) * 1.2, 0.4)
        p.keyframe_insert("location", frame=F)
        p.keyframe_insert("rotation_euler", frame=F)
        linear_keys(p)

# orthographic, looking 8 degrees down at the cage centre (z = 1.3); the burst needs a wider frame
camera((0, -9.0, 1.3 + 9.0 * math.tan(math.radians(8))), (82, 0, 0), ortho_scale=4.3 if a.mode == "spin" else 8.0)
bpy.ops.render.render(animation=True)
