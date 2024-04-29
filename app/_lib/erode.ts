import * as THREE from "three";

export function ErodeShader(
  width: number,
  height: number,
  radius: number,
): THREE.ShaderMaterialParameters {
  return {
    uniforms: {
      tDiffuse: { value: null },
      resolution: { value: new THREE.Vector2(width, height) },
      radius: { value: radius },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float radius;
      varying vec2 vUv;
      void main() {
        vec4 center = texture2D(tDiffuse, vUv);
        vec3 val = center.rgb;
        for (float i = -radius; i <= radius; i++) {
          for (float j = -radius; j <= radius; j++) {
            vec3 color = texture2D(tDiffuse, vUv + vec2(i, j) / resolution).rgb;
            val = min(val, color);
          }
        }
        gl_FragColor = vec4(val, center.a);
      }
    `,
  };
}
