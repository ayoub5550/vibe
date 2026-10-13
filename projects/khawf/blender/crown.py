"""crown.py: a Shah's crown (taj) in gold with ruby and turquoise stones, eight pointed spikes topped
with pearls, a red velvet cap and an onion-and-spike finial. It spins 90 degrees (the stone pattern repeats
every 90 degrees), so frame frames+1 equals frame 1.

    tools/blender_run.sh projects/khawf/blender/crown.py -- --out /work/data/vibe/khawf/blender/crown --frames 48 --w 384 --h 384
Used in khawf for "the king" (يا عامر الملك) and the costume of Caesar or Shah (زي قيصر أو شاه).
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _common import args, scene, mat, assign, smooth, light, camera, spin_z, empty, parent

a = args({"frames": 48, "w": 384, "h": 384, "samples": 48})
sc = scene(a)
gold = mat("gold", (1.0, 0.72, 0.3), rough=0.2, metal=1.0)
ruby = mat("ruby", (0.75, 0.03, 0.06), rough=0.05, emit=0.6, emit_rgb=(0.8, 0.05, 0.08))
turq = mat("turq", (0.05, 0.6, 0.58), rough=0.1, emit=0.4, emit_rgb=(0.1, 0.7, 0.65))
pearl = mat("pearl", (0.96, 0.93, 0.86), rough=0.15)
velvet = mat("velvet", (0.45, 0.03, 0.06), rough=0.85)
piv = empty()
objs = []
R = 0.8
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=R, depth=0.42, location=(0, 0, 0))
band = bpy.context.object
sol = band.modifiers.new("s", "SOLIDIFY"); sol.thickness = 0.06
objs.append(smooth(assign(band, gold)))
for z in (0.22, -0.22):
    bpy.ops.mesh.primitive_torus_add(major_radius=R + 0.02, minor_radius=0.04, major_segments=64, location=(0, 0, z))
    objs.append(smooth(assign(bpy.context.object, gold)))
bpy.ops.mesh.primitive_uv_sphere_add(radius=R * 0.94, location=(0, 0, 0.18))
cap = bpy.context.object
cap.scale = (1, 1, 0.55)
objs.append(smooth(assign(cap, velvet)))
for i in range(8):
    ang = math.radians(45 * i)
    x, y = (R + 0.01) * math.cos(ang), (R + 0.01) * math.sin(ang)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.22, radius2=0.0, depth=0.62, location=(x, y, 0.5), rotation=(0, 0, ang + math.pi / 4))
    sp = bpy.context.object
    sp.scale = (1, 0.35, 1)
    objs.append(assign(sp, gold))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(x, y, 0.84))
    objs.append(smooth(assign(bpy.context.object, pearl)))
    # stone on the band
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=((R + 0.05) * math.cos(ang), (R + 0.05) * math.sin(ang), 0))
    st = bpy.context.object
    st.scale = (0.6, 0.6, 1.0) if i % 2 else (0.7, 0.7, 0.7)
    objs.append(smooth(assign(st, ruby if i % 2 == 0 else turq)))
    # small pearls between stones
    a2 = ang + math.radians(22.5)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=((R + 0.05) * math.cos(a2), (R + 0.05) * math.sin(a2), 0))
    objs.append(smooth(assign(bpy.context.object, pearl)))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(0, 0, 1.08))
objs.append(smooth(assign(bpy.context.object, gold)))
# finial: rotationally symmetric (onion + spike + pearl), so the 90-degree spin loops exactly
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(0, 0, 1.26))
on = bpy.context.object
on.scale = (1, 1, 1.4)
objs.append(smooth(assign(on, gold)))
bpy.ops.mesh.primitive_cone_add(radius1=0.04, radius2=0.0, depth=0.26, location=(0, 0, 1.5))
objs.append(assign(bpy.context.object, gold))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(0, 0, 1.64))
objs.append(smooth(assign(bpy.context.object, pearl)))
parent(objs, piv)
light("AREA", (-3, -4, 4), (50, 0, -35), 900, size=4, color=(1.0, 0.88, 0.7))
light("AREA", (4, 2, 2), (70, 0, 120), 500, size=3, color=(0.7, 0.85, 1.0))
light("AREA", (0, -3, -2), (120, 0, 0), 150, size=3, color=(1.0, 0.7, 0.4))
camera((0, -6.2, 2.05), (73, 0, 0), lens=78)
spin_z(piv, 0, 90, a.frames, loop=True)
bpy.ops.render.render(animation=True)
print(f"crown: wrote {a.frames} frames to {a.out}_####.png")
