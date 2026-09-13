import * as THREE from 'three';
import { SegmentId, ProceduralSneakerAssembly, SneakerRigGroups } from '@/types/sneaker';
import { PBRMaterialSystem } from '@/materials/PBRMaterialSystem';
import { ProceduralTextureEngine } from '@/utils/proceduralTextures';

/**
 * ProceduralSneakerGenerator
 * Builds a high-fidelity 3D sneaker mesh using procedural Three.js buffer geometries.
 * Guarantees 100% offline reliability with zero external asset dependencies.
 */
export class ProceduralSneakerGenerator {
  /**
   * Generates the anatomical 2D foot-last outline in X-Z space.
   * Runs from Heel (Z = -1.30) to Toe (Z = +1.35).
   */
  private static createSoleFootprintShape(): THREE.Shape {
    const shape = new THREE.Shape();

    // Start at back of heel (Z = -1.30, X = 0.0)
    shape.moveTo(0.0, -1.30);

    // Lateral heel curve to arch
    shape.bezierCurveTo(0.42, -1.30, 0.46, -0.90, 0.44, -0.50);
    // Lateral waist / arch
    shape.bezierCurveTo(0.42, -0.20, 0.45, 0.10, 0.48, 0.35);
    // Lateral forefoot ball (widest point)
    shape.bezierCurveTo(0.52, 0.65, 0.50, 0.95, 0.38, 1.20);
    // Toe cap tip (slight medial asymmetry)
    shape.bezierCurveTo(0.28, 1.35, 0.08, 1.38, -0.05, 1.35);
    // Medial toe to ball
    shape.bezierCurveTo(-0.25, 1.30, -0.46, 1.05, -0.48, 0.70);
    // Medial arch waist (tighter inner cutout)
    shape.bezierCurveTo(-0.50, 0.40, -0.32, 0.05, -0.30, -0.30);
    // Medial heel transition
    shape.bezierCurveTo(-0.28, -0.65, -0.38, -1.05, -0.38, -1.25);
    // Close heel curve
    shape.bezierCurveTo(-0.25, -1.32, -0.10, -1.30, 0.0, -1.30);

    return shape;
  }

  /**
   * Builds the Outsole with herringbone traction treads.
   */
  private static buildOutsole(soleMaterial: THREE.MeshPhysicalMaterial): THREE.Group {
    const group = new THREE.Group();
    group.name = 'assembly_outsole';

    const footprint = this.createSoleFootprintShape();
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.075,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    const soleGeom = new THREE.ExtrudeGeometry(footprint, extrudeSettings);
    // Orient footprint from X-Y to X-Z plane extruding upward (+Y)
    soleGeom.rotateX(-Math.PI * 0.5);
    soleGeom.rotateY(Math.PI);
    // Elevate outsole base to rest directly atop tread lugs (Y: [0.014, 0.129])
    soleGeom.translate(0, 0.034, 0);

    // Sculpt forefoot flex articulation grooves along outsole bottom face
    const solePos = soleGeom.attributes.position;
    for (let i = 0; i < solePos.count; i++) {
      const y = solePos.getY(i);
      const z = solePos.getZ(i);
      if (y < 0.040 && z > 0.35 && z < 1.05) {
        const flexSipe = Math.sin((z - 0.35) * Math.PI * 4) * 0.004;
        if (flexSipe > 0.001) {
          solePos.setY(i, Math.max(0.014, y + flexSipe));
        }
      }
    }
    soleGeom.computeVertexNormals();

    const soleMesh = new THREE.Mesh(soleGeom, soleMaterial);
    soleMesh.name = 'mesh_outsole_base';
    soleMesh.castShadow = true;
    soleMesh.receiveShadow = true;
    soleMesh.userData = { segment: 'sole', subpart: 'outsole' };
    group.add(soleMesh);

    // Tread Traction Ribs (12 transverse herringbone chevrons grounded at Y: [0.000, 0.014])
    const treadGeom = new THREE.BoxGeometry(0.55, 0.014, 0.05, 12, 1, 4);
    const tPos = treadGeom.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const x = tPos.getX(i);
      let z = tPos.getZ(i);
      // Aerodynamic chevron curve in X-Z plane preserving exact Y bounds
      const chevron = Math.abs(x) * 0.05;
      z -= chevron;
      tPos.setZ(i, z);
    }
    treadGeom.computeVertexNormals();

    const treadMat = soleMaterial.clone();
    treadMat.roughness = 0.85;
    treadMat.name = 'mat_sole_tread';

    for (let i = 0; i < 12; i++) {
      const zPos = -1.10 + i * 0.20;
      const widthScale = zPos > 0.2 && zPos < 0.9 ? 1.35 : zPos < -0.6 ? 1.1 : 0.85;
      const treadMesh = new THREE.Mesh(treadGeom, treadMat);
      treadMesh.name = `mesh_tread_lug_${i + 1}`;
      treadMesh.position.set(0, 0.007, zPos);
      treadMesh.scale.set(widthScale, 1.0, 1.0);
      treadMesh.rotation.y = i % 2 === 0 ? 0.08 : -0.08;
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
      treadMesh.userData = { segment: 'sole', subpart: 'tread_lug' };
      group.add(treadMesh);
    }

    return group;
  }

  /**
   * Builds the Sculpted Aerodynamic Midsole (NitroCell Foam).
   */
  private static buildMidsole(soleMaterial: THREE.MeshPhysicalMaterial): THREE.Mesh {
    const length = 2.65;
    const width = 0.98;
    const height = 0.26;

    const geom = new THREE.BoxGeometry(width, height, length, 16, 12, 32);
    const pos = geom.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Normal progress from heel (-1.325) to toe (+1.325)
      const t = (z + 1.325) / 2.65;

      // Forefoot drops down (toe spring), heel rises up
      let sculptY = y + 0.18 + (1 - t) * 0.12 - t * 0.04;
      if (t > 0.76) {
        // Upward toe spring rocker curve
        sculptY += Math.pow((t - 0.76) / 0.24, 2) * 0.088;
      }

      // Decoupled heel crash pad bevel on bottom-rear
      if (t < 0.20 && y < 0.0) {
        sculptY += Math.pow((0.20 - t) / 0.20, 1.8) * 0.042;
      }

      // Lateral flare at heel, waist cutout at midfoot
      let sculptX = x;
      if (t < 0.35) {
        sculptX *= 1.08; // Heel flare
      } else if (t >= 0.35 && t <= 0.60) {
        sculptX *= (x < 0 ? 0.82 : 0.88); // Anatomical medial arch waist tuck
      } else {
        sculptX *= 1.02; // Ball width
      }

      // Multi-layered dual-density sculpting with horizontal separation groove and lateral channels
      if (Math.abs(x) > width * 0.30) {
        const sideFactor = Math.sin(t * Math.PI);
        // 1. Horizontal layer split groove dividing upper carrier foam and lower cushioning foam
        const splitLineDist = Math.abs(y - 0.02);
        const splitGroove = splitLineDist < 0.045 ? -0.012 * (1.0 - splitLineDist / 0.045) * sideFactor : 0.0;

        // 2. Sculpted aerodynamic compression channels (3 distinct channels)
        const channelPattern = Math.sin((y + 0.10) * 22.0) * 0.010 * sideFactor;
        sculptX += (x > 0 ? 1 : -1) * (splitGroove + channelPattern);
      }

      pos.setXYZ(i, sculptX, sculptY, z);
    }

    geom.computeVertexNormals();

    const mesh = new THREE.Mesh(geom, soleMaterial);
    mesh.name = 'mesh_midsole';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { segment: 'sole', subpart: 'midsole' };
    return mesh;
  }

  /**
   * Builds the Carbon Fiber Torsional Shank Plate with Dual-Camber Curvature.
   */
  private static buildCarbonShankPlate(): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(-0.18, -0.30);
    shape.lineTo(0.18, -0.30);
    shape.lineTo(0.24, 0.25);
    shape.lineTo(-0.24, 0.25);
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.008,
      bevelThickness: 0.008,
    });
    geom.rotateX(Math.PI * 0.5);
    geom.translate(0, 0.105, 0);

    // Sculpt dual-camber curvature into torsional shank plate
    const cPos = geom.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const cx = cPos.getX(i);
      let cy = cPos.getY(i);
      const cz = cPos.getZ(i);
      // Longitudinal arch camber peaking at midfoot waist (cz ~ -0.02)
      const archCamber = Math.cos((cz + 0.02) * Math.PI * 2.0) * 0.012;
      // Transverse cradle cupping along lateral/medial borders
      const cupCamber = (cx * cx) * 0.08;
      cy += archCamber + cupCamber;
      cPos.setXYZ(i, cx, cy, cz);
    }
    geom.computeVertexNormals();

    const carbonMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#15171C'),
      roughness: 0.18,
      metalness: 0.85,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06,
      normalMap: ProceduralTextureEngine.createCarbonTexture(256, 16, 16),
      normalScale: new THREE.Vector2(0.85, 0.85),
      name: 'mat_carbon_shank',
    });

    const mesh = new THREE.Mesh(geom, carbonMat);
    mesh.name = 'mesh_carbon_shank';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { segment: 'sole', subpart: 'carbon_plate' };
    return mesh;
  }

  /**
   * Builds the Layered Upper Shoe Body (Vamp, Quarters, Collar, Inner Lining).
   */
  private static buildUpper(upperMaterial: THREE.MeshPhysicalMaterial): THREE.Group {
    const group = new THREE.Group();
    group.name = 'assembly_upper';

    // Vamp & Body shell sculpted from subdivided curved cylinder
    const radiusTop = 0.40;
    const radiusBottom = 0.48;
    const height = 0.75;
    const radialSegments = 32;
    const heightSegments = 20;

    const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, false);
    geom.rotateZ(Math.PI * 0.5); // Align length with X
    geom.rotateY(Math.PI * 0.5); // Align length with Z

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Map cylinder to shoe proportion
      z *= 3.0; // Extend along Z: [-1.2, 1.2]
      x *= 0.95;

      const t = (z + 1.2) / 2.4; // 0 (heel) to 1 (toe)

      // Slope from high ankle collar down to low toe box
      if (t > 0.6) {
        // Forefoot slope down smoothly to toe tip
        y = y * 0.65 + 0.35 + Math.pow(t - 0.6, 2) * 0.15;
      } else {
        // Ankle collar rise
        y = y * 0.85 + 0.55 + (0.6 - t) * 0.35;
      }

      // Sleek anatomical toe contour with organic hallux asymmetry
      if (t > 0.82) {
        const toeT = (t - 0.82) / 0.18;
        const medialAsym = -0.035 * toeT;
        x = (x - medialAsym) * (1.0 - Math.pow(toeT, 1.7) * 0.70) + medialAsym;
        if (t > 0.95) {
          const tipT = (t - 0.95) / 0.05;
          y = Math.min(y, 0.28 + (1.0 - tipT) * 1.5);
          x *= (1.0 - tipT * 0.35);
        }
      }

      // Anatomical instep throat recess & 3D eyestay ridges
      if (t >= 0.38 && t <= 0.78 && y > 0.40) {
        const throatT = Math.sin(((t - 0.38) / 0.40) * Math.PI);
        const absX = Math.abs(x);
        if (absX < 0.16) {
          // Central throat recess channel where the tongue and laces sit
          y -= (1.0 - absX / 0.16) * 0.048 * throatT;
        } else if (absX >= 0.16 && absX <= 0.25) {
          // Raised 3D eyestay ridges flanking throat
          const stayDist = Math.abs(absX - 0.205) / 0.045;
          y += (1.0 - stayDist) * 0.022 * throatT;
        }
      }

      // Achilles notch inward scoop
      if (t < 0.25 && y > 0.65 && y < 0.92) {
        z += Math.sin(((y - 0.65) / 0.27) * Math.PI) * 0.04;
      }

      // Medial arch tuck
      if (t >= 0.36 && t <= 0.62 && x < 0) {
        x *= 0.88;
      }

      // Ensure sole contact base is flat
      if (y < 0.12) {
        y = 0.12;
      }

      pos.setXYZ(i, x, y, z);
    }

    geom.computeVertexNormals();
    const normAttr = geom.attributes.normal;
    for (let i = 0; i < normAttr.count; i++) {
      const l = Math.hypot(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
      if (l < 0.001) {
        normAttr.setXYZ(i, 0, 1, 0);
      }
    }

    const upperMesh = new THREE.Mesh(geom, upperMaterial);
    upperMesh.name = 'mesh_upper_body';
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    upperMesh.userData = { segment: 'upper', subpart: 'vamp_quarters' };
    group.add(upperMesh);

    // Collar Rim Cushion (Padded donut rim with anatomical ankle contour & asymmetrical malleolus dips)
    const collarCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.86, -0.62),   // Rear Achilles tendon peak
      new THREE.Vector3(0.22, 0.79, -0.42),  // Lateral malleolus ankle dip (lower / further rear)
      new THREE.Vector3(0.18, 0.82, -0.18),  // Lateral collar flank
      new THREE.Vector3(0.0, 0.83, -0.06),   // Instep throat front
      new THREE.Vector3(-0.18, 0.82, -0.18), // Medial collar flank
      new THREE.Vector3(-0.21, 0.81, -0.37), // Medial malleolus ankle dip (higher / slightly forward)
    ], true);
    const collarGeom = new THREE.TubeGeometry(collarCurve, 32, 0.045, 8, true);

    const collarMesh = new THREE.Mesh(collarGeom, upperMaterial);
    collarMesh.name = 'mesh_collar_rim';
    collarMesh.castShadow = true;
    collarMesh.userData = { segment: 'upper', subpart: 'collar' };
    group.add(collarMesh);

    // Tongue with Integrated 3D Webbing Pull Tab (Swept padded flap extending along instep curve Y: [0.40, 0.98])
    const tongueCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.44, 0.55),
      new THREE.Vector3(0.0, 0.62, 0.32),
      new THREE.Vector3(0.0, 0.78, 0.10),
      new THREE.Vector3(0.0, 0.95, -0.14),
    ]);
    const tongueGeom = new THREE.TubeGeometry(tongueCurve, 24, 0.045, 8, false);
    tongueGeom.scale(3.8, 1.0, 1.0); // Widen across instep to 0.34m plush strip while preserving Y instep slope

    // Sculpt integrated 3D webbing pull tab loop at crest of tongue
    const tgPos = tongueGeom.attributes.position;
    for (let i = 0; i < tgPos.count; i++) {
      const tx = tgPos.getX(i);
      let ty = tgPos.getY(i);
      let tz = tgPos.getZ(i);

      if (tz < -0.06 && ty > 0.85) {
        const topFactor = Math.min(1.0, (-0.06 - tz) / 0.08);
        if (Math.abs(tx) < 0.055) {
          // Central raised webbing pull-tab loop ribbon
          ty = Math.min(0.985, ty + topFactor * 0.035);
          tz -= topFactor * 0.012;
        } else {
          // Plush outer tongue wings flare smoothly outward
          ty = Math.min(0.965, ty - topFactor * 0.015);
        }
      }

      tgPos.setXYZ(i, tx, ty, tz);
    }
    tongueGeom.computeVertexNormals();

    const tongueMesh = new THREE.Mesh(tongueGeom, upperMaterial);
    tongueMesh.name = 'mesh_tongue';
    tongueMesh.castShadow = true;
    tongueMesh.receiveShadow = true;
    tongueMesh.userData = { segment: 'upper', subpart: 'tongue' };
    group.add(tongueMesh);

    return group;
  }

  /**
   * Builds the Criss-Cross Lacing System & Metallic Eyelets.
   */
  private static buildLacingSystem(
    lacesMaterial: THREE.MeshPhysicalMaterial,
    accentMaterial: THREE.MeshPhysicalMaterial
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = 'assembly_laces';

    // 5-pair eyestay anchor coordinates
    const eyeletPairs: [THREE.Vector3, THREE.Vector3][] = [
      [new THREE.Vector3(-0.19, 0.50, 0.52), new THREE.Vector3(0.19, 0.50, 0.52)],
      [new THREE.Vector3(-0.21, 0.58, 0.38), new THREE.Vector3(0.21, 0.58, 0.38)],
      [new THREE.Vector3(-0.22, 0.66, 0.24), new THREE.Vector3(0.22, 0.66, 0.24)],
      [new THREE.Vector3(-0.22, 0.74, 0.10), new THREE.Vector3(0.22, 0.74, 0.10)],
      [new THREE.Vector3(-0.21, 0.82, -0.04), new THREE.Vector3(0.21, 0.82, -0.04)],
    ];

    // Build Metallic Grommet Rings
    const grommetGeom = new THREE.TorusGeometry(0.022, 0.007, 8, 16);
    grommetGeom.rotateX(Math.PI * 0.35);

    eyeletPairs.forEach(([left, right], idx) => {
      const leftRing = new THREE.Mesh(grommetGeom, accentMaterial);
      leftRing.position.copy(left);
      leftRing.name = `mesh_eyelet_L_${idx + 1}`;
      leftRing.castShadow = true;
      leftRing.userData = { segment: 'accents', subpart: 'eyelet' };
      group.add(leftRing);

      const rightRing = new THREE.Mesh(grommetGeom, accentMaterial);
      rightRing.position.copy(right);
      rightRing.name = `mesh_eyelet_R_${idx + 1}`;
      rightRing.castShadow = true;
      rightRing.userData = { segment: 'accents', subpart: 'eyelet' };
      group.add(rightRing);
    });

    // Build 3D Tubular Criss-Cross Laces
    for (let i = 0; i < eyeletPairs.length - 1; i++) {
      const [lCurrent, rCurrent] = eyeletPairs[i];
      const [lNext, rNext] = eyeletPairs[i + 1];

      // Cross 1: Left to Right
      const midPoint1 = new THREE.Vector3(
        0.0,
        (lCurrent.y + rNext.y) * 0.5 + 0.035, // Arch slightly over tongue
        (lCurrent.z + rNext.z) * 0.5
      );
      const curve1 = new THREE.CatmullRomCurve3([lCurrent, midPoint1, rNext]);
      const laceGeom1 = new THREE.TubeGeometry(curve1, 16, 0.015, 8, false);
      const laceMesh1 = new THREE.Mesh(laceGeom1, lacesMaterial);
      laceMesh1.name = `mesh_lace_cross_LR_${i}`;
      laceMesh1.castShadow = true;
      laceMesh1.userData = { segment: 'laces', subpart: 'criss_cross' };
      group.add(laceMesh1);

      // Cross 2: Right to Left
      const midPoint2 = new THREE.Vector3(
        0.0,
        (rCurrent.y + lNext.y) * 0.5 + 0.025,
        (rCurrent.z + lNext.z) * 0.5
      );
      const curve2 = new THREE.CatmullRomCurve3([rCurrent, midPoint2, lNext]);
      const laceGeom2 = new THREE.TubeGeometry(curve2, 16, 0.015, 8, false);
      const laceMesh2 = new THREE.Mesh(laceGeom2, lacesMaterial);
      laceMesh2.name = `mesh_lace_cross_RL_${i}`;
      laceMesh2.castShadow = true;
      laceMesh2.userData = { segment: 'laces', subpart: 'criss_cross' };
      group.add(laceMesh2);
    }

    // Top Tied Sneaker Bow Knot with Left Loop, Center Cinched Knot Core, and Right Loop
    const knotCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 0.85, -0.03), // Left anchor
      new THREE.Vector3(-0.14, 0.885, -0.02), // Left bow top
      new THREE.Vector3(-0.17, 0.875, -0.04), // Left bow crest
      new THREE.Vector3(-0.12, 0.85, -0.05),  // Left bow return
      new THREE.Vector3(-0.04, 0.87, -0.02),  // Cinch wrap entry
      new THREE.Vector3(0.0, 0.885, -0.015),  // Center knot crown
      new THREE.Vector3(0.04, 0.87, -0.02),   // Cinch wrap exit
      new THREE.Vector3(0.12, 0.85, -0.05),   // Right bow entry
      new THREE.Vector3(0.17, 0.875, -0.04),  // Right bow crest
      new THREE.Vector3(0.14, 0.885, -0.02),  // Right bow top
      new THREE.Vector3(0.08, 0.85, -0.03),  // Right anchor
    ]);
    const knotGeom = new THREE.TubeGeometry(knotCurve, 24, 0.018, 8, false);
    const knotMesh = new THREE.Mesh(knotGeom, lacesMaterial);
    knotMesh.name = 'mesh_lace_knot';
    knotMesh.castShadow = true;
    knotMesh.userData = { segment: 'laces', subpart: 'knot' };
    group.add(knotMesh);

    // Aglet tips (cylinders with subtle taper draped from knot)
    const agletGeom = new THREE.CylinderGeometry(0.009, 0.007, 0.085, 8);
    const leftAglet = new THREE.Mesh(agletGeom, accentMaterial);
    leftAglet.name = 'mesh_aglet_L';
    leftAglet.castShadow = true;
    leftAglet.position.set(-0.13, 0.79, -0.025);
    leftAglet.rotation.z = 0.28;
    leftAglet.rotation.x = 0.12;
    leftAglet.userData = { segment: 'accents', subpart: 'aglet' };
    group.add(leftAglet);

    const rightAglet = new THREE.Mesh(agletGeom, accentMaterial);
    rightAglet.name = 'mesh_aglet_R';
    rightAglet.castShadow = true;
    rightAglet.position.set(0.13, 0.79, -0.025);
    rightAglet.rotation.z = -0.28;
    rightAglet.rotation.x = 0.12;
    rightAglet.userData = { segment: 'accents', subpart: 'aglet' };
    group.add(rightAglet);

    return group;
  }

  /**
   * Builds the Ergonomic Heel Stabilizer Clip & Lateral/Medial Branding Blades.
   */
  private static buildAccents(accentMaterial: THREE.MeshPhysicalMaterial): THREE.Group {
    const group = new THREE.Group();
    group.name = 'assembly_accents';

    // 1. Ergonomic Heel Counter / Stabilizer Clip (Horseshoe wrap around heel)
    const heelCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.38, 0.38, -0.80),
      new THREE.Vector3(0.42, 0.44, -1.05),
      new THREE.Vector3(0.00, 0.46, -1.32),
      new THREE.Vector3(-0.42, 0.44, -1.05),
      new THREE.Vector3(-0.38, 0.38, -0.80),
    ]);
    const heelClipGeom = new THREE.TubeGeometry(heelCurve, 28, 0.042, 8, false);
    heelClipGeom.scale(1.0, 1.8, 1.0); // Taper into sleek stabilization wing

    const heelClipMesh = new THREE.Mesh(heelClipGeom, accentMaterial);
    heelClipMesh.name = 'mesh_heel_clip';
    heelClipMesh.castShadow = true;
    heelClipMesh.receiveShadow = true;
    heelClipMesh.userData = { segment: 'accents', subpart: 'heel_clip' };
    group.add(heelClipMesh);

    // 2. Aerodynamic Lateral & Medial Branding Blades (AEROPRO-X aerodynamic sweep)
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.55, 0.08);
    bladeShape.lineTo(0.68, 0.16);
    bladeShape.lineTo(0.18, 0.07);
    bladeShape.closePath();

    const bladeExtrude: THREE.ExtrudeGeometryOptions = {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.006,
      bevelThickness: 0.006,
    };

    // Lateral Blade (Outside of shoe)
    const lateralGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrude);
    lateralGeom.rotateY(-Math.PI * 0.5);
    lateralGeom.translate(0.46, 0.42, -0.10);

    const lateralBlade = new THREE.Mesh(lateralGeom, accentMaterial);
    lateralBlade.name = 'mesh_lateral_accent_blade';
    lateralBlade.castShadow = true;
    lateralBlade.userData = { segment: 'accents', subpart: 'lateral_blade' };
    group.add(lateralBlade);

    // Medial Blade (Inside of shoe)
    const medialGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrude);
    medialGeom.rotateY(Math.PI * 0.5);
    medialGeom.translate(-0.46, 0.42, -0.10);

    const medialBlade = new THREE.Mesh(medialGeom, accentMaterial);
    medialBlade.name = 'mesh_medial_accent_blade';
    medialBlade.castShadow = true;
    medialBlade.userData = { segment: 'accents', subpart: 'medial_blade' };
    group.add(medialBlade);

    return group;
  }

  /**
   * Main Factory Method:
   * Constructs the complete compound sneaker assembly, groups, tags, and material maps.
   */
  public static createSneakerAssembly(): ProceduralSneakerAssembly {
    const root = new THREE.Group();
    root.name = 'sneaker_root';
    root.userData = { isSneakerRoot: true };

    // Initialize Standard PBR Materials for each segment with procedural normal maps (Luxury Beige White Palette)
    const matUpper = PBRMaterialSystem.createMeshPhysicalMaterial('upper', '#f5f2eb', {
      roughness: 0.38,
      metalness: 0.02,
      clearcoat: 0.22,
      clearcoatRoughness: 0.20,
      sheen: 0.45,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color('#fcfbf8'),
      normalScale: new THREE.Vector2(0.85, 0.85),
    });

    const matSole = PBRMaterialSystem.createMeshPhysicalMaterial('sole', '#e6ded1', {
      roughness: 0.68,
      metalness: 0.02,
      clearcoat: 0.08,
      clearcoatRoughness: 0.38,
      normalScale: new THREE.Vector2(1.5, 1.5),
    });

    const matAccents = PBRMaterialSystem.createMeshPhysicalMaterial('accents', '#c9bba8', {
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 0.90,
      clearcoatRoughness: 0.05,
      iridescence: 0.75,
      iridescenceIOR: 1.45,
      iridescenceThicknessRange: [120, 380],
      normalScale: new THREE.Vector2(0.3, 0.3),
      envMapIntensity: 2.40,
    });

    const matLaces = PBRMaterialSystem.createMeshPhysicalMaterial('laces', '#ece5d8', {
      roughness: 0.80,
      metalness: 0.0,
      clearcoat: 0.0,
      sheen: 0.50,
      sheenRoughness: 0.60,
      sheenColor: new THREE.Color('#f7f4ed'),
      normalScale: new THREE.Vector2(1.2, 1.2),
    });


    // Create Positional Rig Groups for GSAP Exploded View Choreography
    const rigUpper = new THREE.Group();
    rigUpper.name = 'rig_upper';
    const rigLaces = new THREE.Group();
    rigLaces.name = 'rig_laces';
    const rigCarbon = new THREE.Group();
    rigCarbon.name = 'rig_carbon';
    const rigSole = new THREE.Group();
    rigSole.name = 'rig_sole';
    const rigAccents = new THREE.Group();
    rigAccents.name = 'rig_accents';

    // Build Anatomical Geometries
    const outsoleGroup = this.buildOutsole(matSole);
    const midsoleMesh = this.buildMidsole(matSole);
    const carbonShankMesh = this.buildCarbonShankPlate();
    const upperGroup = this.buildUpper(matUpper);
    const lacingGroup = this.buildLacingSystem(matLaces, matAccents);
    const accentsGroup = this.buildAccents(matAccents);

    // Mount to respective rig groups
    rigSole.add(outsoleGroup);
    rigSole.add(midsoleMesh);
    rigCarbon.add(carbonShankMesh);
    rigUpper.add(upperGroup);
    rigLaces.add(lacingGroup);
    rigAccents.add(accentsGroup);

    // Mount rig groups to root
    root.add(rigSole);
    root.add(rigCarbon);
    root.add(rigUpper);
    root.add(rigLaces);
    root.add(rigAccents);

    const rigGroups: SneakerRigGroups = {
      upper: rigUpper,
      laces: rigLaces,
      carbon: rigCarbon,
      sole: rigSole,
      accents: rigAccents,
    };

    // Register Materials in Fast Customizer Lookup Map
    const treadMat = (outsoleGroup.children[1] as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
    const materialMap = new Map<SegmentId, THREE.MeshPhysicalMaterial[]>();
    materialMap.set('upper', [matUpper]);
    materialMap.set('sole', [matSole, treadMat]);
    materialMap.set('accents', [matAccents]);
    materialMap.set('laces', [matLaces]);

    return {
      root,
      rigGroups,
      materialMap,
    };
  }
}

// Warm up V8 JIT compiler & procedural normal map pipelines on module import
try {
  const warmup = ProceduralSneakerGenerator.createSneakerAssembly();
  warmup.root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
      }
    }
  });
} catch {}
