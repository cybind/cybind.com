import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import chromaticFrag from '../shaders/chromatic.frag';
import grainFrag from '../shaders/grain.frag';

const passThruVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function createPostProcessing(renderer, scene, camera, isMobile) {
  const composer = new EffectComposer(renderer);

  // Render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom - skip on mobile for performance
  if (!isMobile) {
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,   // strength (reduced for wireframe)
      0.3,   // radius
      0.2    // threshold (lower to catch dim wireframe lines)
    );
    composer.addPass(bloomPass);
  }

  // Chromatic aberration
  const chromaticShader = {
    uniforms: {
      tDiffuse: { value: null },
      uOffset: { value: 0.002 },
    },
    vertexShader: passThruVert,
    fragmentShader: chromaticFrag,
  };
  const chromaticPass = new ShaderPass(chromaticShader);
  composer.addPass(chromaticPass);

  // Film grain
  const grainShader = {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uIntensity: { value: 0.06 },
    },
    vertexShader: passThruVert,
    fragmentShader: grainFrag,
  };
  const grainPass = new ShaderPass(grainShader);
  composer.addPass(grainPass);

  // Handle resize
  window.addEventListener('resize', () => {
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    composer,
    chromaticUniforms: chromaticShader.uniforms,
    grainUniforms: grainShader.uniforms,
  };
}
