import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function BioCapsidCanvas({ className = "w-full h-full" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 500;
    const height = mount.clientHeight || 500;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Group for the entire biological virus/capsid model
    const capsidGroup = new THREE.Group();
    scene.add(capsidGroup);

    // ── Shaders & Materials (Cyan-Blue & Light Pink Palette from Image 1) ──
    const outerCyanMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7, // Clinical Cyan Blue
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });

    const innerPinkMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e, // Soft Light Pink / Rose
      emissive: 0xfb7185,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    const tipCyanLightMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8, // Sky Cyan Highlight
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.1,
    });

    // 1. Central Spherical Core (Porous textured core)
    const coreGeo = new THREE.IcosahedronGeometry(2.4, 4);
    // Deform vertices slightly for organic cell look
    const pos = coreGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      const len = v.length();
      const noise = 1.0 + Math.sin(v.x * 5) * Math.cos(v.y * 5) * 0.08;
      v.normalize().multiplyScalar(len * noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    coreGeo.computeVertexNormals();
    const coreMesh = new THREE.Mesh(coreGeo, outerCyanMat);
    capsidGroup.add(coreMesh);

    // Inner glowing pink core
    const innerGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const innerMesh = new THREE.Mesh(innerGeo, innerPinkMat);
    capsidGroup.add(innerMesh);

    // 2. Outward-Projecting Receptor Spikes (Fibonacci Sphere Distribution)
    const spikeCount = 68;
    const spikeStemGeo = new THREE.CylinderGeometry(0.08, 0.22, 1.4, 10);
    const spikeTipGeo = new THREE.SphereGeometry(0.24, 14, 14);
    const innerSpikeGeo = new THREE.ConeGeometry(0.2, 0.8, 8);

    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < spikeCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / spikeCount);

      const dir = new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(phi)
      ).normalize();

      // Spike stem
      const stemMesh = new THREE.Mesh(spikeStemGeo, i % 3 === 0 ? innerPinkMat : outerCyanMat);
      stemMesh.position.copy(dir.clone().multiplyScalar(2.9));
      stemMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      capsidGroup.add(stemMesh);

      // Spike crown/tip (alternating light pink and cyan blue)
      const tipMat = i % 2 === 0 ? innerPinkMat : tipCyanLightMat;
      const tipMesh = new THREE.Mesh(spikeTipGeo, tipMat);
      tipMesh.position.copy(dir.clone().multiplyScalar(3.6));
      capsidGroup.add(tipMesh);

      // Tiny outer receptor floret
      if (i % 3 === 0) {
        const miniSpike = new THREE.Mesh(innerSpikeGeo, innerPinkMat);
        miniSpike.position.copy(dir.clone().multiplyScalar(3.8));
        miniSpike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        miniSpike.scale.set(0.6, 0.6, 0.6);
        capsidGroup.add(miniSpike);
      }
    }

    // 3. Surrounding Floating Clinical Atoms / Ions (Cyan-Blue & Pink)
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cCyan = new THREE.Color(0x38bdf8);
    const cPink = new THREE.Color(0xfb7185);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const r = 5.0 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[idx] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = r * Math.cos(phi);

      const chosenColor = i % 2 === 0 ? cCyan : cPink;
      colors[idx] = chosenColor.r;
      colors[idx + 1] = chosenColor.g;
      colors[idx + 2] = chosenColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Lighting Rig (Direct Cyan-Blue Key + Soft Pink Rim Light from Image 1) ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    // Primary Cyan-Blue Key Light
    const cyanLight = new THREE.DirectionalLight(0x0284c7, 3.5);
    cyanLight.position.set(15, 12, 15);
    scene.add(cyanLight);

    // Warm Light Pink Rim Light (Image 1 illumination)
    const pinkRimLight = new THREE.DirectionalLight(0xf43f5e, 3.0);
    pinkRimLight.position.set(-15, -10, 10);
    scene.add(pinkRimLight);

    // Top Sky Cyan Fill
    const topFill = new THREE.PointLight(0x38bdf8, 2.0, 30);
    topFill.position.set(0, 15, 10);
    scene.add(topFill);

    // Mouse Tracking Parallax
    let targetX = 0;
    let targetY = 0;
    const handleMouseMove = (e) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetY = mouseX * 0.5;
      targetX = -mouseY * 0.4;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Continuous rotation
      capsidGroup.rotation.y += 0.007;
      capsidGroup.rotation.x += (targetX - capsidGroup.rotation.x) * 0.05;
      capsidGroup.rotation.z += (targetY * 0.3 - capsidGroup.rotation.z) * 0.05;

      // Gentle organic breathing pulse
      const breathe = 1.0 + Math.sin(elapsed * 1.5) * 0.035;
      capsidGroup.scale.set(breathe, breathe, breathe);

      // Orbiting particles
      particles.rotation.y += 0.003;
      particles.rotation.x += 0.0015;

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth;
      const newH = mount.clientHeight;
      if (newW && newH) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} />;
}
