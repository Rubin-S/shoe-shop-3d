import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- Anatomical Metadata for All 20 Components ---
const ANATOMICAL_PIECES = [
  { id: 1, key: 'Piece_01_Heel_Nails', name: 'Heel Nails', category: 'Foundation', material: 'Antique Brass (9 Pins)', file: 'Piece_01_Heel_Nails.jpg', desc: 'Nine solid brass pins driven in a horseshoe retention pattern, mechanically locking the stacked leather heel to the insole seat.' },
  { id: 2, key: 'Piece_02_Heel_Lifts', name: 'Heel Lifts', category: 'Foundation', material: 'Stacked Leather & Rubber', file: 'Piece_02_Heel_Lifts.jpg', desc: 'Five stacked lifts: four layers of compressed 5mm oak-bark leather capped with a beveled dovetail rubber strike pad.' },
  { id: 3, key: 'Piece_03_Leather_Rand', name: 'Leather Rand', category: 'Foundation', material: 'Skived Rand Leather', file: 'Piece_03_Leather_Rand.jpg', desc: 'U-shaped skived leather strip wrapping the heel perimeter, creating a flush, watertight transition between upper and heel.' },
  { id: 4, key: 'Piece_04_Outsole', name: 'Oak-Bark Outsole', category: 'Foundation', material: 'Oak-Bark Tanned Leather', file: 'Piece_04_Outsole.jpg', desc: 'Continuous outsole featuring a hand-sculpted fiddleback waist spine and beveled edge, tanned using traditional oak bark.' },
  { id: 5, key: 'Piece_05_Footbed_Filler', name: 'Cork Footbed Filler', category: 'Foundation', material: 'Granulated Natural Cork', file: 'Piece_05_Footbed_Filler.jpg', desc: 'Granulated Portuguese cork paste filling the cavity inside the welt rib, molding to the plantar shape of the wearer.' },
  { id: 6, key: 'Piece_06_Shank', name: 'Steel Arch Shank', category: 'Arch Core', material: 'Tempered Spring Steel', file: 'Piece_06_Shank.jpg', desc: 'Cambered high-carbon spring steel arch reinforcement beam anchored with twin brass rivets, preventing arch fatigue.' },
  { id: 7, key: 'Piece_07_Goodyear_Welt', name: 'Goodyear Welt Strip', category: 'Construction', material: '270° Channeled Leather', file: 'Piece_07_Goodyear_Welt.jpg', desc: '270° perimeter welt strip with an angled bevel, stitched directly to the insole rib and lock-stitched to the outsole.' },
  { id: 8, key: 'Piece_08_Insole', name: 'Vegetable-Tanned Insole', category: 'Foundation', material: '5.5mm Veg-Tan Shoulder', file: 'Piece_08_Insole.jpg', desc: 'Anatomical vegetable-tanned shoulder foundation with a carved gemming channel, serving as the master structural backbone.' },
  { id: 9, key: 'Piece_09_Toe_Puff', name: 'Toe Puff Stiffener', category: 'Internal', material: 'Thermoformed Fiber Stiffener', file: 'Piece_09_Toe_Puff.jpg', desc: 'Internal thermoformed dome stiffener skived ultra-thin at edges, preserving the sharp chisel toe profile under wear.' },
  { id: 10, key: 'Piece_10_Heel_Counter', name: 'Heel Counter', category: 'Internal', material: 'Molded Calcaneus Stiffener', file: 'Piece_10_Heel_Counter.jpg', desc: 'Molded calcaneus cup stiffener cradling the heel bone, preventing lateral slippage and stabilizing each stride.' },
  { id: 11, key: 'Piece_11_Lining', name: 'Glove Calfskin Lining', category: 'Internal', material: 'Drum-Dyed Parchment Calfskin', file: 'Piece_11_Lining.jpg', desc: 'Full glove-soft drum-dyed calfskin lining offering a frictionless, moisture-wicking climate interior for the foot.' },
  { id: 12, key: 'Piece_12_Quarters', name: 'Quarters', category: 'Upper', material: 'French Box Calf Leather', file: 'Piece_12_Quarters.jpg', desc: 'Medial and lateral upper leather panels extending from the heel curve to meet beneath the vamp at the throat.' },
  { id: 13, key: 'Piece_13_Heel_Back_Strip', name: 'Heel Back Strip', category: 'Upper', material: 'French Box Calf Leather', file: 'Piece_13_Heel_Back_Strip.jpg', desc: 'Vertical reinforcing leather strip skived and stitched down the rear Achilles seam to resist tensile stepping stresses.' },
  { id: 14, key: 'Piece_14_Rolled_Collar_Binding', name: 'Rolled Collar Binding', category: 'Upper', material: 'Rolled Leather Piping', file: 'Piece_14_Rolled_Collar_Binding.jpg', desc: 'Continuous French rolled calfskin piping bead framing the opening collar of the shoe, preventing chafing.' },
  { id: 15, key: 'Piece_15_Vamp', name: 'Vamp', category: 'Upper', material: 'French Box Calf Leather', file: 'Piece_15_Vamp.jpg', desc: 'Main instep leather panel spanning the metatarsal bridge, sculpted to conform to the dorsal profile of the foot.' },
  { id: 16, key: 'Piece_16_Facings', name: 'Closed Facings & Eyelets', category: 'Closure', material: 'Box Calf + 10 Brass Eyelets', file: 'Piece_16_Facings.jpg', desc: 'Closed Oxford lace stays with 5 pairs of punched eyelets reinforced with antique brass eyelet grommets.' },
  { id: 17, key: 'Piece_17_Padded_Tongue', name: 'Padded Throat Tongue', category: 'Closure', material: 'Calfskin + 2mm Foam Core', file: 'Piece_17_Padded_Tongue.jpg', desc: 'Ergonomic throat tongue with 2mm internal foam padding, protecting the dorsal nerve against lace bite.' },
  { id: 18, key: 'Piece_18_Toe_Cap', name: 'Chisel Toe Cap', category: 'Upper', material: 'Mirror Obsidian Glazed Calf', file: 'Piece_18_Toe_Cap.jpg', desc: 'Hand-burnished soft-chisel cap toe panel featuring a mirror obsidian glaze (glacage) over an espresso base.' },
  { id: 19, key: 'Piece_19_Waxed_Laces', name: 'Waxed Laces & Aglets', category: 'Closure', material: 'Braided Cotton + Brass Aglets', file: 'Piece_19_Waxed_Laces.jpg', desc: 'Beeswax-treated braided Egyptian cotton laces in bespoke straight-bar pattern, terminated with solid brass aglets.' },
  { id: 20, key: 'Piece_20_Micro_Stitching', name: 'Twin Micro-Stitching', category: 'Detail', material: '11 SPI Waxed Linen Thread', file: 'Piece_20_Micro_Stitching.jpg', desc: '11 stitches-per-inch (SPI) twin parallel seams sewn with high-tensile waxed linen thread along the toe cap line.' }
];

// --- Calibrated 3D Exploded Offsets for All 20 Individual Pieces ---
const EXPLODED_OFFSETS = {
  // Topmost Closure & Detailing
  'Piece_19_Waxed_Laces':          { dy: 0.220, dz:  0.020, dx:  0.000 },
  'Piece_16_Facings':              { dy: 0.170, dz:  0.010, dx:  0.000 },
  'Piece_17_Padded_Tongue':        { dy: 0.135, dz: -0.015, dx:  0.000 },
  'Piece_20_Micro_Stitching':      { dy: 0.125, dz:  0.050, dx:  0.000 },
  'Piece_18_Toe_Cap':              { dy: 0.100, dz:  0.070, dx:  0.000 },
  'Piece_14_Rolled_Collar_Binding':{ dy: 0.105, dz: -0.020, dx:  0.000 },
  'Piece_15_Vamp':                 { dy: 0.085, dz:  0.015, dx:  0.000 },
  'Piece_13_Heel_Back_Strip':      { dy: 0.075, dz: -0.065, dx:  0.000 },
  'Piece_12_Quarters':             { dy: 0.065, dz: -0.020, dx:  0.000 },

  // Internal Structural Layers
  'Piece_09_Toe_Puff':             { dy: 0.045, dz:  0.085, dx:  0.000 }, // Steps out forward to reveal shape
  'Piece_11_Lining':               { dy: 0.035, dz:  0.000, dx:  0.000 },
  'Piece_10_Heel_Counter':         { dy: 0.035, dz: -0.075, dx:  0.000 }, // Steps out rearward to reveal cup
  'Piece_08_Insole':               { dy: 0.000, dz:  0.000, dx:  0.000 }, // Datum backbone

  // Foundation & Sole Units
  'Piece_06_Shank':                { dy: -0.025, dz:  0.000, dx:  0.000 },
  'Piece_05_Footbed_Filler':       { dy: -0.045, dz:  0.000, dx:  0.000 },
  'Piece_07_Goodyear_Welt':        { dy: -0.068, dz:  0.000, dx:  0.000 },
  'Piece_04_Outsole':              { dy: -0.098, dz:  0.000, dx:  0.000 },
  'Piece_03_Leather_Rand':         { dy: -0.128, dz: -0.020, dx:  0.000 },
  'Piece_02_Heel_Lifts':           { dy: -0.160, dz: -0.020, dx:  0.000 },
  'Piece_01_Heel_Nails':           { dy: -0.198, dz: -0.020, dx:  0.000 }
};

// --- Camera Presets ---
const CAMERA_PRESETS = {
  three_quarter: { pos: [-0.48, 0.24, 0.44], target: [0, 0.04, 0] },
  lateral:       { pos: [-0.60, 0.048, 0.015], target: [0, 0.04, 0] },
  front:         { pos: [0.002, 0.065, 0.56], target: [0, 0.04, 0.08] },
  fiddleback:    { pos: [0.00, -0.52, 0.01], target: [0, 0.02, 0] },
  heel:          { pos: [-0.26, 0.08, -0.40], target: [0, 0.05, -0.10] },
  exploded:      { pos: [-0.58, 0.28, 0.50], target: [0, 0.02, 0] }
};

// --- Global State ---
let scene, camera, renderer, controls;
let shoeGroup;
let shoeComponents = {};
let isExploded = false;
let selectedPieceKey = null;
let raycaster, mouse;
let audioCtx = null;
let soundEnabled = true;
let targetCamPos = null;
let targetLookAt = null;

// --- Web Audio SFX ---
function playSound(type = 'click') {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const t = audioCtx.currentTime;
    if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.05);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'glide') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.15);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === 'split') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 0.25);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  } catch (e) {}
}

// --- Initialization ---
function init() {
  const container = document.getElementById('webgl-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0c);
  scene.fog = new THREE.FogExp2(0x0a0a0c, 0.85);

  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.set(-0.48, 0.24, 0.44);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.20;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 2.2;
  controls.minDistance = 0.10;
  controls.target.set(0, 0.04, 0);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  setupLights();
  setupFloor();
  loadShoeModel();
  setupUI();
  buildAnatomyUI();

  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  animate();
}

function setupLights() {
  const keyLight = new THREE.DirectionalLight(0xfff4e6, 3.0);
  keyLight.position.set(-0.42, 0.65, 0.40);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 2.0;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe5f0ff, 1.3);
  fillLight.position.set(0.48, 0.38, -0.18);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xfffaed, 2.4);
  rimLight.position.set(0.22, 0.48, -0.52);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0x2c2c34, 0.95);
  scene.add(ambient);
}

function setupFloor() {
  const floorGeo = new THREE.PlaneGeometry(8, 8);
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.50 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.0005;
  floor.receiveShadow = true;
  scene.add(floor);
}

// --- Load GLB with All 20 Individual Pieces ---
function loadShoeModel() {
  const loader = new GLTFLoader();
  const modelPath = './assets/shoe001_aurelius.glb';

  loader.load(
    modelPath,
    (gltf) => {
      shoeGroup = gltf.scene;
      shoeComponents = {};

      shoeGroup.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          shoeComponents[child.name] = child;

          // Record original local transforms
          child.userData.originalX = child.position.x;
          child.userData.originalY = child.position.y;
          child.userData.originalZ = child.position.z;
          child.userData.targetX = child.position.x;
          child.userData.targetY = child.position.y;
          child.userData.targetZ = child.position.z;

          // Clone materials so runtime mutations don't alter original instances
          if (Array.isArray(child.material)) {
            child.material = child.material.map(m => m.clone());
          } else if (child.material) {
            child.material = child.material.clone();
          }
        }
      });

      console.log(`Loaded ${Object.keys(shoeComponents).length} individual anatomical shoe components:`, Object.keys(shoeComponents));
      scene.add(shoeGroup);
      hideLoader();
    },
    undefined,
    (error) => {
      console.error("Error loading 20-piece GLB asset:", error);
      hideLoader();
    }
  );
}

function hideLoader() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// --- 20-Piece Exploded View Controller ---
function animateExplosion(exploded) {
  if (!shoeGroup) return;

  ANATOMICAL_PIECES.forEach((piece) => {
    const comp = shoeComponents[piece.key];
    if (comp) {
      const offset = EXPLODED_OFFSETS[piece.key] || { dy: 0, dz: 0, dx: 0 };
      if (exploded) {
        comp.userData.targetX = comp.userData.originalX + (offset.dx || 0);
        comp.userData.targetY = comp.userData.originalY + (offset.dy || 0);
        comp.userData.targetZ = comp.userData.originalZ + (offset.dz || 0);
      } else {
        comp.userData.targetX = comp.userData.originalX;
        comp.userData.targetY = comp.userData.originalY;
        comp.userData.targetZ = comp.userData.originalZ;
      }
    }
  });

  if (exploded) {
    tweenCamera(CAMERA_PRESETS.exploded.pos, CAMERA_PRESETS.exploded.target);
    showAnatomyDrawer(true);
  } else {
    tweenCamera(CAMERA_PRESETS.three_quarter.pos, CAMERA_PRESETS.three_quarter.target);
    showAnatomyDrawer(false);
    deselectPiece();
  }
}

// --- Dynamic Anatomy UI Drawer ---
function buildAnatomyUI() {
  const drawer = document.getElementById('anatomy-drawer');
  if (!drawer) return;

  const listEl = document.getElementById('anatomy-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  ANATOMICAL_PIECES.forEach((piece) => {
    const item = document.createElement('div');
    item.className = 'anatomy-item';
    item.dataset.key = piece.key;
    item.innerHTML = `
      <div class="anatomy-item-header">
        <span class="anatomy-badge">#${String(piece.id).padStart(2, '0')}</span>
        <span class="anatomy-name">${piece.name}</span>
        <span class="anatomy-cat">${piece.category}</span>
      </div>
      <div class="anatomy-item-meta">${piece.material}</div>
    `;

    item.addEventListener('click', () => {
      selectPiece(piece.key);
    });

    listEl.appendChild(item);
  });
}

function showAnatomyDrawer(show) {
  const drawer = document.getElementById('anatomy-drawer');
  if (drawer) {
    drawer.classList.toggle('open', show);
  }
  const specHud = document.querySelector('.spec-hud');
  if (specHud) {
    specHud.style.opacity = show ? '0' : '1';
    specHud.style.pointerEvents = show ? 'none' : 'auto';
  }
}

function selectPiece(pieceKey) {
  selectedPieceKey = pieceKey;
  playSound('glide');

  // Update list active state
  document.querySelectorAll('.anatomy-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.key === pieceKey);
    if (el.dataset.key === pieceKey) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  const piece = ANATOMICAL_PIECES.find(p => p.key === pieceKey);
  const comp = shoeComponents[pieceKey];

  // Update Inspector Card
  const card = document.getElementById('anatomy-inspector-card');
  if (card && piece) {
    card.classList.remove('hidden');

    let galleryHtml = '';
    let subViews = [];
    if (piece.id === 1) {
      subViews = [
        { label: '5-Nail Studio Scatter', file: 'nails/Piece_01_Heel_Nails_Studio_Reference.jpg' },
        { label: 'Standing Upright', file: 'nails/Nail_Piece_01_Standing_Upright.jpg' },
        { label: 'Profile Horizontal', file: 'nails/Nail_Piece_02_Profile_Horizontal.jpg' },
        { label: 'Domed Head Macro', file: 'nails/Nail_Piece_03_Macro_Head_Dome.jpg' },
        { label: 'Diamond Tip Macro', file: 'nails/Nail_Piece_04_Macro_Fluted_Shank_Tip.jpg' },
        { label: 'Underside Cross-Section', file: 'nails/Nail_Piece_05_Underside_CrossSection.jpg' },
        { label: 'Heel Assembly', file: 'Piece_01_Heel_Nails.jpg' }
      ];
    } else if (piece.id === 2) {
      subViews = [
        { label: 'Assembled Stack', file: 'heel_lifts/Heel_Lifts_Assembled_Master.jpg' },
        { label: 'Exploded Stack', file: 'heel_lifts/Heel_Lifts_Exploded_Stack.jpg' },
        { label: 'Dovetail Joint Macro', file: 'heel_lifts/Heel_Lifts_Dovetail_Joint_Macro.jpg' },
        { label: '6-Piece Blueprint', file: 'heel_lifts/Heel_Lifts_6_Pieces_Blueprint_Layout.jpg' },
        { label: 'Piece 1: Top Leather', file: 'heel_lifts/Heel_Lift_Piece_01_Top_Leather.jpg' },
        { label: 'Piece 2: Mid A Leather', file: 'heel_lifts/Heel_Lift_Piece_02_Mid_A_Leather.jpg' },
        { label: 'Piece 3: Mid B Leather', file: 'heel_lifts/Heel_Lift_Piece_03_Mid_B_Leather.jpg' },
        { label: 'Piece 4: Mid C Leather', file: 'heel_lifts/Heel_Lift_Piece_04_Mid_C_Leather.jpg' },
        { label: 'Piece 5: Leather Dovetail', file: 'heel_lifts/Heel_Lift_Piece_05_Bottom_Leather_Dovetail.jpg' },
        { label: 'Piece 6: Rubber Strike', file: 'heel_lifts/Heel_Lift_Piece_06_Rubber_Strike_Dovetail.jpg' }
      ];
    } else if (piece.id === 3) {
      subViews = [
        { label: 'Hero Studio Reference', file: 'leather_rand/Leather_Rand_Piece_03_Hero_Reference.jpg' },
        { label: 'Cut Breast Macro', file: 'leather_rand/Leather_Rand_Piece_03_Macro_CrossSection.jpg' },
        { label: 'Outer Curvature & Sheen', file: 'leather_rand/Leather_Rand_Piece_03_Rear_Curvature_Macro.jpg' },
        { label: 'Top Blueprint Plan', file: 'leather_rand/Leather_Rand_Piece_03_Top_Blueprint.jpg' },
        { label: 'Heel Assembly Context', file: 'leather_rand/Leather_Rand_Piece_03_Heel_Assembly_Context.jpg' },
        { label: 'Master Catalog Profile', file: 'Piece_03_Leather_Rand.jpg' }
      ];
    } else if (piece.id === 4) {
      subViews = [
        { label: 'Bottom View (Ground)', file: 'outsole/Outsole_Piece_04_Bottom_View.jpg' },
        { label: 'Top View (Insole Bed)', file: 'outsole/Outsole_Piece_04_Top_View.jpg' },
        { label: 'Left Lateral Profile', file: 'outsole/Outsole_Piece_04_Left_Lateral_View.jpg' },
        { label: 'Right Medial Profile', file: 'outsole/Outsole_Piece_04_Right_Medial_View.jpg' },
        { label: 'Front Toe Chisel View', file: 'outsole/Outsole_Piece_04_Front_Toe_View.jpg' },
        { label: 'Back Heel Seat View', file: 'outsole/Outsole_Piece_04_Back_Heel_View.jpg' },
        { label: 'Hero 3/4 Perspective', file: 'outsole/Outsole_Piece_04_Hero_ThreeQuarter.jpg' },
        { label: 'Fiddleback Spine Macro', file: 'outsole/Outsole_Piece_04_Macro_Fiddleback_Spine.jpg' },
        { label: 'Heel Assembly Context', file: 'outsole/Outsole_Piece_04_Heel_Assembly_Context.jpg' },
        { label: 'Master Catalog Profile', file: 'Piece_04_Outsole.jpg' }
      ];
    }

    if (subViews.length > 0) {
      galleryHtml = `
        <div class="inspector-gallery-title" style="font-size:0.62rem; color:var(--accent-gold); font-family:var(--font-mono); margin-top:4px;">MULTI-VIEW MACRO SUITE (${subViews.length} SHOTS):</div>
        <div class="inspector-gallery" style="display:flex; gap:6px; overflow-x:auto; padding:4px 0;">
          ${subViews.map((v, i) => `
            <img src="/pieces/${v.file}" title="${v.label}" class="inspector-thumb ${i===0?'active':''}" style="width:40px; height:40px; border-radius:4px; border:1px solid ${i===0?'#d4af37':'rgba(255,255,255,0.15)'}; cursor:pointer; object-fit:cover; flex-shrink:0;" data-src="/pieces/${v.file}" data-lbl="${v.label}" />
          `).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="inspector-badge">COMPONENT #${String(piece.id).padStart(2, '0')} // ${piece.category.toUpperCase()}</div>
      <div class="inspector-title">${piece.name}</div>
      <div class="inspector-img-container">
        <img id="main-inspector-img" src="/pieces/${piece.file}" alt="${piece.name}" class="inspector-img" onerror="this.style.display='none'" />
      </div>
      ${galleryHtml}
      <div class="inspector-meta-row">
        <span class="inspector-lbl">Material:</span>
        <span class="inspector-val">${piece.material}</span>
      </div>
      <div class="inspector-desc">${piece.desc}</div>
      <button class="btn-focus-piece" id="btn-focus-current">Focus Camera in 3D</button>
    `;

    // Add thumbnail click listeners for any piece with a sub-gallery
    if (subViews.length > 0) {
      card.querySelectorAll('.inspector-thumb').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetSrc = thumb.getAttribute('data-src');
          const mainImg = document.getElementById('main-inspector-img');
          if (mainImg) mainImg.src = targetSrc;
          card.querySelectorAll('.inspector-thumb').forEach(t => t.style.borderColor = 'rgba(255,255,255,0.15)');
          thumb.style.borderColor = '#d4af37';
        });
      });
    }

    const btnFocus = document.getElementById('btn-focus-current');
    if (btnFocus && comp) {
      btnFocus.addEventListener('click', () => {
        focusCameraOnObject(comp);
      });
    }
  }

  // Focus camera directly on the piece if it exists
  if (comp) {
    focusCameraOnObject(comp);
    highlightPieceMesh(comp);
  }
}

function deselectPiece() {
  selectedPieceKey = null;
  document.querySelectorAll('.anatomy-item').forEach(el => el.classList.remove('active'));
  const card = document.getElementById('anatomy-inspector-card');
  if (card) card.classList.add('hidden');
  resetHighlights();
}

function highlightPieceMesh(targetComp) {
  resetHighlights();
  if (!targetComp) return;

  targetComp.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if (!m.userData.origEmissive) {
          m.userData.origEmissive = m.emissive ? m.emissive.clone() : new THREE.Color(0,0,0);
        }
        if (m.emissive) {
          m.emissive.setHex(0x3a2c08); // Warm subtle highlight
        }
      });
    }
  });
}

function resetHighlights() {
  Object.values(shoeComponents).forEach((comp) => {
    if (comp) {
      comp.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            if (m.userData.origEmissive && m.emissive) {
              m.emissive.copy(m.userData.origEmissive);
            }
          });
        }
      });
    }
  });
}

function focusCameraOnObject(comp) {
  const box = new THREE.Box3().setFromObject(comp);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z, 0.05);
  const dist = maxDim * 2.8 + 0.18;
  const newPos = center.clone().add(new THREE.Vector3(-dist * 0.7, dist * 0.45, dist * 0.7));

  tweenCamera([newPos.x, newPos.y, newPos.z], [center.x, center.y, center.z]);
}

// --- 3D Viewport Raycasting Click Handler ---
function onPointerDown(event) {
  if (!isExploded || !shoeGroup) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(shoeGroup.children, true);

  if (intersects.length > 0) {
    let hit = intersects[0].object;
    while (hit.parent && hit.parent !== shoeGroup) {
      hit = hit.parent;
    }
    if (hit && shoeComponents[hit.name]) {
      selectPiece(hit.name);
    }
  }
}

// --- Camera & Tweening ---
function tweenCamera(pos, target) {
  targetCamPos = new THREE.Vector3(...pos);
  targetLookAt = new THREE.Vector3(...target);
}

// --- Material Customizer ---
function setupUI() {
  // 1. Upper Leather
  setupSwatchGroup('swatches-upper', 'label-upper-color', (colorHex) => {
    playSound('click');
    setUpperVampColor(colorHex);
  });

  // 2. Toe Cap Glaze
  setupSwatchGroup('swatches-toe', 'label-toe-color', (colorHex) => {
    playSound('click');
    setToeCapColor(colorHex);
  });

  // 3. Waxed Laces
  setupSwatchGroup('swatches-laces', 'label-lace-color', (colorHex) => {
    playSound('click');
    setLacesColor(colorHex);
  });

  // 4. Outsole
  setupSwatchGroup('swatches-sole', 'label-sole-color', (colorHex) => {
    playSound('click');
    setSoleColor(colorHex);
  });

  // Explode Deconstruct Button
  const btnExplode = document.getElementById('btn-explode');
  if (btnExplode) {
    btnExplode.addEventListener('click', () => {
      isExploded = !isExploded;
      playSound(isExploded ? 'split' : 'click');
      btnExplode.classList.toggle('active', isExploded);
      btnExplode.querySelector('span').textContent = isExploded ? 'Reassemble Shoe' : 'Anatomy Deconstruct';
      animateExplosion(isExploded);
    });
  }

  // Audio Toggle Button
  const btnAudio = document.getElementById('btn-audio');
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      btnAudio.classList.toggle('active', soundEnabled);
      btnAudio.querySelector('span').textContent = soundEnabled ? 'Audio SFX: ON' : 'Audio SFX: OFF';
      playSound('click');
    });
  }

  // Camera Shot Buttons
  document.querySelectorAll('.cam-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const shot = btn.dataset.shot;
      if (CAMERA_PRESETS[shot]) {
        playSound('glide');
        tweenCamera(CAMERA_PRESETS[shot].pos, CAMERA_PRESETS[shot].target);
      }
    });
  });
}

function setupSwatchGroup(containerId, labelId, onSelect) {
  const container = document.getElementById(containerId);
  const label = document.getElementById(labelId);
  if (!container) return;

  container.querySelectorAll('.swatch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (label) label.textContent = btn.dataset.name;
      onSelect(btn.dataset.color);
    });
  });
}

function applyColorToMesh(comp, colorHex, matIdx = 0) {
  if (!comp) return;
  const col = new THREE.Color(colorHex);
  if (Array.isArray(comp.material)) {
    if (comp.material[matIdx]) comp.material[matIdx].color.copy(col);
  } else if (comp.material) {
    comp.material.color.copy(col);
  }
}

function setUpperVampColor(hexColor) {
  applyColorToMesh(shoeComponents['Piece_15_Vamp'], hexColor);
  applyColorToMesh(shoeComponents['Piece_12_Quarters'], hexColor);
  applyColorToMesh(shoeComponents['Piece_16_Facings'], hexColor, 0);
  applyColorToMesh(shoeComponents['Piece_14_Rolled_Collar_Binding'], hexColor);
}

function setToeCapColor(hexColor) {
  applyColorToMesh(shoeComponents['Piece_18_Toe_Cap'], hexColor);
  applyColorToMesh(shoeComponents['Piece_13_Heel_Back_Strip'], hexColor);
}

function setLacesColor(hexColor) {
  applyColorToMesh(shoeComponents['Piece_19_Waxed_Laces'], hexColor, 0);
}

function setSoleColor(hexColor) {
  applyColorToMesh(shoeComponents['Piece_04_Outsole'], hexColor);
  applyColorToMesh(shoeComponents['Piece_03_Leather_Rand'], hexColor);
  applyColorToMesh(shoeComponents['Piece_02_Heel_Lifts'], hexColor, 0);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Render Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Smooth camera lerp
  if (targetCamPos) {
    camera.position.lerp(targetCamPos, 0.06);
    controls.target.lerp(targetLookAt, 0.06);
    if (camera.position.distanceTo(targetCamPos) < 0.003) {
      targetCamPos = null;
      targetLookAt = null;
    }
  }

  // Smooth piece deconstruction lerping in 3D
  Object.values(shoeComponents).forEach((comp) => {
    if (comp && comp.userData.targetY !== undefined) {
      comp.position.x = THREE.MathUtils.lerp(comp.position.x, comp.userData.targetX, 0.08);
      comp.position.y = THREE.MathUtils.lerp(comp.position.y, comp.userData.targetY, 0.08);
      comp.position.z = THREE.MathUtils.lerp(comp.position.z, comp.userData.targetZ, 0.08);
    }
  });

  // Gentle levitation when assembled
  if (shoeGroup && !isExploded) {
    const t = performance.now() * 0.001;
    shoeGroup.position.y = Math.sin(t * 1.5) * 0.0025;
  } else if (shoeGroup) {
    shoeGroup.position.y = 0;
  }

  controls.update();
  renderer.render(scene, camera);
}

init();
