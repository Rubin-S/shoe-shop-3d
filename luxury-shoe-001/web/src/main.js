import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- Global State ---
let scene, camera, renderer, controls;
let shoeGroup, shoeComponents = {};
let isExploded = false;
let audioCtx = null;
let soundEnabled = true;

// Camera Presets
const CAMERA_PRESETS = {
  three_quarter: { pos: [-0.45, 0.24, 0.42], target: [0, 0.04, 0] },
  lateral: { pos: [-0.58, 0.048, 0.015], target: [0, 0.04, 0] },
  front: { pos: [0.002, 0.065, 0.54], target: [0, 0.04, 0.08] },
  fiddleback: { pos: [0.00, -0.48, 0.01], target: [0, 0.02, 0] },
  heel: { pos: [-0.24, 0.08, -0.38], target: [0, 0.05, -0.10] }
};

// --- Web Audio Synthesized SFX ---
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
    }
  } catch (e) {
    // Audio context may be restricted before user interaction
  }
}

// --- Scene Initialization ---
function init() {
  const container = document.getElementById('webgl-container');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0c);
  scene.fog = new THREE.FogExp2(0x0a0a0c, 1.0);

  // Camera
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.set(-0.45, 0.24, 0.42);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 1.8;
  controls.minDistance = 0.15;
  controls.target.set(0, 0.04, 0);

  // Lighting Rig (Matching Master Cycles Photography Rig)
  setupLights();

  // Contact Shadow Floor
  setupFloor();

  // Load Model
  loadShoeModel();

  // Setup UI Listeners
  setupUI();

  // Window Resize
  window.addEventListener('resize', onWindowResize);

  // Animation Loop
  animate();
}

function setupLights() {
  // Key Softbox (Warm 5200K)
  const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.8);
  keyLight.position.set(-0.42, 0.60, 0.38);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 2.0;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  // Fill Softbox (Cool 6000K)
  const fillLight = new THREE.DirectionalLight(0xe5f0ff, 1.2);
  fillLight.position.set(0.45, 0.35, -0.15);
  scene.add(fillLight);

  // Rim / Specular Kick Strip Light
  const rimLight = new THREE.DirectionalLight(0xfffaed, 2.2);
  rimLight.position.set(0.20, 0.45, -0.50);
  scene.add(rimLight);

  // Ambient Under-Bounce Light
  const ambient = new THREE.AmbientLight(0x282830, 0.9);
  scene.add(ambient);
}

function setupFloor() {
  const floorGeo = new THREE.PlaneGeometry(6, 6);
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.45 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.0005;
  floor.receiveShadow = true;
  scene.add(floor);
}

// --- GLB Model Loading ---
function loadShoeModel() {
  const loader = new GLTFLoader();
  const modelPath = './assets/shoe001_aurelius.glb';

  loader.load(
    modelPath,
    (gltf) => {
      shoeGroup = gltf.scene;
      shoeGroup.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          shoeComponents[child.name] = child;

          // Clone materials so runtime mutations don't alter original instances
          if (Array.isArray(child.material)) {
            child.material = child.material.map(m => m.clone());
          } else if (child.material) {
            child.material = child.material.clone();
          }
        }
      });
      scene.add(shoeGroup);
      hideLoader();
    },
    undefined,
    (error) => {
      console.error("Error loading GLB asset:", error);
      hideLoader();
    }
  );
}

function hideLoader() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// --- Interactive Customizer Handlers ---
function setupUI() {
  // 1. Upper Leather
  setupSwatchGroup('swatches-upper', 'label-upper-color', (colorHex) => {
    playSound('click');
    setUpperVampColor(colorHex);
  });

  // 2. Toe Cap
  setupSwatchGroup('swatches-toe', 'label-toe-color', (colorHex) => {
    playSound('click');
    setToeCapColor(colorHex);
  });

  // 3. Laces
  setupSwatchGroup('swatches-laces', 'label-lace-color', (colorHex) => {
    playSound('click');
    setLacesColor(colorHex);
  });

  // 4. Sole & Fiddleback
  setupSwatchGroup('swatches-sole', 'label-sole-color', (colorHex) => {
    playSound('click');
    setSoleColor(colorHex);
  });

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

  // Explode Deconstruct Button
  const btnExplode = document.getElementById('btn-explode');
  if (btnExplode) {
    btnExplode.addEventListener('click', () => {
      playSound('click');
      isExploded = !isExploded;
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

function setUpperVampColor(hexColor) {
  const col = new THREE.Color(hexColor);
  const upper = shoeComponents['Upper_Master'];
  if (upper) {
    if (Array.isArray(upper.material) && upper.material[0]) {
      upper.material[0].color.copy(col);
    } else if (upper.material) {
      upper.material.color.copy(col);
    }
  }
}

function setToeCapColor(hexColor) {
  const col = new THREE.Color(hexColor);
  const upper = shoeComponents['Upper_Master'];
  if (upper) {
    if (Array.isArray(upper.material) && upper.material[1]) {
      upper.material[1].color.copy(col);
    } else if (upper.material) {
      upper.material.color.copy(col);
    }
  }
}

function setLacesColor(hexColor) {
  const col = new THREE.Color(hexColor);
  const laces = shoeComponents['Lacing_WaxedCotton'];
  if (laces && laces.material) {
    laces.material.color.copy(col);
  }
}

function setSoleColor(hexColor) {
  const col = new THREE.Color(hexColor);
  const sole = shoeComponents['Construction_Sole_Unit'];
  if (sole && sole.material) {
    sole.material.color.copy(col);
  }
  const heel = shoeComponents['Construction_HeelStack'];
  if (heel && heel.material) {
    heel.material.color.copy(col.clone().multiplyScalar(0.7)); // Stacked leather is slightly darker
  }
}

// --- Camera & Explode Animations ---
let targetCamPos = null;
let targetLookAt = null;

function tweenCamera(pos, target) {
  targetCamPos = new THREE.Vector3(...pos);
  targetLookAt = new THREE.Vector3(...target);
}

function animateExplosion(exploded) {
  if (!shoeGroup) return;
  const offsets = {
    Upper_Master: exploded ? 0.08 : 0,
    Lacing_WaxedCotton: exploded ? 0.14 : 0,
    Upper_Stitching_TwinSeam: exploded ? 0.08 : 0,
    Construction_Sole_Unit: exploded ? -0.04 : 0,
    Construction_HeelStack: exploded ? -0.08 : 0
  };

  // Also include eyelets and aglets in the upper displacement
  Object.keys(shoeComponents).forEach((name) => {
    let dy = 0;
    if (name.includes('Eyelet') || name.includes('Aglet')) {
      dy = exploded ? 0.11 : 0;
    } else if (name.includes('Heel_Brass_Nail')) {
      dy = exploded ? -0.08 : 0;
    } else if (offsets[name] !== undefined) {
      dy = offsets[name];
    }
    
    const comp = shoeComponents[name];
    if (comp) {
      if (comp.userData.originalY === undefined) comp.userData.originalY = comp.position.y;
      comp.userData.targetY = comp.userData.originalY + dy;
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // Smooth camera glide
  if (targetCamPos) {
    camera.position.lerp(targetCamPos, 0.06);
    controls.target.lerp(targetLookAt, 0.06);
    if (camera.position.distanceTo(targetCamPos) < 0.005) {
      targetCamPos = null;
      targetLookAt = null;
    }
  }

  // Smooth exploded view lerping
  Object.values(shoeComponents).forEach((comp) => {
    if (comp && comp.userData.targetY !== undefined) {
      comp.position.y = THREE.MathUtils.lerp(comp.position.y, comp.userData.targetY, 0.1);
    }
  });

  // Subtle floating levitation if not exploded
  if (shoeGroup && !isExploded) {
    const t = performance.now() * 0.001;
    shoeGroup.position.y = Math.sin(t * 1.5) * 0.0025;
  }

  controls.update();
  renderer.render(scene, camera);
}

init();
