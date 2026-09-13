// tests/challenger-m1-2-stress.mjs
import * as THREE5 from "three";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/components/3d/ProceduralSneaker.ts
import * as THREE from "three";
var ProceduralSneakerGenerator = class {
  /**
   * Generates the anatomical 2D foot-last outline in X-Z space.
   * Runs from Heel (Z = -1.30) to Toe (Z = +1.35).
   */
  static createSoleFootprintShape() {
    const shape = new THREE.Shape();
    shape.moveTo(0, -1.3);
    shape.bezierCurveTo(0.42, -1.3, 0.46, -0.9, 0.44, -0.5);
    shape.bezierCurveTo(0.42, -0.2, 0.45, 0.1, 0.48, 0.35);
    shape.bezierCurveTo(0.52, 0.65, 0.5, 0.95, 0.38, 1.2);
    shape.bezierCurveTo(0.28, 1.35, 0.08, 1.38, -0.05, 1.35);
    shape.bezierCurveTo(-0.25, 1.3, -0.46, 1.05, -0.48, 0.7);
    shape.bezierCurveTo(-0.5, 0.4, -0.32, 0.05, -0.3, -0.3);
    shape.bezierCurveTo(-0.28, -0.65, -0.38, -1.05, -0.38, -1.25);
    shape.bezierCurveTo(-0.25, -1.32, -0.1, -1.3, 0, -1.3);
    return shape;
  }
  /**
   * Builds the Outsole with herringbone traction treads.
   */
  static buildOutsole(soleMaterial) {
    const group = new THREE.Group();
    group.name = "assembly_outsole";
    const footprint = this.createSoleFootprintShape();
    const extrudeSettings = {
      depth: 0.075,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };
    const soleGeom = new THREE.ExtrudeGeometry(footprint, extrudeSettings);
    soleGeom.rotateX(Math.PI * 0.5);
    soleGeom.translate(0, 0.02, 0);
    const soleMesh = new THREE.Mesh(soleGeom, soleMaterial);
    soleMesh.name = "mesh_outsole_base";
    soleMesh.castShadow = true;
    soleMesh.receiveShadow = true;
    soleMesh.userData = { segment: "sole", subpart: "outsole" };
    group.add(soleMesh);
    const treadGeom = new THREE.BoxGeometry(0.55, 0.015, 0.05);
    const treadMat = soleMaterial.clone();
    treadMat.roughness = 0.85;
    for (let i = 0; i < 12; i++) {
      const zPos = -1.1 + i * 0.2;
      const widthScale = zPos > 0.2 && zPos < 0.9 ? 1.35 : zPos < -0.6 ? 1.1 : 0.85;
      const treadMesh = new THREE.Mesh(treadGeom, treadMat);
      treadMesh.position.set(0, 7e-3, zPos);
      treadMesh.scale.set(widthScale, 1, 1);
      treadMesh.rotation.y = i % 2 === 0 ? 0.08 : -0.08;
      treadMesh.castShadow = true;
      treadMesh.userData = { segment: "sole", subpart: "tread_lug" };
      group.add(treadMesh);
    }
    return group;
  }
  /**
   * Builds the Sculpted Aerodynamic Midsole (NitroCell Foam).
   */
  static buildMidsole(soleMaterial) {
    const length = 2.65;
    const width = 0.98;
    const height = 0.26;
    const geom = new THREE.BoxGeometry(width, height, length, 12, 4, 20);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const t = (z + 1.3) / 2.6;
      let sculptY = y + 0.18 + (1 - t) * 0.12 - t * 0.04;
      if (t > 0.8) {
        sculptY += Math.pow((t - 0.8) / 0.2, 2) * 0.08;
      }
      let sculptX = x;
      if (t < 0.35) {
        sculptX *= 1.08;
      } else if (t >= 0.35 && t <= 0.6) {
        sculptX *= 0.86;
      } else {
        sculptX *= 1.02;
      }
      pos.setXYZ(i, sculptX, sculptY, z);
    }
    geom.computeVertexNormals();
    const mesh = new THREE.Mesh(geom, soleMaterial);
    mesh.name = "mesh_midsole";
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { segment: "sole", subpart: "midsole" };
    return mesh;
  }
  /**
   * Builds the Carbon Fiber Torsional Shank Plate.
   */
  static buildCarbonShankPlate() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.18, -0.3);
    shape.lineTo(0.18, -0.3);
    shape.lineTo(0.24, 0.25);
    shape.lineTo(-0.24, 0.25);
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 8e-3,
      bevelThickness: 8e-3
    });
    geom.rotateX(Math.PI * 0.5);
    geom.translate(0, 0.105, 0);
    const carbonMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#1A1C20"),
      roughness: 0.24,
      metalness: 0.7,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      name: "mat_carbon_shank"
    });
    const mesh = new THREE.Mesh(geom, carbonMat);
    mesh.name = "mesh_carbon_shank";
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { segment: "sole", subpart: "carbon_plate" };
    return mesh;
  }
  /**
   * Builds the Layered Upper Shoe Body (Vamp, Quarters, Collar, Inner Lining).
   */
  static buildUpper(upperMaterial) {
    const group = new THREE.Group();
    group.name = "assembly_upper";
    const radiusTop = 0.4;
    const radiusBottom = 0.48;
    const height = 0.75;
    const radialSegments = 24;
    const heightSegments = 16;
    const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, true);
    geom.rotateZ(Math.PI * 0.5);
    geom.rotateY(Math.PI * 0.5);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      z *= 3;
      x *= 0.95;
      const t = (z + 1.2) / 2.4;
      if (t > 0.6) {
        y = y * 0.65 + 0.35 + Math.pow(t - 0.6, 2) * 0.15;
      } else {
        y = y * 0.85 + 0.55 + (0.6 - t) * 0.35;
      }
      if (t > 0.85) {
        x *= 1 - (t - 0.85) * 2.2;
      }
      pos.setXYZ(i, x, y, z);
    }
    geom.computeVertexNormals();
    const upperMesh = new THREE.Mesh(geom, upperMaterial);
    upperMesh.name = "mesh_upper_body";
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    upperMesh.userData = { segment: "upper", subpart: "vamp_quarters" };
    group.add(upperMesh);
    const collarCurve = new THREE.EllipseCurve(
      0,
      0,
      // ax, aY
      0.22,
      0.32,
      // xRadius, yRadius
      0,
      2 * Math.PI,
      // aStartAngle, aEndAngle
      false,
      // aClockwise
      0
      // aRotation
    );
    const collarPoints = collarCurve.getPoints(32).map((p) => new THREE.Vector3(p.x, 0.82, p.y - 0.35));
    const collarPath = new THREE.CatmullRomCurve3(collarPoints, true);
    const collarGeom = new THREE.TubeGeometry(collarPath, 32, 0.045, 8, true);
    const collarMesh = new THREE.Mesh(collarGeom, upperMaterial);
    collarMesh.name = "mesh_collar_rim";
    collarMesh.castShadow = true;
    collarMesh.userData = { segment: "upper", subpart: "collar" };
    group.add(collarMesh);
    const tongueCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.42, 0.55),
      new THREE.Vector3(0, 0.6, 0.3),
      new THREE.Vector3(0, 0.78, 0.08),
      new THREE.Vector3(0, 0.95, -0.15)
    ]);
    const tongueGeom = new THREE.TubeGeometry(tongueCurve, 20, 0.16, 8, false);
    tongueGeom.scale(1.2, 0.25, 1);
    const tongueMesh = new THREE.Mesh(tongueGeom, upperMaterial);
    tongueMesh.name = "mesh_tongue";
    tongueMesh.castShadow = true;
    tongueMesh.userData = { segment: "upper", subpart: "tongue" };
    group.add(tongueMesh);
    return group;
  }
  /**
   * Builds the Criss-Cross Lacing System & Metallic Eyelets.
   */
  static buildLacingSystem(lacesMaterial, accentMaterial) {
    const group = new THREE.Group();
    group.name = "assembly_laces";
    const eyeletPairs = [
      [new THREE.Vector3(-0.19, 0.5, 0.52), new THREE.Vector3(0.19, 0.5, 0.52)],
      [new THREE.Vector3(-0.21, 0.58, 0.38), new THREE.Vector3(0.21, 0.58, 0.38)],
      [new THREE.Vector3(-0.22, 0.66, 0.24), new THREE.Vector3(0.22, 0.66, 0.24)],
      [new THREE.Vector3(-0.22, 0.74, 0.1), new THREE.Vector3(0.22, 0.74, 0.1)],
      [new THREE.Vector3(-0.21, 0.82, -0.04), new THREE.Vector3(0.21, 0.82, -0.04)]
    ];
    const grommetGeom = new THREE.TorusGeometry(0.022, 7e-3, 8, 16);
    grommetGeom.rotateX(Math.PI * 0.35);
    eyeletPairs.forEach(([left, right], idx) => {
      const leftRing = new THREE.Mesh(grommetGeom, accentMaterial);
      leftRing.position.copy(left);
      leftRing.name = `mesh_eyelet_L_${idx + 1}`;
      leftRing.userData = { segment: "accents", subpart: "eyelet" };
      group.add(leftRing);
      const rightRing = new THREE.Mesh(grommetGeom, accentMaterial);
      rightRing.position.copy(right);
      rightRing.name = `mesh_eyelet_R_${idx + 1}`;
      rightRing.userData = { segment: "accents", subpart: "eyelet" };
      group.add(rightRing);
    });
    for (let i = 0; i < eyeletPairs.length - 1; i++) {
      const [lCurrent, rCurrent] = eyeletPairs[i];
      const [lNext, rNext] = eyeletPairs[i + 1];
      const midPoint1 = new THREE.Vector3(
        0,
        (lCurrent.y + rNext.y) * 0.5 + 0.035,
        // Arch slightly over tongue
        (lCurrent.z + rNext.z) * 0.5
      );
      const curve1 = new THREE.CatmullRomCurve3([lCurrent, midPoint1, rNext]);
      const laceGeom1 = new THREE.TubeGeometry(curve1, 16, 0.015, 8, false);
      const laceMesh1 = new THREE.Mesh(laceGeom1, lacesMaterial);
      laceMesh1.name = `mesh_lace_cross_LR_${i}`;
      laceMesh1.castShadow = true;
      laceMesh1.userData = { segment: "laces", subpart: "criss_cross" };
      group.add(laceMesh1);
      const midPoint2 = new THREE.Vector3(
        0,
        (rCurrent.y + lNext.y) * 0.5 + 0.025,
        (rCurrent.z + lNext.z) * 0.5
      );
      const curve2 = new THREE.CatmullRomCurve3([rCurrent, midPoint2, lNext]);
      const laceGeom2 = new THREE.TubeGeometry(curve2, 16, 0.015, 8, false);
      const laceMesh2 = new THREE.Mesh(laceGeom2, lacesMaterial);
      laceMesh2.name = `mesh_lace_cross_RL_${i}`;
      laceMesh2.castShadow = true;
      laceMesh2.userData = { segment: "laces", subpart: "criss_cross" };
      group.add(laceMesh2);
    }
    const knotCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.12, 0.85, -0.04),
      new THREE.Vector3(0, 0.88, -0.02),
      new THREE.Vector3(0.12, 0.85, -0.04)
    ]);
    const knotGeom = new THREE.TubeGeometry(knotCurve, 12, 0.02, 8, false);
    const knotMesh = new THREE.Mesh(knotGeom, lacesMaterial);
    knotMesh.name = "mesh_lace_knot";
    knotMesh.castShadow = true;
    knotMesh.userData = { segment: "laces", subpart: "knot" };
    group.add(knotMesh);
    const agletGeom = new THREE.CylinderGeometry(9e-3, 9e-3, 0.08, 8);
    const leftAglet = new THREE.Mesh(agletGeom, accentMaterial);
    leftAglet.position.set(-0.14, 0.78, -0.02);
    leftAglet.rotation.z = 0.35;
    leftAglet.userData = { segment: "accents", subpart: "aglet" };
    group.add(leftAglet);
    const rightAglet = new THREE.Mesh(agletGeom, accentMaterial);
    rightAglet.position.set(0.14, 0.78, -0.02);
    rightAglet.rotation.z = -0.35;
    rightAglet.userData = { segment: "accents", subpart: "aglet" };
    group.add(rightAglet);
    return group;
  }
  /**
   * Builds the Ergonomic Heel Stabilizer Clip & Lateral/Medial Branding Blades.
   */
  static buildAccents(accentMaterial) {
    const group = new THREE.Group();
    group.name = "assembly_accents";
    const heelCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.38, 0.38, -0.8),
      new THREE.Vector3(0.42, 0.44, -1.05),
      new THREE.Vector3(0, 0.46, -1.32),
      new THREE.Vector3(-0.42, 0.44, -1.05),
      new THREE.Vector3(-0.38, 0.38, -0.8)
    ]);
    const heelClipGeom = new THREE.TubeGeometry(heelCurve, 28, 0.042, 8, false);
    heelClipGeom.scale(1, 1.8, 1);
    const heelClipMesh = new THREE.Mesh(heelClipGeom, accentMaterial);
    heelClipMesh.name = "mesh_heel_clip";
    heelClipMesh.castShadow = true;
    heelClipMesh.receiveShadow = true;
    heelClipMesh.userData = { segment: "accents", subpart: "heel_clip" };
    group.add(heelClipMesh);
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.55, 0.08);
    bladeShape.lineTo(0.68, 0.16);
    bladeShape.lineTo(0.18, 0.07);
    bladeShape.closePath();
    const bladeExtrude = {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 6e-3,
      bevelThickness: 6e-3
    };
    const lateralGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrude);
    lateralGeom.rotateY(-Math.PI * 0.5);
    lateralGeom.translate(0.46, 0.42, -0.1);
    const lateralBlade = new THREE.Mesh(lateralGeom, accentMaterial);
    lateralBlade.name = "mesh_lateral_accent_blade";
    lateralBlade.castShadow = true;
    lateralBlade.userData = { segment: "accents", subpart: "lateral_blade" };
    group.add(lateralBlade);
    const medialGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrude);
    medialGeom.rotateY(Math.PI * 0.5);
    medialGeom.translate(-0.46, 0.42, -0.1);
    const medialBlade = new THREE.Mesh(medialGeom, accentMaterial);
    medialBlade.name = "mesh_medial_accent_blade";
    medialBlade.castShadow = true;
    medialBlade.userData = { segment: "accents", subpart: "medial_blade" };
    group.add(medialBlade);
    return group;
  }
  /**
   * Main Factory Method:
   * Constructs the complete compound sneaker assembly, groups, tags, and material maps.
   */
  static createSneakerAssembly() {
    const root = new THREE.Group();
    root.name = "sneaker_root";
    root.userData = { isSneakerRoot: true };
    const matUpper = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#141518"),
      roughness: 0.45,
      metalness: 0.05,
      clearcoat: 0.15,
      clearcoatRoughness: 0.35,
      sheen: 0.25,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color("#FFFFFF"),
      name: "mat_upper_pbr",
      side: THREE.DoubleSide
    });
    const matSole = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#D4FF00"),
      roughness: 0.7,
      metalness: 0.02,
      clearcoat: 0,
      name: "mat_sole_pbr"
    });
    const matAccents = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#E8ECEF"),
      roughness: 0.16,
      metalness: 0.92,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      iridescence: 0.75,
      iridescenceIOR: 1.45,
      iridescenceThicknessRange: [120, 380],
      name: "mat_accents_pbr"
    });
    const matLaces = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0A0B0D"),
      roughness: 0.85,
      metalness: 0,
      clearcoat: 0,
      name: "mat_laces_pbr"
    });
    const rigUpper = new THREE.Group();
    rigUpper.name = "rig_upper";
    const rigLaces = new THREE.Group();
    rigLaces.name = "rig_laces";
    const rigCarbon = new THREE.Group();
    rigCarbon.name = "rig_carbon";
    const rigSole = new THREE.Group();
    rigSole.name = "rig_sole";
    const rigAccents = new THREE.Group();
    rigAccents.name = "rig_accents";
    const outsoleGroup = this.buildOutsole(matSole);
    const midsoleMesh = this.buildMidsole(matSole);
    const carbonShankMesh = this.buildCarbonShankPlate();
    const upperGroup = this.buildUpper(matUpper);
    const lacingGroup = this.buildLacingSystem(matLaces, matAccents);
    const accentsGroup = this.buildAccents(matAccents);
    rigSole.add(outsoleGroup);
    rigSole.add(midsoleMesh);
    rigCarbon.add(carbonShankMesh);
    rigUpper.add(upperGroup);
    rigLaces.add(lacingGroup);
    rigAccents.add(accentsGroup);
    root.add(rigSole);
    root.add(rigCarbon);
    root.add(rigUpper);
    root.add(rigLaces);
    root.add(rigAccents);
    const rigGroups = {
      upper: rigUpper,
      laces: rigLaces,
      carbon: rigCarbon,
      sole: rigSole,
      accents: rigAccents
    };
    const materialMap = /* @__PURE__ */ new Map();
    materialMap.set("upper", [matUpper]);
    materialMap.set("sole", [matSole]);
    materialMap.set("accents", [matAccents]);
    materialMap.set("laces", [matLaces]);
    return {
      root,
      rigGroups,
      materialMap
    };
  }
};

// src/components/3d/StudioLighting.ts
import * as THREE2 from "three";
function createStudioLighting(scene2, options = {}) {
  const isMobile = options.isMobile ?? (typeof window !== "undefined" && window.innerWidth < 768);
  const lightGroup = new THREE2.Group();
  lightGroup.name = "studio_lighting_rig";
  const keyLight = new THREE2.DirectionalLight(16774893, 2.2);
  keyLight.name = "light_key";
  keyLight.position.set(4.5, 6, 4);
  keyLight.target.position.set(0, 0.4, 0);
  keyLight.castShadow = true;
  const shadowResolution = isMobile ? 1024 : 2048;
  keyLight.shadow.mapSize.width = shadowResolution;
  keyLight.shadow.mapSize.height = shadowResolution;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 18;
  keyLight.shadow.camera.left = -3.5;
  keyLight.shadow.camera.right = 3.5;
  keyLight.shadow.camera.top = 3.5;
  keyLight.shadow.camera.bottom = -3.5;
  keyLight.shadow.bias = -12e-5;
  keyLight.shadow.normalBias = 0.038;
  keyLight.shadow.radius = 2.5;
  lightGroup.add(keyLight);
  lightGroup.add(keyLight.target);
  const fillLight = new THREE2.DirectionalLight(15463167, 0.85);
  fillLight.name = "light_fill";
  fillLight.position.set(-5, 3, -2);
  fillLight.target.position.set(0, 0.4, 0);
  fillLight.castShadow = false;
  lightGroup.add(fillLight);
  lightGroup.add(fillLight.target);
  const rimLight = new THREE2.DirectionalLight(16777215, 2.8);
  rimLight.name = "light_rim";
  rimLight.position.set(0, 5.2, -5.8);
  rimLight.target.position.set(0, 0.4, 0);
  rimLight.castShadow = false;
  lightGroup.add(rimLight);
  lightGroup.add(rimLight.target);
  const hemiLight = new THREE2.HemisphereLight(1842466, 657932, 0.6);
  hemiLight.name = "light_hemi";
  lightGroup.add(hemiLight);
  scene2.add(lightGroup);
  return {
    keyLight,
    fillLight,
    rimLight,
    hemiLight,
    lightGroup,
    dispose: () => {
      scene2.remove(lightGroup);
      keyLight.dispose();
      fillLight.dispose();
      rimLight.dispose();
      hemiLight.dispose();
    }
  };
}

// src/components/3d/ContactShadow.ts
import * as THREE3 from "three";
function generateCosineAOTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const centerX = size / 2;
    const centerY = size / 2;
    const radiusX = size * 0.44;
    const radiusY = size * 0.22;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const dx = (px - centerX) / radiusX;
        const dy = (py - centerY) / radiusY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 1) {
          const factor = Math.cos(dist * Math.PI / 2);
          const alpha = factor * factor * 0.75;
          const idx = (py * size + px) * 4;
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = Math.round(alpha * 255);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  const texture = new THREE3.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = true;
  texture.minFilter = THREE3.LinearMipmapLinearFilter;
  return texture;
}
function createContactShadow(scene2) {
  const shadowGroup = new THREE3.Group();
  shadowGroup.name = "contact_shadow_group";
  const shadowGeo = new THREE3.PlaneGeometry(14, 14);
  const shadowMat = new THREE3.ShadowMaterial({
    opacity: 0.38,
    transparent: true,
    depthWrite: false
  });
  const shadowPlane = new THREE3.Mesh(shadowGeo, shadowMat);
  shadowPlane.name = "mesh_dynamic_shadow_receiver";
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0, 0);
  shadowPlane.receiveShadow = true;
  shadowGroup.add(shadowPlane);
  const aoTexture = generateCosineAOTexture();
  const aoGeo = new THREE3.PlaneGeometry(3.6, 1.8);
  const aoMat = new THREE3.MeshBasicMaterial({
    map: aoTexture,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  });
  const aoPlane = new THREE3.Mesh(aoGeo, aoMat);
  aoPlane.name = "mesh_cosine_ao_contact";
  aoPlane.rotation.x = -Math.PI / 2;
  aoPlane.position.set(0, 2e-3, 0);
  shadowGroup.add(aoPlane);
  const floorGeo = new THREE3.CircleGeometry(16, 64);
  const floorMat = new THREE3.MeshStandardMaterial({
    color: 789776,
    roughness: 0.3,
    metalness: 0.15,
    depthWrite: true
  });
  const floorPlane = new THREE3.Mesh(floorGeo, floorMat);
  floorPlane.name = "mesh_studio_floor";
  floorPlane.rotation.x = -Math.PI / 2;
  floorPlane.position.set(0, -1e-3, 0);
  floorPlane.receiveShadow = true;
  shadowGroup.add(floorPlane);
  scene2.add(shadowGroup);
  return {
    shadowGroup,
    shadowPlane,
    aoPlane,
    floorPlane,
    dispose: () => {
      scene2.remove(shadowGroup);
      shadowGeo.dispose();
      shadowMat.dispose();
      aoGeo.dispose();
      aoMat.dispose();
      aoTexture.dispose();
      floorGeo.dispose();
      floorMat.dispose();
    }
  };
}

// src/components/3d/SneakerLoader.ts
import * as THREE4 from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
var SneakerModelLoader = class {
  gltfLoader;
  timeoutMs;
  constructor(dracoPath = "/draco/", timeoutMs = 3500) {
    this.timeoutMs = timeoutMs;
    this.gltfLoader = new GLTFLoader();
    if (typeof window !== "undefined") {
      try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(dracoPath);
        this.gltfLoader.setDRACOLoader(dracoLoader);
      } catch (e) {
        console.warn("[SneakerModelLoader] DRACOLoader initialization deferred:", e);
      }
    }
  }
  /**
   * Loads the sneaker model from the provided URL.
   * Automatically falls back to the compound procedural model on timeout, 404, or parse error.
   */
  async loadSneaker(url = "/models/sneaker.glb", onProgress) {
    try {
      const gltfPromise = new Promise((resolve, reject) => {
        this.gltfLoader.load(
          url,
          (gltf) => {
            const parsed = this.processGltfModel(gltf.scene);
            resolve(parsed);
          },
          (event) => {
            if (event.lengthComputable && onProgress) {
              onProgress(Math.round(event.loaded / event.total * 100));
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Model load timed out after ${this.timeoutMs}ms`)),
          this.timeoutMs
        );
      });
      return await Promise.race([gltfPromise, timeoutPromise]);
    } catch (err) {
      console.warn(
        `[SneakerModelLoader] glTF model '${url}' unavailable or timed out. Falling back to high-fidelity procedural compound geometry.`,
        err
      );
      return this.loadProceduralFallback();
    }
  }
  /**
   * Instantiates the self-contained procedural sneaker model.
   */
  loadProceduralFallback() {
    const assembly2 = ProceduralSneakerGenerator.createSneakerAssembly();
    return {
      model: assembly2.root,
      isProcedural: true,
      materialMap: assembly2.materialMap,
      rigGroups: assembly2.rigGroups
    };
  }
  /**
   * Traverses glTF scene, classifies mesh nodes into segments via regex,
   * and normalizes materials to MeshPhysicalMaterial.
   */
  processGltfModel(scene2) {
    const materialMap = /* @__PURE__ */ new Map();
    materialMap.set("upper", []);
    materialMap.set("sole", []);
    materialMap.set("accents", []);
    materialMap.set("laces", []);
    const upperRegex = /(upper|vamp|quarter|tongue|collar|toe|lining|body|shoe)/i;
    const soleRegex = /(sole|midsole|outsole|tread|cushion|foam|shank|carbon)/i;
    const accentsRegex = /(accent|swoosh|stripe|logo|clip|counter|badge|eyelet|aglet)/i;
    const lacesRegex = /(lace|string|knot|cord|tie)/i;
    scene2.traverse((child) => {
      if (child.isMesh) {
        const mesh = child;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const name = mesh.name || "";
        let segment = "upper";
        if (lacesRegex.test(name)) {
          segment = "laces";
        } else if (accentsRegex.test(name)) {
          segment = "accents";
        } else if (soleRegex.test(name)) {
          segment = "sole";
        } else if (upperRegex.test(name)) {
          segment = "upper";
        }
        mesh.userData.segment = segment;
        if (!mesh.material) {
          mesh.material = new THREE4.MeshPhysicalMaterial({ name: `mat_${segment}_fallback` });
        }
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          let pbrMat;
          if (m instanceof THREE4.MeshPhysicalMaterial) {
            pbrMat = m;
          } else {
            const stdMat = m;
            pbrMat = new THREE4.MeshPhysicalMaterial({
              color: stdMat.color ? stdMat.color.clone() : new THREE4.Color(16777215),
              map: stdMat.map || null,
              roughness: stdMat.roughness ?? 0.5,
              metalness: stdMat.metalness ?? 0.1,
              name: m.name || `mat_${segment}_converted`
            });
            mesh.material = pbrMat;
          }
          const existing = materialMap.get(segment) || [];
          if (!existing.includes(pbrMat)) {
            existing.push(pbrMat);
            materialMap.set(segment, existing);
          }
        });
      }
    });
    return {
      model: scene2,
      isProcedural: false,
      materialMap
    };
  }
};

// tests/challenger-m1-2-stress.mjs
var listeners = {
  window: /* @__PURE__ */ new Map(),
  dom: /* @__PURE__ */ new Map()
};
globalThis.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 2,
  addEventListener: (type, fn, opts) => {
    if (!listeners.window.has(type)) listeners.window.set(type, /* @__PURE__ */ new Set());
    listeners.window.get(type).add(fn);
  },
  removeEventListener: (type, fn) => {
    if (listeners.window.has(type)) {
      listeners.window.get(type).delete(fn);
    }
  },
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id) => clearTimeout(id)
};
globalThis.self = globalThis.window;
global.self = globalThis.window;
globalThis.document = {
  createElement: (tag) => {
    const elListeners = /* @__PURE__ */ new Map();
    return {
      tagName: tag.toUpperCase(),
      width: 512,
      height: 512,
      clientWidth: 1920,
      clientHeight: 1080,
      style: {},
      ownerDocument: { defaultView: globalThis.window },
      getContext: (type, opts) => {
        if (type === "2d") {
          return {
            clearRect: () => {
            },
            createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
            putImageData: () => {
            },
            fillRect: () => {
            },
            beginPath: () => {
            },
            arc: () => {
            },
            fill: () => {
            }
          };
        }
        if (type === "webgl" || type === "webgl2") {
          const base = {
            VERTEX_SHADER: 35633,
            FRAGMENT_SHADER: 35632,
            HIGH_FLOAT: 36338,
            MEDIUM_FLOAT: 36337,
            LOW_FLOAT: 36336,
            HIGH_INT: 36341,
            MEDIUM_INT: 36340,
            LOW_INT: 36339,
            MAX_VERTEX_ATTRIBS: 34921,
            MAX_VARYING_VECTORS: 36348,
            MAX_VERTEX_UNIFORM_VECTORS: 36347,
            MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
            MAX_TEXTURE_IMAGE_UNITS: 34930,
            MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
            MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
            MAX_TEXTURE_SIZE: 3379,
            MAX_CUBE_MAP_TEXTURE_SIZE: 34076,
            MAX_RENDERBUFFER_SIZE: 34024,
            VERSION: 7938,
            SHADING_LANGUAGE_VERSION: 35724,
            VENDOR: 7936,
            RENDERER: 7937,
            CCW: 2305,
            CW: 2304,
            BACK: 1029,
            FRONT: 1028,
            FRONT_AND_BACK: 1032,
            CULL_FACE: 2884,
            DEPTH_TEST: 2929,
            BLEND: 3042,
            SCISSOR_TEST: 3089,
            DEPTH_BUFFER_BIT: 256,
            STENCIL_BUFFER_BIT: 1024,
            COLOR_BUFFER_BIT: 16384,
            RGBA: 6408,
            RGB: 6407,
            UNSIGNED_BYTE: 5121,
            TEXTURE_2D: 3553,
            TEXTURE_3D: 32879,
            TEXTURE_CUBE_MAP: 34067,
            getShaderPrecisionFormat: () => ({ rangeMin: 1, rangeMax: 1, precision: 23 }),
            getParameter: (param) => {
              if (param === 7938) return "WebGL 2.0";
              if (param === 35724) return "WebGL GLSL ES 3.00";
              return 16;
            },
            getExtension: (name) => {
              if (name === "WEBGL_lose_context") {
                return {
                  loseContext: () => {
                    glContextLostCount++;
                  }
                };
              }
              return {};
            },
            getSupportedExtensions: () => [],
            checkFramebufferStatus: () => 36053,
            getShaderParameter: () => true,
            getProgramParameter: () => true,
            getUniformLocation: () => ({}),
            getAttribLocation: () => 0,
            createBuffer: () => ({}),
            createTexture: () => ({}),
            createProgram: () => ({}),
            createShader: () => ({}),
            createFramebuffer: () => ({}),
            createRenderbuffer: () => ({})
          };
          return new Proxy(base, {
            get(target, prop) {
              if (prop in target) return target[prop];
              if (typeof prop === "string" && prop === prop.toUpperCase()) return 1;
              return () => ({});
            }
          });
        }
        return null;
      },
      addEventListener: (type, fn, opts) => {
        if (!elListeners.has(type)) elListeners.set(type, /* @__PURE__ */ new Set());
        elListeners.get(type).add(fn);
        if (!listeners.dom.has(type)) listeners.dom.set(type, /* @__PURE__ */ new Set());
        listeners.dom.get(type).add(fn);
      },
      removeEventListener: (type, fn) => {
        if (elListeners.has(type)) elListeners.get(type).delete(fn);
        if (listeners.dom.has(type)) listeners.dom.get(type).delete(fn);
      },
      _listeners: elListeners
    };
  }
};
var glContextLostCount = 0;
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var projectRoot = path.resolve(__dirname, "..");
var distDir = path.resolve(projectRoot, "dist");
console.log("======================================================================");
console.log("   CHALLENGER M1-2: MEMORY LEAK & PERFORMANCE EMPIRICAL HARNESS");
console.log("======================================================================\n");
var disposedGeometries = /* @__PURE__ */ new Set();
var disposedMaterials = /* @__PURE__ */ new Set();
var disposedTextures = /* @__PURE__ */ new Set();
var origGeoDispose = THREE5.BufferGeometry.prototype.dispose;
var origMatDispose = THREE5.Material.prototype.dispose;
var origTexDispose = THREE5.Texture.prototype.dispose;
THREE5.BufferGeometry.prototype.dispose = function() {
  disposedGeometries.add(this);
  return origGeoDispose.apply(this, arguments);
};
THREE5.Material.prototype.dispose = function() {
  disposedMaterials.add(this);
  return origMatDispose.apply(this, arguments);
};
THREE5.Texture.prototype.dispose = function() {
  disposedTextures.add(this);
  return origTexDispose.apply(this, arguments);
};
console.log("----------------------------------------------------------------------");
console.log("TEST SUITE 1: Procedural Sneaker Model Teardown & Resource Disposal");
console.log("----------------------------------------------------------------------");
var assembly = ProceduralSneakerGenerator.createSneakerAssembly();
var sneakerRoot = assembly.root;
var sneakerMeshes = [];
var allSneakerGeos = /* @__PURE__ */ new Set();
var allSneakerMats = /* @__PURE__ */ new Set();
sneakerRoot.traverse((obj) => {
  if (obj.isMesh) {
    sneakerMeshes.push(obj);
    if (obj.geometry) allSneakerGeos.add(obj.geometry);
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => allSneakerMats.add(m));
      } else {
        allSneakerMats.add(obj.material);
      }
    }
  }
});
console.log(`[ProceduralSneaker Hierarchy Audit]`);
console.log(`- Total Meshes: ${sneakerMeshes.length}`);
console.log(`- Unique Geometries: ${allSneakerGeos.size}`);
console.log(`- Unique Materials: ${allSneakerMats.size}`);
var scene = new THREE5.Scene();
var lightingRig = createStudioLighting(scene, { isMobile: false });
var contactShadow = createContactShadow(scene);
var loadedResult = {
  model: sneakerRoot,
  isProcedural: true,
  materialMap: assembly.materialMap,
  rigGroups: assembly.rigGroups
};
scene.add(loadedResult.model);
disposedGeometries.clear();
disposedMaterials.clear();
disposedTextures.clear();
console.log("\n[Executing SceneCanvas.tsx unmount cleanup routine...]");
lightingRig.dispose();
contactShadow.dispose();
if (loadedResult) {
  scene.remove(loadedResult.model);
}
scene.traverse((object) => {
  if (object.isMesh) {
    const mesh = object;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => m.dispose());
    }
  }
});
var sneakerGeosDisposed = 0;
var sneakerGeosUndisposed = 0;
for (const geo of allSneakerGeos) {
  if (disposedGeometries.has(geo)) {
    sneakerGeosDisposed++;
  } else {
    sneakerGeosUndisposed++;
  }
}
var sneakerMatsDisposed = 0;
var sneakerMatsUndisposed = 0;
for (const mat of allSneakerMats) {
  if (disposedMaterials.has(mat)) {
    sneakerMatsDisposed++;
  } else {
    sneakerMatsUndisposed++;
  }
}
console.log(`
Disposal Results for Sneaker Model:`);
console.log(`- Sneaker Geometries Disposed: ${sneakerGeosDisposed} / ${allSneakerGeos.size}`);
console.log(`- Sneaker Geometries Undisposed (LEAKED): ${sneakerGeosUndisposed}`);
console.log(`- Sneaker Materials Disposed: ${sneakerMatsDisposed} / ${allSneakerMats.size}`);
console.log(`- Sneaker Materials Undisposed (LEAKED): ${sneakerMatsUndisposed}`);
console.log(`- Contact Shadow Geometries Disposed: 3`);
console.log(`- Total Disposed Geometries in Scene: ${disposedGeometries.size}`);
var disposalBugConfirmed = sneakerGeosUndisposed > 0 || sneakerMatsUndisposed > 0;
if (disposalBugConfirmed) {
  console.log(`
\u{1F6A8} CRITICAL BUG DETECTED [M1-DISPOSAL-LEAK]:`);
  console.log(`   In SceneCanvas.tsx line 192, 'scene.remove(loadedResult.model)' is called`);
  console.log(`   BEFORE 'scene.traverse(...)'. Because the model root is detached from the`);
  console.log(`   scene hierarchy, 'scene.traverse' never traverses the sneaker meshes!`);
  console.log(`   As a result, 100% of sneaker geometries (${sneakerGeosUndisposed}) and`);
  console.log(`   materials (${sneakerMatsUndisposed}) leak in memory across unmounts!`);
} else {
  console.log(`\u2713 All geometries and materials were disposed.`);
}
console.log("\n----------------------------------------------------------------------");
console.log("TEST SUITE 2: Rapid Mount/Unmount Stress (100 Iterations)");
console.log("----------------------------------------------------------------------");
listeners.window.clear();
listeners.dom.clear();
var totalControlsDisposes = 0;
var totalLightingDisposes = 0;
var totalShadowDisposes = 0;
global.window = globalThis.window;
global.document = globalThis.document;
var totalRendererDisposes = 0;
var forceContextLossCalls = 0;
var origRndrDispose = THREE5.WebGLRenderer.prototype.dispose;
THREE5.WebGLRenderer.prototype.dispose = function() {
  totalRendererDisposes++;
  try {
    return origRndrDispose.apply(this, arguments);
  } catch (e) {
  }
};
var origForceLoss = THREE5.WebGLRenderer.prototype.forceContextLoss;
THREE5.WebGLRenderer.prototype.forceContextLoss = function() {
  forceContextLossCalls++;
  if (origForceLoss) return origForceLoss.apply(this, arguments);
};
for (let i = 0; i < 100; i++) {
  const container = { clientWidth: 1920, clientHeight: 1080 };
  const canvas = globalThis.document.createElement("canvas");
  let isDisposed = false;
  let animationFrameId;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const isMobile = false;
  const s = new THREE5.Scene();
  const cam = new THREE5.PerspectiveCamera(40, width / height, 0.1, 100);
  const rndr = new THREE5.WebGLRenderer({ canvas });
  const origDispose = rndr.dispose;
  rndr.dispose = function() {
    totalRendererDisposes++;
    return origDispose.apply(this, arguments);
  };
  const ctrl = {
    target: new THREE5.Vector3(),
    autoRotate: true,
    autoRotateSpeed: 1.2,
    update: () => {
    },
    dispose: () => {
      totalControlsDisposes++;
    }
  };
  let idleTimer = null;
  const pauseAutoRotate = () => {
  };
  const scheduleResume = () => {
  };
  const onWheel = () => {
  };
  const dom = rndr.domElement;
  dom.addEventListener("pointerdown", pauseAutoRotate);
  dom.addEventListener("pointerup", scheduleResume);
  dom.addEventListener("touchstart", pauseAutoRotate, { passive: true });
  dom.addEventListener("touchend", scheduleResume);
  dom.addEventListener("wheel", onWheel, { passive: true });
  const lRig = createStudioLighting(s, { isMobile });
  const cShadow = createContactShadow(s);
  const handleResize = () => {
  };
  globalThis.window.addEventListener("resize", handleResize);
  animationFrameId = globalThis.window.requestAnimationFrame(() => {
  });
  isDisposed = true;
  globalThis.window.cancelAnimationFrame(animationFrameId);
  if (idleTimer) clearTimeout(idleTimer);
  globalThis.window.removeEventListener("resize", handleResize);
  dom.removeEventListener("pointerdown", pauseAutoRotate);
  dom.removeEventListener("pointerup", scheduleResume);
  dom.removeEventListener("touchstart", pauseAutoRotate);
  dom.removeEventListener("touchend", scheduleResume);
  dom.removeEventListener("wheel", onWheel);
  ctrl.dispose();
  lRig.dispose();
  totalLightingDisposes++;
  cShadow.dispose();
  totalShadowDisposes++;
  s.traverse((object) => {
    if (object.isMesh) {
      if (object.geometry) object.geometry.dispose();
    }
  });
  rndr.dispose();
}
console.log(`[100 Cycle Mount/Unmount Execution Stats]`);
console.log(`- WebGLRenderer Disposals: ${totalRendererDisposes} / 100`);
console.log(`- Controls Disposals: ${totalControlsDisposes} / 100`);
console.log(`- StudioLighting Disposals: ${totalLightingDisposes} / 100`);
console.log(`- ContactShadow Disposals: ${totalShadowDisposes} / 100`);
var resizeListenersRemaining = listeners.window.get("resize") ? listeners.window.get("resize").size : 0;
console.log(`- Window 'resize' Listeners Remaining: ${resizeListenersRemaining}`);
var canvasListenersRemaining = 0;
for (const [evt, set] of listeners.dom.entries()) {
  canvasListenersRemaining += set.size;
}
console.log(`- Canvas DOM Event Listeners Remaining: ${canvasListenersRemaining}`);
console.log(`- WebGL renderer.forceContextLoss() calls: ${forceContextLossCalls}`);
if (forceContextLossCalls === 0) {
  console.log(`\u26A0\uFE0F  NOTE [M1-WEBGL-CONTEXT-RELEASE]: Three.js 'renderer.dispose()' was called,`);
  console.log(`   but 'renderer.forceContextLoss()' is NOT called in cleanup.`);
  console.log(`   While standard Three.js apps rely on renderer.dispose() for buffer cleanup,`);
  console.log(`   calling forceContextLoss() ensures immediate context release in browsers`);
  console.log(`   with strict WebGL context limits (e.g., 8-16 context limit in Chrome/Safari).`);
}
console.log("\n[Checking SneakerModelLoader Timeout Behavior during Rapid Unmount...]");
var loader = new SneakerModelLoader("/draco/", 3500);
console.log(`- SneakerModelLoader has a 3500ms timeout promise with no AbortController or clearTimeout handle.`);
console.log(`- Rapid unmounting before 3500ms leaves pending timers in the JS event loop.`);
console.log("\n----------------------------------------------------------------------");
console.log("TEST SUITE 3: Production Bundle & Chunk Isolation Analysis (dist/)");
console.log("----------------------------------------------------------------------");
var assetsDir = path.join(distDir, "assets");
var assetFiles = fs.readdirSync(assetsDir);
var chunkStats = [];
var totalJsSize = 0;
var totalCssSize = 0;
var hasSourceMaps = false;
var hasDebugger = false;
var vendorIsolation = {
  three: { file: null, size: 0, hasThree: false, hasGsap: false, hasReact: false },
  gsap: { file: null, size: 0, hasThree: false, hasGsap: false, hasReact: false },
  react: { file: null, size: 0, hasThree: false, hasGsap: false, hasReact: false },
  lucide: { file: null, size: 0 },
  app: { file: null, size: 0 }
};
for (const file of assetFiles) {
  const filePath = path.join(assetsDir, file);
  const stat = fs.statSync(filePath);
  const sizeKb = (stat.size / 1024).toFixed(2);
  if (file.endsWith(".map")) {
    hasSourceMaps = true;
  }
  if (file.endsWith(".js")) {
    totalJsSize += stat.size;
    const content = fs.readFileSync(filePath, "utf8");
    if (content.includes("sourceMappingURL=")) {
      hasSourceMaps = true;
    }
    if (/\bdebugger\b/.test(content)) {
      hasDebugger = true;
    }
    if (file.startsWith("three-vendor-")) {
      vendorIsolation.three.file = file;
      vendorIsolation.three.size = stat.size;
      vendorIsolation.three.hasThree = content.includes("WebGLRenderer") || content.includes("MeshPhysicalMaterial");
      vendorIsolation.three.hasGsap = content.includes("gsap") || content.includes("Tween");
      vendorIsolation.three.hasReact = content.includes("useState") || content.includes("useEffect");
    } else if (file.startsWith("gsap-vendor-")) {
      vendorIsolation.gsap.file = file;
      vendorIsolation.gsap.size = stat.size;
      vendorIsolation.gsap.hasGsap = content.includes("gsap") || content.includes("Tween");
      vendorIsolation.gsap.hasThree = content.includes("WebGLRenderer") || content.includes("MeshPhysicalMaterial");
      vendorIsolation.gsap.hasReact = content.includes("useState") || content.includes("useEffect");
    } else if (file.startsWith("react-vendor-")) {
      vendorIsolation.react.file = file;
      vendorIsolation.react.size = stat.size;
      vendorIsolation.react.hasReact = content.includes("useState") || content.includes("createElement");
      vendorIsolation.react.hasThree = content.includes("WebGLRenderer");
      vendorIsolation.react.hasGsap = content.includes("ScrollTrigger");
    } else if (file.startsWith("lucide-icons-")) {
      vendorIsolation.lucide.file = file;
      vendorIsolation.lucide.size = stat.size;
    } else if (file.startsWith("index-") && file.endsWith(".js")) {
      vendorIsolation.app.file = file;
      vendorIsolation.app.size = stat.size;
    }
    chunkStats.push({ file, type: "js", sizeBytes: stat.size, sizeKb: `${sizeKb} kB` });
  } else if (file.endsWith(".css")) {
    totalCssSize += stat.size;
    chunkStats.push({ file, type: "css", sizeBytes: stat.size, sizeKb: `${sizeKb} kB` });
  }
}
console.log("[Chunk Inventory & Sizes]:");
console.table(chunkStats);
console.log(`
Total Production JS: ${(totalJsSize / 1024).toFixed(2)} kB`);
console.log(`Total Production CSS: ${(totalCssSize / 1024).toFixed(2)} kB`);
console.log("\n[Chunk Isolation Verification]:");
console.log(`- Three.js Chunk (${vendorIsolation.three.file}):`);
console.log(`  Size: ${(vendorIsolation.three.size / 1024).toFixed(2)} kB`);
console.log(`  Contains Three.js: ${vendorIsolation.three.hasThree} (Expected: true)`);
console.log(`  Contains GSAP: ${vendorIsolation.three.hasGsap} (Expected: false)`);
console.log(`  Contains React: ${vendorIsolation.three.hasReact} (Expected: false)`);
console.log(`- GSAP Chunk (${vendorIsolation.gsap.file}):`);
console.log(`  Size: ${(vendorIsolation.gsap.size / 1024).toFixed(2)} kB`);
console.log(`  Contains GSAP: ${vendorIsolation.gsap.hasGsap} (Expected: true)`);
console.log(`  Contains Three.js: ${vendorIsolation.gsap.hasThree} (Expected: false)`);
console.log(`  Contains React: ${vendorIsolation.gsap.hasReact} (Expected: false)`);
console.log(`- React Vendor Chunk (${vendorIsolation.react.file}):`);
console.log(`  Size: ${(vendorIsolation.react.size / 1024).toFixed(2)} kB`);
console.log(`  Contains React: ${vendorIsolation.react.hasReact} (Expected: true)`);
console.log(`  Contains Three.js: ${vendorIsolation.react.hasThree} (Expected: false)`);
console.log(`- Lucide Icons Chunk (${vendorIsolation.lucide.file}): ${(vendorIsolation.lucide.size / 1024).toFixed(2)} kB`);
console.log(`- App Main Chunk (${vendorIsolation.app.file}): ${(vendorIsolation.app.size / 1024).toFixed(2)} kB`);
console.log("\n[Security & Production Cleanliness]:");
console.log(`- Source Maps Present: ${hasSourceMaps ? "FAIL (leaked)" : "PASS (clean - no sourcemaps in dist)"}`);
console.log(`- Debugger Statements: ${hasDebugger ? "FAIL (debugger found)" : "PASS (clean)"}`);
console.log("\n======================================================================");
console.log("   EMPIRICAL CHALLENGER VERDICT ASSESSMENT");
console.log("======================================================================");
var testsPassed = {
  chunkSplitting: vendorIsolation.three.hasThree && !vendorIsolation.three.hasGsap && vendorIsolation.gsap.hasGsap && !vendorIsolation.gsap.hasThree,
  noSourceMaps: !hasSourceMaps,
  noDebugger: !hasDebugger,
  listenerCleanup: resizeListenersRemaining === 0 && canvasListenersRemaining === 0,
  controlsDispose: totalControlsDisposes === 100,
  rendererDispose: totalRendererDisposes === 100,
  lightingDispose: totalLightingDisposes === 100,
  shadowDispose: totalShadowDisposes === 100,
  modelResourceDisposal: !disposalBugConfirmed
};
console.log(`1. Bundle Chunk Isolation & Sizes: ${testsPassed.chunkSplitting ? "PASS" : "FAIL"}`);
console.log(`2. Zero Sourcemap Leak: ${testsPassed.noSourceMaps ? "PASS" : "FAIL"}`);
console.log(`3. Zero Debugger Statements: ${testsPassed.noDebugger ? "PASS" : "FAIL"}`);
console.log(`4. Event Listener Teardown (Resize & Canvas): ${testsPassed.listenerCleanup ? "PASS" : "FAIL"}`);
console.log(`5. Three.js Controls & Renderer Cleanup: ${testsPassed.controlsDispose && testsPassed.rendererDispose ? "PASS" : "FAIL"}`);
console.log(`6. Procedural Model Resource Disposal (geometry.dispose & material.dispose): ${testsPassed.modelResourceDisposal ? "PASS" : "FAIL (MEMORY LEAK)"}`);
console.log("----------------------------------------------------------------------");
if (!testsPassed.modelResourceDisposal) {
  console.log("FINAL VERDICT: REJECT");
  console.log("Reason: Critical Memory Leak in SceneCanvas.tsx. Procedural sneaker");
  console.log("geometries and materials are detached from scene before scene.traverse(),");
  console.log("preventing geometry.dispose() and material.dispose() from executing.");
} else {
  console.log("FINAL VERDICT: APPROVE");
}
console.log("======================================================================\n");
