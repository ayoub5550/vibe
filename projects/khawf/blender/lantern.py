"""lantern.py: a brass Arabic lantern (fanous) with pierced eight-point-star panels and a flame inside.

    tools/blender_run.sh projects/khawf/blender/lantern.py -- --out /work/data/vibe/khawf/blender/lantern --frames 48 --w 384 --h 512
The body is hexagonal, so 60 degrees of spin is a full loop: frame 49 would equal frame 1.
Used in khawf as the lamp of the shadow theatre (Canvas 2D drawImage by frame = f(t)).
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _common import args, scene, mat, assign, smooth, light, camera, spin_z, empty, parent

a = args({"frames": 48, "w": 384, "h": 512, "samples": 48})
sc = scene(a)
brass = mat("brass", (0.86, 0.6, 0.26), rough=0.28, metal=1.0)
dark = mat("darkbrass", (0.42, 0.27, 0.1), rough=0.4, metal=1.0)
glass = mat("glass", (1.0, 0.62, 0.25), rough=0.2, emit=5.5, emit_rgb=(1.0, 0.55, 0.18))
flame = mat("flame", (1, 0.85, 0.5), emit=30, emit_rgb=(1.0, 0.8, 0.45))
piv = empty()
objs = []
R, H = 0.6, 1.2
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=R * 0.93, depth=H)
objs.append(assign(bpy.context.object, glass))
# pierced panels: one plate per face, with a collection of star cutters
cut_col = bpy.data.collections.new("cutters")
sc.collection.children.link(cut_col)
apo = R * math.cos(math.radians(30))
for i in range(6):
    ang = math.radians(60 * i + 30)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(apo * math.cos(ang), apo * math.sin(ang), 0))
    pl = bpy.context.object
    pl.scale = (0.03, R * 0.98, H * 0.96)
    pl.rotation_euler[2] = ang
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    assign(pl, brass)
    objs.append(pl)
    for row in range(5):
        z = -0.44 + row * 0.22
        offs = (-0.13, 0.13) if row % 2 == 0 else (0.0,)
        for off in offs:
            cx = apo * math.cos(ang) - math.sin(ang) * off
            cy = apo * math.sin(ang) + math.cos(ang) * off
            for rot in (0, 45):  # two squares rotated 45 degrees in the panel plane = an eight-point star
                bpy.ops.mesh.primitive_cube_add(size=0.12, location=(cx, cy, z), rotation=(math.radians(rot), 0, ang))
                c = bpy.context.object
                c.scale = (3.0, 1.0, 1.0)  # deep along the panel normal (local X) so it cuts through
                for coll in c.users_collection:
                    coll.objects.unlink(c)
                cut_col.objects.link(c)
    m = pl.modifiers.new("holes", "BOOLEAN")
    m.operation = "DIFFERENCE"
    m.operand_type = "COLLECTION"
    m.collection = cut_col
    m.solver = "EXACT"
    bpy.context.view_layer.objects.active = pl
    bpy.ops.object.modifier_apply(modifier="holes")
    for c in list(cut_col.objects):
        bpy.data.objects.remove(c, do_unlink=True)
cut_col.hide_render = True
# corner posts and rings
for i in range(6):
    ang = math.radians(60 * i)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=H + 0.1, location=(R * math.cos(ang), R * math.sin(ang), 0))
    objs.append(smooth(assign(bpy.context.object, brass)))
for z in (H / 2, -H / 2):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=R + 0.06, depth=0.08, location=(0, 0, z))
    objs.append(assign(bpy.context.object, dark))
# roof: hexagonal pyramid + onion dome + finial ring
bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=R + 0.12, radius2=0.12, depth=0.55, location=(0, 0, H / 2 + 0.3))
objs.append(assign(bpy.context.object, brass))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.2, location=(0, 0, H / 2 + 0.68))
d = bpy.context.object
d.scale = (1, 1, 1.25)
objs.append(smooth(assign(d, brass)))
bpy.ops.mesh.primitive_cone_add(radius1=0.06, radius2=0.0, depth=0.25, location=(0, 0, H / 2 + 1.0))
objs.append(assign(bpy.context.object, brass))
bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.03, location=(0, 0, H / 2 + 1.24), rotation=(math.radians(90), 0, 0))
objs.append(smooth(assign(bpy.context.object, dark)))
# base: inverted cone + ball
bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.22, radius2=R + 0.06, depth=0.4, location=(0, 0, -H / 2 - 0.22))
objs.append(assign(bpy.context.object, brass))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, location=(0, 0, -H / 2 - 0.52))
objs.append(smooth(assign(bpy.context.object, brass)))
# flame inside
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(0, 0, -0.05))
f = bpy.context.object
f.scale = (1, 1, 2.2)
objs.append(smooth(assign(f, flame)))
parent(objs, piv)
light("POINT", (0, 0, 0), (0, 0, 0), 120, size=0.2, color=(1.0, 0.6, 0.25))
light("AREA", (-3, -4, 2.5), (60, 0, -35), 420, size=3, color=(1.0, 0.85, 0.7))
light("AREA", (3.5, 2.5, 1.5), (70, 0, 125), 220, size=2, color=(0.6, 0.75, 1.0))
camera((0, -7.6, 0.75), (86, 0, 0), lens=72)
spin_z(piv, 0, 60, a.frames, loop=True)
bpy.ops.render.render(animation=True)
print(f"lantern: wrote {a.frames} frames to {a.out}_####.png")
