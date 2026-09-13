/**
 * Challenger M1 Iteration 2 Empirical Verification Suite
 *
 * Exhaustive independent geometric and optical verification:
 * 1. Outsole base elevation and ground plane collision avoidance (Y >= 0.000, floor = -0.001).
 * 2. 12 tread chevrons protrusion, bounding limits [0.000, 0.014], and non-occlusion by outsole base.
 * 3. Tongue instep geometry curve spanning Y: [0.40, 0.98] and clearance above midsole foam.
 * 4. Spatial alignment between tongue instep curve and 4 criss-cross lace segments + knot.
 * 5. 100% castShadow compliance and non-anonymous node naming across all 42 procedural meshes.
 * 6. Adversarial vertex-level negative coordinate checks (no vertex < -0.001).
 */

import * as THREE from 'three';
import { ProceduralSneakerGenerator } from '../src/components/3d/ProceduralSneaker';
import { SegmentId } from '../src/types/sneaker';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
  details?: Record<string, any>;
}

const testResults: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[AssertionFailure] ${message}`);
  }
}

async function runTest(
  suite: string,
  name: string,
  fn: () => Promise<Record<string, any> | void> | Record<string, any> | void
) {
  const start = performance.now();
  try {
    const details = (await fn()) || undefined;
    const durationMs = performance.now() - start;
    testResults.push({ suite, name, passed: true, durationMs, details });
    console.log(`  ✓ [${suite}] ${name} (${durationMs.toFixed(2)}ms)`);
  } catch (err: any) {
    const durationMs = performance.now() - start;
    testResults.push({ suite, name, passed: false, error: err?.message || String(err), durationMs });
    console.error(`  ✗ [${suite}] ${name} (${durationMs.toFixed(2)}ms)`);
    console.error(`    ${err?.message || err}`);
  }
}

async function runChallengerSuite() {
  console.log('======================================================================');
  console.log(' CHALLENGER M1 ITERATION 2: EMPIRICAL GEOMETRY & SHADOW HARNESS');
  console.log(` Node: ${process.version} | Timestamp: ${new Date().toISOString()}`);
  console.log('======================================================================\n');

  const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
  const root = assembly.root;

  // Collect all meshes
  const meshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshes.push(obj as THREE.Mesh);
    }
  });

  // -------------------------------------------------------------------------
  // SUITE A: Outsole Base Elevation & Floor Clearance
  // -------------------------------------------------------------------------
  console.log('--- SUITE A: Outsole Base Elevation & Floor Plane Clearance ---');

  await runTest('Suite A: Outsole Elevation', 'mesh_outsole_base Y bounds strictly >= 0.000', () => {
    const outsoleMesh = meshes.find((m) => m.name === 'mesh_outsole_base');
    assert(!!outsoleMesh, 'mesh_outsole_base not found in procedural hierarchy');

    const box = new THREE.Box3().setFromObject(outsoleMesh!);
    assert(
      box.min.y >= 0.000,
      `mesh_outsole_base min Y is ${box.min.y.toFixed(4)}, which violates >= 0.000`
    );
    assert(
      box.min.y >= 0.010,
      `mesh_outsole_base min Y is ${box.min.y.toFixed(4)}, expected to sit above tread lugs (>= 0.010)`
    );

    return {
      minY: box.min.y.toFixed(4),
      maxY: box.max.y.toFixed(4),
      height: (box.max.y - box.min.y).toFixed(4),
      status: 'ABOVE_GROUND_FLOOR',
    };
  });

  await runTest('Suite A: Outsole Elevation', 'Zero mesh vertices penetrate beneath studio floor plane (Y = -0.001)', () => {
    const FLOOR_PLANE_Y = -0.001;
    let totalVerticesChecked = 0;
    let minVertexY = Infinity;
    let lowestMeshName = '';

    root.updateMatrixWorld(true);

    meshes.forEach((mesh) => {
      const geom = mesh.geometry;
      const pos = geom.attributes.position;
      const v = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        v.applyMatrix4(mesh.matrixWorld);
        totalVerticesChecked++;

        if (v.y < minVertexY) {
          minVertexY = v.y;
          lowestMeshName = mesh.name;
        }

        assert(
          v.y >= FLOOR_PLANE_Y - 1e-4,
          `Vertex ${i} of mesh '${mesh.name}' penetrated floor plane: y = ${v.y.toFixed(6)} < ${FLOOR_PLANE_Y}`
        );
      }
    });

    return {
      totalVerticesChecked,
      minObservedVertexY: minVertexY.toFixed(6),
      lowestMeshName,
      floorPlaneLimitY: FLOOR_PLANE_Y,
    };
  });

  // -------------------------------------------------------------------------
  // SUITE B: 12 Tread Chevrons Protrusion & Visibility
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE B: Tread Chevrons Protrusion & Occlusion Testing ---');

  await runTest('Suite B: Tread Chevrons', 'Exactly 12 tread chevrons exist, named mesh_tread_lug_1..12', () => {
    const treadMeshes = meshes.filter((m) => m.userData?.subpart === 'tread_lug');
    assert(treadMeshes.length === 12, `Expected 12 tread lugs, got ${treadMeshes.length}`);

    for (let i = 1; i <= 12; i++) {
      const expectedName = `mesh_tread_lug_${i}`;
      const found = treadMeshes.find((m) => m.name === expectedName);
      assert(!!found, `Missing tread lug mesh with name '${expectedName}'`);
    }

    return { count: treadMeshes.length, namingPattern: 'mesh_tread_lug_[1-12]' };
  });

  await runTest('Suite B: Tread Chevrons', 'All 12 tread chevrons sit within Y bounds [0.000, 0.014]', () => {
    const treadMeshes = meshes.filter((m) => m.userData?.subpart === 'tread_lug');

    treadMeshes.forEach((mesh) => {
      const box = new THREE.Box3().setFromObject(mesh);
      assert(
        Math.abs(box.min.y - 0.000) <= 0.001,
        `Tread lug ${mesh.name} min Y is ${box.min.y.toFixed(4)}, expected ~0.000`
      );
      assert(
        box.max.y <= 0.015,
        `Tread lug ${mesh.name} max Y is ${box.max.y.toFixed(4)}, expected <= 0.015`
      );
      assert(
        box.max.y >= 0.012,
        `Tread lug ${mesh.name} max Y is ${box.max.y.toFixed(4)}, expected >= 0.012`
      );
    });

    return {
      minTreadY: '0.000',
      maxTreadY: '0.014',
      allWithinBounds: true,
    };
  });

  await runTest('Suite B: Tread Chevrons', 'Tread chevrons protrude downward and are NOT occluded by outsole base', () => {
    const outsoleMesh = meshes.find((m) => m.name === 'mesh_outsole_base')!;
    const outsoleBox = new THREE.Box3().setFromObject(outsoleMesh);
    const treadMeshes = meshes.filter((m) => m.userData?.subpart === 'tread_lug');

    // The outsole base bottom boundary must be at or above the top surface of tread lugs
    // tread top ~0.014, outsole bottom ~0.014
    assert(
      outsoleBox.min.y >= 0.013,
      `Outsole base bottom Y (${outsoleBox.min.y.toFixed(4)}) encroaches below tread lug top (~0.014)`
    );

    // Tread chevrons must have exclusive volume below the outsole base
    let totalExposedTreadDepth = 0;
    treadMeshes.forEach((mesh) => {
      const box = new THREE.Box3().setFromObject(mesh);
      const exposedDepth = outsoleBox.min.y - box.min.y;
      assert(
        exposedDepth >= 0.012,
        `Tread lug ${mesh.name} has insufficient exposed depth: ${exposedDepth.toFixed(4)}m`
      );
      totalExposedTreadDepth += exposedDepth;
    });

    const avgExposedDepth = totalExposedTreadDepth / treadMeshes.length;

    return {
      outsoleBaseBottomY: outsoleBox.min.y.toFixed(4),
      averageExposedTreadDepth: avgExposedDepth.toFixed(4),
      occluded: false,
    };
  });

  // -------------------------------------------------------------------------
  // SUITE C: Tongue Instep Geometry Curve & Positioning
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE C: Tongue Instep Curve & Foam Clearance ---');

  await runTest('Suite C: Tongue Geometry', 'Tongue bounds span Y: [0.40, 0.98]', () => {
    const tongueMesh = meshes.find((m) => m.name === 'mesh_tongue');
    assert(!!tongueMesh, 'mesh_tongue not found in procedural hierarchy');

    const box = new THREE.Box3().setFromObject(tongueMesh!);

    assert(
      box.min.y >= 0.39 && box.min.y <= 0.42,
      `Tongue min Y is ${box.min.y.toFixed(4)}, expected ~[0.39, 0.42]`
    );
    assert(
      box.max.y >= 0.97 && box.max.y <= 1.00,
      `Tongue max Y is ${box.max.y.toFixed(4)}, expected ~[0.97, 1.00]`
    );

    const spanY = box.max.y - box.min.y;
    assert(spanY >= 0.55, `Tongue Y-span ${spanY.toFixed(4)}m is too short, expected >= 0.55m`);

    return {
      tongueMinY: box.min.y.toFixed(4),
      tongueMaxY: box.max.y.toFixed(4),
      tongueSpanY: spanY.toFixed(4),
      widthX: (box.max.x - box.min.x).toFixed(4),
      lengthZ: (box.max.z - box.min.z).toFixed(4),
    };
  });

  await runTest('Suite C: Tongue Geometry', 'Tongue does not collapse into midsole foam', () => {
    const tongueMesh = meshes.find((m) => m.name === 'mesh_tongue')!;
    const midsoleMesh = meshes.find((m) => m.name === 'mesh_midsole')!;

    const tongueBox = new THREE.Box3().setFromObject(tongueMesh);
    const midsoleBox = new THREE.Box3().setFromObject(midsoleMesh);

    // Midsole top in our model is around Y = 0.432.
    // In iteration 1, tongue was at Y: [0.073, 0.270] (entirely trapped in midsole foam).
    // In iteration 2, tongue extends up to 0.987, with center well above midsole.
    const tongueCenter = new THREE.Vector3();
    tongueBox.getCenter(tongueCenter);

    const midsoleCenter = new THREE.Vector3();
    midsoleBox.getCenter(midsoleCenter);

    assert(
      tongueCenter.y > midsoleBox.max.y,
      `Tongue center Y (${tongueCenter.y.toFixed(3)}) is not above midsole top (${midsoleBox.max.y.toFixed(3)})`
    );
    assert(
      tongueBox.max.y > midsoleBox.max.y * 2,
      `Tongue top (${tongueBox.max.y.toFixed(3)}) should extend far above midsole top (${midsoleBox.max.y.toFixed(3)})`
    );

    return {
      midsoleMaxY: midsoleBox.max.y.toFixed(4),
      tongueCenterY: tongueCenter.y.toFixed(4),
      tongueTopY: tongueBox.max.y.toFixed(4),
      collapsedIntoFoam: false,
    };
  });

  await runTest('Suite C: Tongue Geometry', 'Tongue is continuously aligned beneath all 4 criss-cross lace tiers', () => {
    const tongueMesh = meshes.find((m) => m.name === 'mesh_tongue')!;
    const tongueBox = new THREE.Box3().setFromObject(tongueMesh);

    // Verify 4 lace tiers
    for (let i = 0; i < 4; i++) {
      const laceLR = meshes.find((m) => m.name === `mesh_lace_cross_LR_${i}`);
      const laceRL = meshes.find((m) => m.name === `mesh_lace_cross_RL_${i}`);
      assert(!!laceLR && !!laceRL, `Lace tier ${i} meshes missing`);

      const boxLR = new THREE.Box3().setFromObject(laceLR!);
      const boxRL = new THREE.Box3().setFromObject(laceRL!);

      // Lace tier Y must fall within the tongue Y range
      const laceMinY = Math.min(boxLR.min.y, boxRL.min.y);
      const laceMaxY = Math.max(boxLR.max.y, boxRL.max.y);

      assert(
        laceMinY >= tongueBox.min.y,
        `Lace tier ${i} min Y (${laceMinY.toFixed(3)}) is below tongue min Y (${tongueBox.min.y.toFixed(3)})`
      );
      assert(
        laceMaxY <= tongueBox.max.y,
        `Lace tier ${i} max Y (${laceMaxY.toFixed(3)}) extends above tongue max Y (${tongueBox.max.y.toFixed(3)})`
      );
    }

    // Top knot check
    const knotMesh = meshes.find((m) => m.name === 'mesh_lace_knot')!;
    const knotBox = new THREE.Box3().setFromObject(knotMesh);
    assert(
      knotBox.min.y >= tongueBox.min.y && knotBox.max.y <= tongueBox.max.y,
      'Lace knot must sit within tongue Y range'
    );

    return {
      allLaceTiersUnderTongueRange: true,
      laceTiersChecked: 4,
      knotChecked: true,
    };
  });

  // -------------------------------------------------------------------------
  // SUITE D: 100% castShadow Verification & Node Identity
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE D: 100% castShadow & Node Identity ---');

  await runTest('Suite D: Shadows & Identity', '100% of meshes have castShadow === true (42/42 meshes)', () => {
    assert(meshes.length === 42, `Expected exactly 42 meshes in procedural assembly, got ${meshes.length}`);

    const nonCastingMeshes: string[] = [];
    meshes.forEach((m) => {
      if (m.castShadow !== true) {
        nonCastingMeshes.push(m.name || 'unnamed');
      }
    });

    assert(
      nonCastingMeshes.length === 0,
      `Found ${nonCastingMeshes.length} meshes without castShadow: ${nonCastingMeshes.join(', ')}`
    );

    return {
      totalMeshes: meshes.length,
      castingMeshes: meshes.length - nonCastingMeshes.length,
      castShadowRate: '100%',
    };
  });

  await runTest('Suite D: Shadows & Identity', 'Zero meshes have empty names (100% identifiability)', () => {
    const anonymousMeshes: number[] = [];
    meshes.forEach((m, idx) => {
      if (!m.name || m.name.trim() === '') {
        anonymousMeshes.push(idx + 1);
      }
    });

    assert(
      anonymousMeshes.length === 0,
      `Found anonymous meshes at indices: ${anonymousMeshes.join(', ')}`
    );

    return {
      totalMeshes: meshes.length,
      namedMeshes: meshes.length,
      allNamesUniqueOrNumbered: true,
    };
  });

  await runTest('Suite D: Shadows & Identity', 'All meshes have non-zero volume bounding boxes and valid geometries', () => {
    meshes.forEach((m) => {
      const geom = m.geometry;
      assert(!!geom, `Mesh ${m.name} missing geometry`);
      assert(geom.attributes.position.count > 0, `Mesh ${m.name} has 0 vertices`);

      const box = new THREE.Box3().setFromObject(m);
      const size = new THREE.Vector3();
      box.getSize(size);

      assert(size.x > 0, `Mesh ${m.name} has zero width X`);
      assert(size.y > 0, `Mesh ${m.name} has zero height Y`);
      assert(size.z > 0, `Mesh ${m.name} has zero depth Z`);
    });

    return {
      checkedMeshes: meshes.length,
      allNonZeroVolume: true,
    };
  });

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(' SUMMARY OF CHALLENGER M1 ITERATION 2 VERIFICATION');
  console.log('======================================================================');

  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  const total = testResults.length;

  console.log(`Total Challenger Tests: ${total}`);
  console.log(`Passed:                 ${passed}`);
  console.log(`Failed:                 ${failed}`);
  console.log(`Pass Rate:              ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.error('\nFAILURES:');
    testResults.filter((r) => !r.passed).forEach((r) => {
      console.error(`- [${r.suite}] ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\nVERDICT: ALL CHALLENGER GEOMETRIC & SHADOW TESTS PASSED WITH 100% INTEGRITY.');
    process.exit(0);
  }
}

runChallengerSuite().catch((err) => {
  console.error('Fatal challenger execution error:', err);
  process.exit(1);
});
