import * as THREE from 'three';
import { ProceduralSneakerGenerator } from '../src/components/3d/ProceduralSneaker';

const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
const root = assembly.root;

console.log('=== MESH BREAKDOWN ===');
let meshIdx = 0;
root.traverse((obj) => {
  if ((obj as THREE.Mesh).isMesh) {
    meshIdx++;
    const mesh = obj as THREE.Mesh;
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    console.log(
      `#${meshIdx.toString().padStart(2, ' ')} ${mesh.name.padEnd(28, ' ')} | ` +
      `seg: ${(mesh.userData?.segment || 'NONE').padEnd(7, ' ')} | ` +
      `castShadow: ${String(mesh.castShadow).padEnd(5, ' ')} | ` +
      `Y: [${box.min.y.toFixed(3)}, ${box.max.y.toFixed(3)}] | ` +
      `size: (${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}) | ` +
      `verts: ${mesh.geometry.attributes.position.count}`
    );
  }
});

const totalBox = new THREE.Box3().setFromObject(root);
const totalSize = new THREE.Vector3();
totalBox.getSize(totalSize);
console.log('\n=== COMPOSITE ASSEMBLY BOUNDS ===');
console.log(`Min: [${totalBox.min.x.toFixed(3)}, ${totalBox.min.y.toFixed(3)}, ${totalBox.min.z.toFixed(3)}]`);
console.log(`Max: [${totalBox.max.x.toFixed(3)}, ${totalBox.max.y.toFixed(3)}, ${totalBox.max.z.toFixed(3)}]`);
console.log(`Size: (${totalSize.x.toFixed(3)}, ${totalSize.y.toFixed(3)}, ${totalSize.z.toFixed(3)})`);
