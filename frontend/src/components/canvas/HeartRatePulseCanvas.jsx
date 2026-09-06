import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeartRatePulseCanvas({ className = "w-full h-full" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 280;
    const height = mount.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // ── 1. Elegant 3D Extruded Popping Heart ────────────────────────────
    const heartShape = new THREE.Shape();
    const s = 1.32;
    heartShape.moveTo(0, 0.7 * s);
    heartShape.bezierCurveTo(0, 1.35 * s, -1.4 * s, 1.35 * s, -1.4 * s, 0.35 * s);
    heartShape.bezierCurveTo(-1.4 * s, -0.45 * s, -0.55 * s, -1.15 * s, 0, -1.7 * s);
    heartShape.bezierCurveTo(0.55 * s, -1.15 * s, 1.4 * s, -0.45 * s, 1.4 * s, 0.35 * s);
    heartShape.bezierCurveTo(1.4 * s, 1.35 * s, 0, 1.35 * s, 0, 0.7 * s);

    const extrudeSettings = {
      depth: 0.8,
      bevelEnabled: true,
      bevelSegments: 10,
      steps: 3,
      bevelSize: 0.3,
      bevelThickness: 0.3,
    };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    heartGeo.center();

    // Solid glossy medical heart core (Vibrant Cyan-Blue with Internal Bioluminescent Sheen)
    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7, // Vibrant cyan blue
      emissive: 0x0891b2,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.95,
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);

    // Wireframe holographic heart overlay for clinical med-tech aesthetics (Emerald Green)
    const wireHeartMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Emerald green
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const wireHeartMesh = new THREE.Mesh(heartGeo, wireHeartMat);
    wireHeartMesh.scale.set(1.035, 1.035, 1.035);

    const heartGroup = new THREE.Group();
    heartGroup.add(heartMesh);
    heartGroup.add(wireHeartMesh);
    group.add(heartGroup);

    // ── 2. Concentric Orbiting Rings (Clinical Mint / Teal) ───────────
    const ringGeo1 = new THREE.TorusGeometry(3.7, 0.05, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x0d9488, transparent: true, opacity: 0.75 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    group.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(4.3, 0.04, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.65 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    group.add(ring2);

    // ── 3. Radiating Shockwave Ring (Synchronized with lub-dub beat) ────
    const shockwaveGeo = new THREE.RingGeometry(3.1, 3.24, 64);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    group.add(shockwave);

    // ── 4. 18 Orbital Vitality Nodes (Matching User Image) ─────────────
    const nodeGeo = new THREE.SphereGeometry(0.14, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const nodeCount = 18;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const theta = (i / nodeCount) * Math.PI * 2;
      node.position.set(Math.cos(theta) * 3.7, Math.sin(theta) * 3.7, 0);
      group.add(node);
      nodes.push({ mesh: node, angle: theta });
    }

    // ── 5. Bright Medical Studio Lighting ──────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x0284c7, 2.2, 40);
    pointLight.position.set(5, 6, 8);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(0x10b981, 1.8, 30);
    backLight.position.set(-5, -5, 6);
    scene.add(backLight);

    // ── 6. Animation Loop: Physiological Lub-Dub Popping Rhythm ────────
    let animId;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Realistic "lub-dub" physiological heartbeat rhythm
      const beatCycle = (elapsed % 1.05) / 1.05;
      let heartScale = 1.0;
      let shockScale = 1.0;
      let shockOpacity = 0.0;

      if (beatCycle < 0.14) {
        // First systolic contraction (Lub)
        const t = beatCycle / 0.14;
        heartScale = 1.0 + Math.sin(t * Math.PI) * 0.28;
        shockScale = 1.0 + t * 0.6;
        shockOpacity = Math.sin(t * Math.PI) * 0.7;
      } else if (beatCycle > 0.18 && beatCycle < 0.32) {
        // Second valve contraction (Dub)
        const t = (beatCycle - 0.18) / 0.14;
        heartScale = 1.0 + Math.sin(t * Math.PI) * 0.18;
        shockScale = 1.25 + t * 0.45;
        shockOpacity = Math.sin(t * Math.PI) * 0.45;
      } else {
        // Relaxation
        heartScale = 1.0 + Math.sin(elapsed * 2) * 0.02;
      }

      // Heart scale & gentle tilt
      heartGroup.scale.set(heartScale, heartScale, heartScale);
      heartGroup.rotation.y = Math.sin(elapsed * 0.8) * 0.12;

      // Expand shockwave
      shockwave.scale.set(shockScale, shockScale, shockScale);
      shockwave.material.opacity = shockOpacity;

      // Counter-rotating concentric rings
      ring1.rotation.z += 0.012;
      ring1.rotation.y += 0.005;

      ring2.rotation.x += 0.008;
      ring2.rotation.z -= 0.007;

      // 18 Vitality nodes orbital movement
      nodes.forEach((n) => {
        n.angle += 0.011;
        const currentR = 3.7 * ((heartScale - 1.0) * 0.3 + 1.0);
        n.mesh.position.x = Math.cos(n.angle) * currentR;
        n.mesh.position.y = Math.sin(n.angle) * currentR;
      });

      // Subtle sway
      group.rotation.y = Math.sin(elapsed * 0.4) * 0.18;

      renderer.render(scene, camera);
    };

    animate();

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
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} />;
}
