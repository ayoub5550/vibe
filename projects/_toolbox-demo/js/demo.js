// Toolbox demo: one clock (t), five technologies, all deterministic.
//   three.js  -> #gl : a ring of 12 cards textured from the Blender atlas (each with its own frame offset)
//   Canvas 2D -> #ov : the hero card (Blender atlas, drawImage by frame index) + beat rings
//   SVG       -> #svg: rays + the title outline
//   anime.js  -> drives the SVG (stroke draw, ray scale) through a paused timeline seeked to t*1000
//   Blender   -> assets/blender/card_atlas.png (tools/blender/card_spin.py + tools/sprite_atlas.py)
(function () {
  const DUR = 6, BPM = 120, SPB = 60 / BPM;
  const A = { frames: 48, cols: 12, rows: 4, w: 320, h: 320, fps: 30 }; // = card_atlas.json
  const D = (window.DEMO = {});
  let built = false, atlasCanvas, renderer, scene, camera, ring = [], ov, atlas, anim;

  function build() { // lazy: the DOM is not queried at top level (AGENTS.md N2)
    built = true;
    atlas = document.getElementById("atlas");
    ov = document.getElementById("ov").getContext("2d");
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gl"), antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(1920, 1080, false);
    renderer.setClearColor(0x070914, 1);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
    // three.js sizes a texture from image.width/height. For an <img> those are the CSS box (1x1
    // here), not the bitmap, so the upload overflows ("Offset overflows texture dimensions") and the
    // texture stays black. Copy the bitmap into a canvas of its natural size and texture that instead.
    const src = document.createElement("canvas");
    src.width = A.cols * A.w; src.height = A.rows * A.h;
    atlasCanvas = src;
    for (let i = 0; i < 12; i++) {
      const tex = new THREE.Texture(src);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(1 / A.cols, 1 / A.rows);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      scene.add(m);
      ring.push(m);
    }
    // SVG rays + anime.js timeline (paused; we seek it, HyperFrames never plays it)
    const g = document.getElementById("rays");
    for (let i = 0; i < 24; i++) {
      const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      const a = (i / 24) * Math.PI * 2;
      l.setAttribute("x1", Math.cos(a) * 260); l.setAttribute("y1", Math.sin(a) * 260);
      l.setAttribute("x2", Math.cos(a) * 900); l.setAttribute("y2", Math.sin(a) * 900);
      l.setAttribute("stroke", i % 2 ? "#ff3d6e" : "#ffd36b"); l.setAttribute("stroke-width", 6);
      l.setAttribute("stroke-linecap", "round"); l.setAttribute("class", "ray");
      g.appendChild(l);
    }
    const ttl = document.getElementById("ttl");
    anim = anime.timeline({ autoplay: false, easing: "easeOutExpo" })
      .add({ targets: ".ray", strokeDashoffset: [anime.setDashoffset, 0], opacity: [0, 0.8], delay: anime.stagger(25), duration: 900 }, 0)
      .add({ targets: "#rays", rotate: [0, 30], easing: "linear", duration: DUR * 1000 }, 0)
      // stroke-draw works on geometry (path/rect/line/circle), NOT on <text>: it has no getTotalLength()
      .add({ targets: "#frame", strokeDashoffset: [anime.setDashoffset, 0], duration: 1800, easing: "easeInOutSine" }, 2000)
      .add({ targets: "#ttl", strokeOpacity: [0, 1], letterSpacing: ["60px", "18px"], duration: 1800, easing: "easeOutQuart" }, 2000)
      .add({ targets: "#ttl", fill: ["rgba(255,211,107,0)", "rgba(255,211,107,1)"], duration: 600, easing: "linear" }, 3800);
    // PRIME (required): anime v3 does not paint a child's start values until that child has run
    // once, so a frame before its offset would show the element's raw SVG state. Seeking to the end
    // and back makes every later seek(t) a pure function of t, even out of order.
    anim.seek(DUR * 1000);
    anim.seek(0);
  }

  function frameOf(t, offset) { return (Math.floor(t * A.fps) + offset) % A.frames; }
  function setUV(tex, i) {
    const c = i % A.cols, r = Math.floor(i / A.cols);
    tex.offset.set(c / A.cols, 1 - (r + 1) / A.rows);
  }

  let uploaded = false;
  D.renderAt = function (t) {
    if (!built) build();
    // upload the atlas to WebGL only once the <img> has decoded (an early upload of a 0x0 image
    // leaves the texture black: "glTexSubImage2D: Offset overflows texture dimensions")
    if (!uploaded && atlas.complete && atlas.naturalWidth) {
      atlasCanvas.getContext("2d").drawImage(atlas, 0, 0);
      ring.forEach((m) => (m.material.map.needsUpdate = true));
      uploaded = true;
    }
    const b = t / SPB, beatPhase = b - Math.floor(b), kick = Math.exp(-beatPhase * 6);
    // three.js ring
    camera.position.set(0, 1.2 + 0.4 * Math.sin(t * 0.7), 9);
    camera.lookAt(0, 0, 0);
    ring.forEach((m, i) => {
      const a = (i / 12) * Math.PI * 2 + t * 0.6;
      m.position.set(Math.cos(a) * 5.2, Math.sin(a * 2) * 0.3, Math.sin(a) * 5.2 - 2);
      m.lookAt(camera.position);
      setUV(m.material.map, frameOf(t, i * 4));
    });
    renderer.render(scene, camera);
    // Canvas 2D hero card + beat rings
    ov.clearRect(0, 0, 1920, 1080);
    for (let k = 0; k < 3; k++) {
      const p = (beatPhase + k / 3) % 1;
      ov.strokeStyle = `rgba(255,61,110,${(1 - p) * 0.6})`;
      ov.lineWidth = 8 * (1 - p) + 1;
      ov.beginPath(); ov.arc(960, 470, 200 + p * 420, 0, Math.PI * 2); ov.stroke();
    }
    const i = frameOf(t, 0), s = 640 * (1 + 0.06 * kick);
    ov.drawImage(atlas, (i % A.cols) * A.w, Math.floor(i / A.cols) * A.h, A.w, A.h, 960 - s / 2, 470 - s / 2, s, s);
    // anime.js drives SVG: seek, never play
    anim.seek(Math.min(t, DUR) * 1000);
  };

  D.attachTimeline = function (tl) {
    const proxy = { t: 0 };
    tl.to(proxy, { t: DUR, duration: DUR, ease: "none", onUpdate: () => D.renderAt(proxy.t) }, 0);
    return tl;
  };
})();
