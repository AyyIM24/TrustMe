import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DnaHelixCanvas({ className = "w-full h-full", opacity = 0.85 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 24);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.opacity = opacity;
    renderer.domElement.style.transition = 'opacity 0.8s ease-in-out';
    mount.appendChild(renderer.domElement);

    // Group for the entire DNA structure
    const dnaGroup = new THREE.Group();
    // Tilt slightly for graceful perspective
    dnaGroup.rotation.z = -Math.PI / 12;
    scene.add(dnaGroup);

    // Clean, modern clinical materials (Tri-Tone Palette: Cyan-Blue, Cyan-Green & Soft Rose Pink)
    const medicalBlueMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7, // Clinical Cyan-Blue
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.90,
    });

    const medicalTealMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d9488, // Clean Medical Cyan-Green / Mint
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.4,
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.90,
    });

    const medicalPinkMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e, // Soft Medical Rose / Blush Pink (from user reference)
      emissive: 0xfb7185,
      emissiveIntensity: 0.38,
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.90,
    });

    const rungMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });

    // Create DNA strands & rungs (Balanced wide framing)
    const numPairs = 38;
    const radius = 4.6;
    const heightSpan = 24;
    const sphereGeo = new THREE.SphereGeometry(0.36, 24, 24);
    const coreSphereGeo = new THREE.SphereGeometry(0.20, 16, 16);
    const rungGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, 12);

    const materials = [medicalBlueMat, medicalTealMat, medicalPinkMat];

    for (let i = 0; i < numPairs; i++) {
      const t = (i / numPairs) * Math.PI * 3.6; // 1.8 twists
      const y = ((i - numPairs / 2) / numPairs) * heightSpan;

      const x1 = Math.cos(t) * radius;
      const z1 = Math.sin(t) * radius;

      const x2 = Math.cos(t + Math.PI) * radius;
      const z2 = Math.sin(t + Math.PI) * radius;

      // Node 1 (Strand A - Cyan-Blue / Pink rotation)
      const mat1 = materials[i % 3];
      const sphere1 = new THREE.Mesh(sphereGeo, mat1);
      sphere1.position.set(x1, y, z1);
      dnaGroup.add(sphere1);

      // Node 2 (Strand B - Cyan-Green / Blue / Pink rotation)
      const mat2 = materials[(i + 1) % 3];
      const sphere2 = new THREE.Mesh(sphereGeo, mat2);
      sphere2.position.set(x2, y, z2);
      dnaGroup.add(sphere2);

      // Connecting base-pair rung
      const rung = new THREE.Mesh(rungGeo, rungMaterial);
      const midpoint = new THREE.Vector3((x1 + x2) / 2, y, (z1 + z2) / 2);
      rung.position.copy(midpoint);
      rung.scale.set(1, radius * 2, 1);
      rung.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(x1 - x2, 0, z1 - z2).normalize()
      );
      dnaGroup.add(rung);

      // Delicate central kinase core node (Soft Pink or Cyan-Green)
      if (i % 2 === 0) {
        const coreNode = new THREE.Mesh(coreSphereGeo, i % 4 === 0 ? medicalPinkMat : medicalTealMat);
        coreNode.position.copy(midpoint);
        dnaGroup.add(coreNode);
      }
    }

    // Floating Ambient Clinical Ions (Delicate tri-color micro-particles)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const particleColors = [
      new THREE.Color(0x38bdf8), // Cyan-Blue
      new THREE.Color(0x2dd4bf), // Cyan-Green
      new THREE.Color(0xfb7185), // Soft Pink
    ];

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * 34;
      positions[idx + 1] = (Math.random() - 0.5) * 34;
      positions[idx + 2] = (Math.random() - 0.5) * 24;

      const c = particleColors[i % 3];
      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Bright, Clean Medical Studio Lighting Rig (Tri-directional)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    // Cyan-Blue Key Light
    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(20, 25, 20);
    scene.add(dirLight1);

    // Cyan-Green Fill Light
    const dirLight2 = new THREE.DirectionalLight(0x2dd4bf, 1.8);
    dirLight2.position.set(-20, -15, 15);
    scene.add(dirLight2);

    // Soft Rose Pink Rim Light (Image 1 Warm Biological Accent)
    const dirLight3 = new THREE.DirectionalLight(0xf43f5e, 1.6);
    dirLight3.position.set(10, -20, -15);
    scene.add(dirLight3);

    // Subtle Mouse-Reactive Parallax Rotation
    let targetRotationX = 0;
    let targetRotationY = 0;
    const handleMouseMove = (e) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotationY = mouseX * 0.45;
      targetRotationX = -mouseY * 0.35;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop with smooth floating sinusoidal transition
    let animId;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Continuous gentle rotation around Y axis
      dnaGroup.rotation.y += 0.008;
      dnaGroup.rotation.x += (targetRotationX - dnaGroup.rotation.x) * 0.05;
      dnaGroup.rotation.z += (targetRotationY * 0.2 - dnaGroup.rotation.z) * 0.05;

      // Gentle floating levitation transition
      dnaGroup.position.y = Math.sin(elapsed * 0.7) * 0.5;

      // Particle floating
      particles.rotation.y += 0.002;
      particles.rotation.x += 0.001;

      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
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
  }, [opacity]);

  return <div ref={mountRef} className={className} />;
}
