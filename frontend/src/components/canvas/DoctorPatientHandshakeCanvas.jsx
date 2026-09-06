import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DoctorPatientHandshakeCanvas({
  sequenceState = 'ENTRY', // 'ENTRY' | 'HANDSHAKE' | 'VERIFICATION' | 'SUCCESS' | 'FAILURE'
  className = "w-full h-full"
}) {
  const mountRef = useRef(null);
  const stateRef = useRef(sequenceState);

  useEffect(() => {
    stateRef.current = sequenceState;
  }, [sequenceState]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.6, 10.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // ── Lighting ──────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    const topKeyLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    topKeyLight.position.set(4, 9, 8);
    scene.add(topKeyLight);

    const warmRimLight = new THREE.PointLight(0xf43f5e, 1.8, 30);
    warmRimLight.position.set(-6, 5, -4);
    scene.add(warmRimLight);

    const bottomFillLight = new THREE.PointLight(0x10b981, 1.4, 25);
    bottomFillLight.position.set(0, -3, 6);
    scene.add(bottomFillLight);

    // ── Stage: Subtle Glowing Dais Floor ──────────────────────────────
    const daisGeo = new THREE.CylinderGeometry(5.8, 6.2, 0.35, 48);
    const daisMat = new THREE.MeshPhysicalMaterial({
      color: 0xd6ebfc,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const dais = new THREE.Mesh(daisGeo, daisMat);
    dais.position.y = -1.95;
    scene.add(dais);

    const daisRingGeo = new THREE.TorusGeometry(5.8, 0.04, 16, 64);
    const daisRingMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 });
    const daisRing = new THREE.Mesh(daisRingGeo, daisRingMat);
    daisRing.rotation.x = Math.PI / 2;
    daisRing.position.y = -1.77;
    scene.add(daisRing);

    // ── Character Builder ─────────────────────────────────────────────
    const createCharacter = (isDoctor = true) => {
      const root = new THREE.Group();

      const skinMat = new THREE.MeshLambertMaterial({ color: isDoctor ? 0xffdfc4 : 0xfcd0ba });
      const hairMat = new THREE.MeshLambertMaterial({ color: isDoctor ? 0x1e293b : 0x475569 });
      const scrubMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.5 });
      const coatMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.2, clearcoat: 0.8 });
      const patientShirtMat = new THREE.MeshPhysicalMaterial({ color: 0x0d9488, roughness: 0.4 });
      const pantsMat = new THREE.MeshLambertMaterial({ color: isDoctor ? 0x0369a1 : 0x334155 });
      const shoeMat = new THREE.MeshLambertMaterial({ color: isDoctor ? 0x0f172a : 0x64748b });

      const torsoGroup = new THREE.Group();
      torsoGroup.position.y = -0.1;

      // Chest
      const chestGeo = new THREE.CylinderGeometry(0.55, 0.48, 1.25, 16);
      const chestMesh = new THREE.Mesh(chestGeo, isDoctor ? coatMat : patientShirtMat);
      torsoGroup.add(chestMesh);

      if (isDoctor) {
        // Inner V-neck scrub
        const vneckGeo = new THREE.CylinderGeometry(0.3, 0.2, 0.45, 12);
        const vneckMesh = new THREE.Mesh(vneckGeo, scrubMat);
        vneckMesh.position.set(0, 0.4, 0.3);
        torsoGroup.add(vneckMesh);

        // Stethoscope
        const stethCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.35, 0.62, 0.1),
          new THREE.Vector3(-0.38, 0.45, 0.35),
          new THREE.Vector3(0, 0.15, 0.52),
          new THREE.Vector3(0.38, 0.45, 0.35),
          new THREE.Vector3(0.35, 0.62, 0.1),
        ]);
        const stethGeo = new THREE.TubeGeometry(stethCurve, 20, 0.035, 8, false);
        const stethMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.3 });
        const stethMesh = new THREE.Mesh(stethGeo, stethMat);
        torsoGroup.add(stethMesh);

        const bellGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16);
        const bellMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
        const bellMesh = new THREE.Mesh(bellGeo, bellMat);
        bellMesh.rotation.x = Math.PI / 2;
        bellMesh.position.set(0, 0.12, 0.54);
        torsoGroup.add(bellMesh);

        // ID Badge
        const badgeGeo = new THREE.BoxGeometry(0.18, 0.25, 0.04);
        const badgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
        badgeMesh.position.set(0.28, 0.3, 0.48);
        torsoGroup.add(badgeMesh);
      }

      // Neck
      const neckGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.28, 12);
      const neckMesh = new THREE.Mesh(neckGeo, skinMat);
      neckMesh.position.y = 0.75;
      torsoGroup.add(neckMesh);

      // Head
      const headGroup = new THREE.Group();
      headGroup.position.y = 1.22;

      const headGeo = new THREE.SphereGeometry(0.44, 24, 24);
      headGeo.scale(0.92, 1.05, 0.95);
      const headMesh = new THREE.Mesh(headGeo, skinMat);
      headGroup.add(headMesh);

      // Hair
      const hairGeo = new THREE.SphereGeometry(0.47, 18, 18);
      hairGeo.scale(0.95, 1.05, 0.98);
      const hairMesh = new THREE.Mesh(hairGeo, hairMat);
      hairMesh.position.set(0, 0.1, -0.06);
      headGroup.add(hairMesh);

      if (isDoctor) {
        // Doctor Headband / Frontal Reflector
        const bandGeo = new THREE.TorusGeometry(0.46, 0.025, 8, 32);
        const bandMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
        const bandMesh = new THREE.Mesh(bandGeo, bandMat);
        bandMesh.rotation.x = Math.PI / 2;
        bandMesh.position.y = 0.08;
        headGroup.add(bandMesh);

        const mirrorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16);
        const mirrorMat = new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, metalness: 0.9, roughness: 0.1 });
        const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorMat);
        mirrorMesh.rotation.x = Math.PI / 2;
        mirrorMesh.position.set(0, 0.1, 0.46);
        headGroup.add(mirrorMesh);
      }

      torsoGroup.add(headGroup);
      root.add(torsoGroup);

      // ── Arms ────────────────────────────────────────────────────────
      const createArm = (isRight = false) => {
        const armPivot = new THREE.Group();
        const sign = isRight ? 1 : -1;
        armPivot.position.set(sign * 0.65, 0.42, 0);

        const upperArmGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.65, 12);
        upperArmGeo.translate(0, -0.3, 0);
        const upperArmMesh = new THREE.Mesh(upperArmGeo, isDoctor ? coatMat : patientShirtMat);
        armPivot.add(upperArmMesh);

        const elbowPivot = new THREE.Group();
        elbowPivot.position.set(0, -0.6, 0);

        const foreArmGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.6, 12);
        foreArmGeo.translate(0, -0.28, 0);
        const foreArmMesh = new THREE.Mesh(foreArmGeo, isDoctor ? coatMat : skinMat);
        elbowPivot.add(foreArmMesh);

        const handGeo = new THREE.SphereGeometry(0.13, 12, 12);
        handGeo.scale(0.9, 1.2, 0.8);
        const handMesh = new THREE.Mesh(handGeo, skinMat);
        handMesh.position.set(0, -0.62, 0);
        elbowPivot.add(handMesh);

        armPivot.add(elbowPivot);
        return { armPivot, elbowPivot };
      };

      const leftArm = createArm(false);
      const rightArm = createArm(true);
      torsoGroup.add(leftArm.armPivot);
      torsoGroup.add(rightArm.armPivot);

      // ── Legs ────────────────────────────────────────────────────────
      const createLeg = (isRight = false) => {
        const legPivot = new THREE.Group();
        const sign = isRight ? 1 : -1;
        legPivot.position.set(sign * 0.26, -0.7, 0);

        const thighGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.75, 12);
        thighGeo.translate(0, -0.35, 0);
        const thighMesh = new THREE.Mesh(thighGeo, pantsMat);
        legPivot.add(thighMesh);

        const kneePivot = new THREE.Group();
        kneePivot.position.set(0, -0.72, 0);

        const shinGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.75, 12);
        shinGeo.translate(0, -0.35, 0);
        const shinMesh = new THREE.Mesh(shinGeo, pantsMat);
        kneePivot.add(shinMesh);

        const shoeGeo = new THREE.BoxGeometry(0.24, 0.16, 0.44);
        const shoeMesh = new THREE.Mesh(shoeGeo, shoeMat);
        shoeMesh.position.set(0, -0.76, 0.08);
        kneePivot.add(shoeMesh);

        legPivot.add(kneePivot);
        return { legPivot, kneePivot };
      };

      const leftLeg = createLeg(false);
      const rightLeg = createLeg(true);
      root.add(leftLeg.legPivot);
      root.add(rightLeg.legPivot);

      return {
        root,
        torsoGroup,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
      };
    };

    // Instantiate Doctor & Patient
    const doctor = createCharacter(true);
    doctor.root.position.set(-7.5, -0.4, 0);
    doctor.root.rotation.y = Math.PI / 2 - 0.2;
    scene.add(doctor.root);

    const patient = createCharacter(false);
    patient.root.position.set(7.5, -0.4, 0);
    patient.root.rotation.y = -Math.PI / 2 + 0.2;
    scene.add(patient.root);

    // ── Handshake Sparkle Particle Core ───────────────────────────────
    const sparkGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const sparkParticles = [];
    const sparkGroup = new THREE.Group();
    sparkGroup.position.set(0, 0.35, 0.45);
    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(sparkGeo, sparkMat);
      sparkGroup.add(p);
      sparkParticles.push({
        mesh: p,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 2.4,
          (Math.random() - 0.2) * 2.4,
          (Math.random() - 0.5) * 2.4
        ),
      });
    }
    sparkGroup.visible = false;
    scene.add(sparkGroup);

    // ── 3D Extruded Popping Heart ─────────────────────────────────────
    const heartShape = new THREE.Shape();
    const s = 0.95;
    heartShape.moveTo(0, 0.7 * s);
    heartShape.bezierCurveTo(0, 1.35 * s, -1.4 * s, 1.35 * s, -1.4 * s, 0.35 * s);
    heartShape.bezierCurveTo(-1.4 * s, -0.45 * s, -0.55 * s, -1.15 * s, 0, -1.7 * s);
    heartShape.bezierCurveTo(0.55 * s, -1.15 * s, 1.4 * s, -0.45 * s, 1.4 * s, 0.35 * s);
    heartShape.bezierCurveTo(1.4 * s, 1.35 * s, 0, 1.35 * s, 0, 0.7 * s);

    const extrudeSettings = {
      depth: 0.55,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.2,
      bevelThickness: 0.2,
    };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    heartGeo.center();

    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48, // Ruby rose
      emissive: 0x0284c7, // Cyan glow
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.95,
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);

    const wireHeartMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const wireHeartMesh = new THREE.Mesh(heartGeo, wireHeartMat);
    wireHeartMesh.scale.set(1.04, 1.04, 1.04);

    const heartAssembly = new THREE.Group();
    heartAssembly.add(heartMesh);
    heartAssembly.add(wireHeartMesh);

    // Radial Vitality Ring around Heart
    const secRingGeo = new THREE.TorusGeometry(1.65, 0.035, 16, 64);
    const secRingMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.75 });
    const secRing = new THREE.Mesh(secRingGeo, secRingMat);
    heartAssembly.add(secRing);

    heartAssembly.position.set(0, 0.4, 0.5);
    heartAssembly.scale.set(0.001, 0.001, 0.001);
    scene.add(heartAssembly);

    // ── Animation Loop ────────────────────────────────────────────────
    let animId;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;
      const currentSeq = stateRef.current;

      // ── Timing & Easing Helpers ──
      // State 1 Entry: 0s -> 1.6s
      const entryDuration = 1.6;
      const entryProgress = Math.min(1.0, elapsed / entryDuration);
      // Smooth cubic ease-in-out
      const easeEntry = entryProgress < 0.5
        ? 4 * entryProgress * entryProgress * entryProgress
        : 1 - Math.pow(-2 * entryProgress + 2, 3) / 2;

      // Doctor walks from -7.2 to -1.35
      const docStartX = -7.2;
      const docTargetX = -1.35;
      doctor.root.position.x = docStartX + (docTargetX - docStartX) * easeEntry;

      // Patient walks from 7.2 to 1.35
      const patStartX = 7.2;
      const patTargetX = 1.35;
      patient.root.position.x = patStartX + (patTargetX - patStartX) * easeEntry;

      // ── State 1: Walking Leg Swings & Torso Bobs ──
      if (entryProgress < 0.98) {
        const legSwing = Math.sin(elapsed * 9.5) * 0.48;
        doctor.leftLeg.legPivot.rotation.x = legSwing;
        doctor.rightLeg.legPivot.rotation.x = -legSwing;
        doctor.torsoGroup.position.y = -0.1 + Math.abs(Math.sin(elapsed * 9.5)) * 0.06;

        patient.leftLeg.legPivot.rotation.x = -legSwing;
        patient.rightLeg.legPivot.rotation.x = legSwing;
        patient.torsoGroup.position.y = -0.1 + Math.abs(Math.sin(elapsed * 9.5)) * 0.06;

        // Natural arm swings while walking
        doctor.leftArm.armPivot.rotation.x = -legSwing * 0.5;
        doctor.rightArm.armPivot.rotation.x = legSwing * 0.5;

        patient.leftArm.armPivot.rotation.x = legSwing * 0.5;
        patient.rightArm.armPivot.rotation.x = -legSwing * 0.5;

        // Standard camera view during entry
        camera.position.set(0, 0.6, 10.5);
      } else {
        // Walking ends cleanly
        doctor.leftLeg.legPivot.rotation.x = 0;
        doctor.rightLeg.legPivot.rotation.x = 0;
        patient.leftLeg.legPivot.rotation.x = 0;
        patient.rightLeg.legPivot.rotation.x = 0;

        // ── State 2: Handshake (1.6s -> 2.6s, loop once ~1s) ──
        const handshakeTime = elapsed - entryDuration;
        const armReach = Math.min(1.0, handshakeTime / 0.4);

        // Raise arms forward into handshake clasp
        doctor.rightArm.armPivot.rotation.x = -0.85 * armReach;
        doctor.rightArm.armPivot.rotation.y = 0.35 * armReach;
        doctor.rightArm.elbowPivot.rotation.x = 0.45 * armReach;
        doctor.leftArm.armPivot.rotation.x = 0.1;

        patient.leftArm.armPivot.rotation.x = -0.85 * armReach;
        patient.leftArm.armPivot.rotation.y = -0.35 * armReach;
        patient.leftArm.elbowPivot.rotation.x = 0.45 * armReach;
        patient.rightArm.armPivot.rotation.x = 0.1;

        // Gentle camera zoom-in toward the shaking hands (from 10.5 to 8.4)
        const zoomProgress = Math.min(1.0, handshakeTime / 0.9);
        const easeZoom = 1 - Math.pow(1 - zoomProgress, 3);
        camera.position.z = 10.5 - (10.5 - 8.5) * easeZoom;
        camera.position.y = 0.6 - (0.6 - 0.35) * easeZoom;

        // Two gentle handshake pump cycles
        if (handshakeTime > 0.4 && handshakeTime < 1.3) {
          const pump = Math.sin((handshakeTime - 0.4) * 8.0) * 0.085;
          doctor.rightArm.armPivot.rotation.x += pump;
          patient.leftArm.armPivot.rotation.x += pump;

          sparkGroup.visible = true;
          sparkParticles.forEach((sp) => {
            sp.mesh.position.addScaledVector(sp.vel, 0.015);
            sp.mesh.scale.multiplyScalar(0.97);
          });
        }

        // ── State 3, 4a, 4b: Heart Emergence & Morphing ──
        if (handshakeTime > 0.7) {
          const heartElapsed = handshakeTime - 0.7;
          const heartGrowth = Math.min(1.0, heartElapsed / 0.55);

          // Heart scaling and floating up
          let pulse = 1.0;
          if (currentSeq === 'VERIFICATION') {
            // Subtle breathing / pulsing loading animation while waiting
            pulse = 1.0 + Math.sin(elapsed * 4.5) * 0.06;
          } else if (currentSeq === 'SUCCESS') {
            // Victorious green pulse
            pulse = 1.0 + Math.sin(elapsed * 7.0) * 0.14;
          } else if (currentSeq === 'FAILURE') {
            // Hesitant distressed pulse
            pulse = 1.0 + Math.sin(elapsed * 10.0) * 0.07;
          }

          const targetScale = heartGrowth * pulse;
          heartAssembly.scale.set(targetScale, targetScale, targetScale);
          heartAssembly.position.y = 0.35 + heartGrowth * 0.95; // Floats directly above handshake

          secRing.rotation.z += 0.014;

          // ── State-Specific Visuals ──
          if (currentSeq === 'SUCCESS') {
            heartMat.color.setHex(0x059669); // Radiant green
            heartMat.emissive.setHex(0x10b981);
            wireHeartMat.color.setHex(0x34d399);
            secRingMat.color.setHex(0x10b981);
            heartAssembly.position.x = 0;
          } else if (currentSeq === 'FAILURE') {
            heartMat.color.setHex(0xb91c1c); // Dark crimson
            heartMat.emissive.setHex(0xf59e0b); // Amber caution
            wireHeartMat.color.setHex(0xf59e0b);
            secRingMat.color.setHex(0xf59e0b);

            // Small horizontal shake tremor on failure
            heartAssembly.position.x = Math.sin(elapsed * 28.0) * 0.08;
          } else {
            // Verification loading state (Cyan-rose breathing)
            heartMat.color.setHex(0xe11d48);
            heartMat.emissive.setHex(0x0284c7);
            wireHeartMat.color.setHex(0x38bdf8);
            secRingMat.color.setHex(0x06b6d4);
            heartAssembly.position.x = 0;
          }
        }
      }

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
