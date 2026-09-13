// tests/diagnose-meshes.ts
import * as THREE2 from "three";

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
    soleGeom.rotateX(-Math.PI * 0.5);
    soleGeom.rotateY(Math.PI);
    soleGeom.translate(0, 0.034, 0);
    const soleMesh = new THREE.Mesh(soleGeom, soleMaterial);
    soleMesh.name = "mesh_outsole_base";
    soleMesh.castShadow = true;
    soleMesh.receiveShadow = true;
    soleMesh.userData = { segment: "sole", subpart: "outsole" };
    group.add(soleMesh);
    const treadGeom = new THREE.BoxGeometry(0.55, 0.014, 0.05);
    const treadMat = soleMaterial.clone();
    treadMat.roughness = 0.85;
    for (let i = 0; i < 12; i++) {
      const zPos = -1.1 + i * 0.2;
      const widthScale = zPos > 0.2 && zPos < 0.9 ? 1.35 : zPos < -0.6 ? 1.1 : 0.85;
      const treadMesh = new THREE.Mesh(treadGeom, treadMat);
      treadMesh.name = `mesh_tread_lug_${i + 1}`;
      treadMesh.position.set(0, 7e-3, zPos);
      treadMesh.scale.set(widthScale, 1, 1);
      treadMesh.rotation.y = i % 2 === 0 ? 0.08 : -0.08;
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
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
      new THREE.Vector3(0, 0.44, 0.55),
      new THREE.Vector3(0, 0.62, 0.32),
      new THREE.Vector3(0, 0.78, 0.1),
      new THREE.Vector3(0, 0.95, -0.14)
    ]);
    const tongueGeom = new THREE.TubeGeometry(tongueCurve, 24, 0.045, 8, false);
    tongueGeom.scale(3.8, 1, 1);
    const tongueMesh = new THREE.Mesh(tongueGeom, upperMaterial);
    tongueMesh.name = "mesh_tongue";
    tongueMesh.castShadow = true;
    tongueMesh.receiveShadow = true;
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
      leftRing.castShadow = true;
      leftRing.userData = { segment: "accents", subpart: "eyelet" };
      group.add(leftRing);
      const rightRing = new THREE.Mesh(grommetGeom, accentMaterial);
      rightRing.position.copy(right);
      rightRing.name = `mesh_eyelet_R_${idx + 1}`;
      rightRing.castShadow = true;
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
    leftAglet.name = "mesh_aglet_L";
    leftAglet.castShadow = true;
    leftAglet.position.set(-0.14, 0.78, -0.02);
    leftAglet.rotation.z = 0.35;
    leftAglet.userData = { segment: "accents", subpart: "aglet" };
    group.add(leftAglet);
    const rightAglet = new THREE.Mesh(agletGeom, accentMaterial);
    rightAglet.name = "mesh_aglet_R";
    rightAglet.castShadow = true;
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
    const root2 = new THREE.Group();
    root2.name = "sneaker_root";
    root2.userData = { isSneakerRoot: true };
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
    root2.add(rigSole);
    root2.add(rigCarbon);
    root2.add(rigUpper);
    root2.add(rigLaces);
    root2.add(rigAccents);
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
      root: root2,
      rigGroups,
      materialMap
    };
  }
};

// tests/diagnose-meshes.ts
var assembly = ProceduralSneakerGenerator.createSneakerAssembly();
var root = assembly.root;
console.log("=== MESH BREAKDOWN ===");
var meshIdx = 0;
root.traverse((obj) => {
  if (obj.isMesh) {
    meshIdx++;
    const mesh = obj;
    const box = new THREE2.Box3().setFromObject(mesh);
    const size = new THREE2.Vector3();
    box.getSize(size);
    console.log(
      `#${meshIdx.toString().padStart(2, " ")} ${mesh.name.padEnd(28, " ")} | seg: ${(mesh.userData?.segment || "NONE").padEnd(7, " ")} | castShadow: ${String(mesh.castShadow).padEnd(5, " ")} | Y: [${box.min.y.toFixed(3)}, ${box.max.y.toFixed(3)}] | size: (${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}) | verts: ${mesh.geometry.attributes.position.count}`
    );
  }
});
var totalBox = new THREE2.Box3().setFromObject(root);
var totalSize = new THREE2.Vector3();
totalBox.getSize(totalSize);
console.log("\n=== COMPOSITE ASSEMBLY BOUNDS ===");
console.log(`Min: [${totalBox.min.x.toFixed(3)}, ${totalBox.min.y.toFixed(3)}, ${totalBox.min.z.toFixed(3)}]`);
console.log(`Max: [${totalBox.max.x.toFixed(3)}, ${totalBox.max.y.toFixed(3)}, ${totalBox.max.z.toFixed(3)}]`);
console.log(`Size: (${totalSize.x.toFixed(3)}, ${totalSize.y.toFixed(3)}, ${totalSize.z.toFixed(3)})`);
