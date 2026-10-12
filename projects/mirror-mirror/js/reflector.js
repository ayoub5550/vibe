// reflector.js — planar mirror floor, adapted from three.js examples/jsm/objects/Reflector.js (MIT).
// Changes: global THREE (UMD build), no MSAA, blue "shadow world" tint, distance fade, and
// onPreReflect/onPostReflect hooks so the hero's reflection can be drawn as his blue shadow self.
window.MV = window.MV || {};
(function () {
  class Reflector extends THREE.Mesh {
    constructor(geometry, options = {}) {
      super(geometry);
      this.isReflector = true;
      this.type = "Reflector";
      this.camera = new THREE.PerspectiveCamera();
      const scope = this;
      const textureWidth = options.textureWidth || 960;
      const textureHeight = options.textureHeight || 540;
      const clipBias = options.clipBias || 0.003;
      const reflectorPlane = new THREE.Plane();
      const normal = new THREE.Vector3();
      const reflectorWorldPosition = new THREE.Vector3();
      const cameraWorldPosition = new THREE.Vector3();
      const rotationMatrix = new THREE.Matrix4();
      const lookAtPosition = new THREE.Vector3(0, 0, -1);
      const clipPlane = new THREE.Vector4();
      const view = new THREE.Vector3();
      const target = new THREE.Vector3();
      const q = new THREE.Vector4();
      const textureMatrix = new THREE.Matrix4();
      const virtualCamera = this.camera;
      const renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight, { samples: 0, type: THREE.UnsignedByteType });
      renderTarget.texture.colorSpace = THREE.SRGBColorSpace;

      this.material = new THREE.ShaderMaterial({
        name: "MirrorFloor",
        uniforms: {
          tDiffuse: { value: renderTarget.texture },
          textureMatrix: { value: textureMatrix },
          tint: { value: new THREE.Color(options.tint || 0x6ea8ff) },
          strength: { value: options.strength !== undefined ? options.strength : 0.85 },
          base: { value: new THREE.Color(options.base || 0x03060f) },
          fadeRadius: { value: options.fadeRadius || 26.0 },
        },
        vertexShader: `
          uniform mat4 textureMatrix;
          varying vec4 vUv;
          varying vec3 vWorld;
          void main() {
            vUv = textureMatrix * vec4(position, 1.0);
            vec4 w = modelMatrix * vec4(position, 1.0);
            vWorld = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform vec3 tint;
          uniform vec3 base;
          uniform float strength;
          uniform float fadeRadius;
          varying vec4 vUv;
          varying vec3 vWorld;
          void main() {
            vec4 r = texture2DProj(tDiffuse, vUv);
            float lum = dot(r.rgb, vec3(0.299, 0.587, 0.114));
            // shadow world: keep some original colour, push toward blue
            vec3 refl = mix(r.rgb, vec3(lum) * tint * 1.5, 0.5);
            refl = refl * refl * 1.7;
            float fade = 1.0 - smoothstep(fadeRadius * 0.35, fadeRadius, length(vWorld.xz));
            gl_FragColor = vec4(base + refl * strength * fade, 1.0);
            #include <colorspace_fragment>
          }`,
      });

      this.onPreReflect = options.onPreReflect || null;
      this.onPostReflect = options.onPostReflect || null;

      this.onBeforeRender = function (renderer, scene, camera) {
        reflectorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
        cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
        rotationMatrix.extractRotation(scope.matrixWorld);
        normal.set(0, 0, 1);
        normal.applyMatrix4(rotationMatrix);
        view.subVectors(reflectorWorldPosition, cameraWorldPosition);
        if (view.dot(normal) > 0) return;
        view.reflect(normal).negate();
        view.add(reflectorWorldPosition);
        rotationMatrix.extractRotation(camera.matrixWorld);
        lookAtPosition.set(0, 0, -1);
        lookAtPosition.applyMatrix4(rotationMatrix);
        lookAtPosition.add(cameraWorldPosition);
        target.subVectors(reflectorWorldPosition, lookAtPosition);
        target.reflect(normal).negate();
        target.add(reflectorWorldPosition);
        virtualCamera.position.copy(view);
        virtualCamera.up.set(0, 1, 0);
        virtualCamera.up.applyMatrix4(rotationMatrix);
        virtualCamera.up.reflect(normal);
        virtualCamera.lookAt(target);
        virtualCamera.far = camera.far;
        virtualCamera.updateMatrixWorld();
        virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
        textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
        textureMatrix.multiply(virtualCamera.projectionMatrix);
        textureMatrix.multiply(virtualCamera.matrixWorldInverse);
        textureMatrix.multiply(scope.matrixWorld);
        reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition);
        reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);
        clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);
        const projectionMatrix = virtualCamera.projectionMatrix;
        q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        q.z = -1.0;
        q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
        clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
        projectionMatrix.elements[2] = clipPlane.x;
        projectionMatrix.elements[6] = clipPlane.y;
        projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
        projectionMatrix.elements[14] = clipPlane.w;
        scope.visible = false;
        if (scope.onPreReflect) scope.onPreReflect(virtualCamera);
        const currentRenderTarget = renderer.getRenderTarget();
        renderer.setRenderTarget(renderTarget);
        renderer.state.buffers.depth.setMask(true);
        if (renderer.autoClear === false) renderer.clear();
        renderer.render(scene, virtualCamera);
        renderer.setRenderTarget(currentRenderTarget);
        const viewport = camera.viewport;
        if (viewport !== undefined) renderer.state.viewport(viewport);
        if (scope.onPostReflect) scope.onPostReflect(virtualCamera);
        scope.visible = true;
      };
    }
  }
  MV.Reflector = Reflector;
})();
