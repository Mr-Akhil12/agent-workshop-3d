/**
 * The Agent's Workshop — Interactive 3D Portfolio v3
 * Proper car interior alignment, working entry, video player
 */
import { THREE } from './three-setup.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createEnvMap, makeFlakeBlackPaint, makeNeonMaterial } from './materials.js';

export function start() {
    'use strict';

    const $ = s => document.getElementById(s);
    const barEl = $('load-bar'), statusEl = $('load-status');
    let progress = 0;
    function setProgress(p, msg) {
        progress = Math.min(100, p);
        barEl.style.width = progress + '%';
        if (msg) statusEl.textContent = msg;
    }
    function hideLoad() {
        $('loading').classList.add('hidden');
        setTimeout(() => { $('hint').style.opacity = '0'; }, 8000);
    }

    // ── Renderer ──
    const W = innerWidth, H = innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    // ── Scene + Camera ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020206);

    const camera = new THREE.PerspectiveCamera(65, W / H, 0.05, 200);
    camera.position.set(5, 3.5, 6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 1);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minPolarAngle = Math.PI * 0.08;
    controls.enablePan = false;
    controls.update();

    // ════════════════════════════════════════════
    //  PLAYER STATE
    // ════════════════════════════════════════════
    // 'walking' | 'entering' | 'driving' | 'exiting'
    let playerState = 'walking';
    let fpYaw = 0, fpPitch = 0;
    let isPointerLocked = false;

    // Entry animation
    let entryAnim = { active: false, t: 0, duration: 1.0, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromLook: new THREE.Vector3(), toLook: new THREE.Vector3() };

    // Car model reference (set after GLB loads)
    let carModel = null;
    let carInterior = null;
    let steerGroup = null;
    let laptop = null;
    let laptopScreenCanvas = null;
    let laptopScreenTexture = null;
    const streamlitState = { sidebarOpen: true, activePage: 'dashboard' };

    // Driver seat local position (relative to carInterior group)
    // These will be adjusted after car model loads
    const DRIVER_SEAT_LOCAL = new THREE.Vector3(-0.5, 0.45, 0.1);
    const DRIVER_EYE_LOCAL = new THREE.Vector3(0, 0.55, 0); // offset from seat

    // ── Environment ──
    const envMap = createEnvMap(renderer);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.7, 0.4, 0.3);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    setProgress(10, 'Scene initialized');

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0x111118, 0.5));
    const keyLight = new THREE.DirectionalLight(0xffeedd, 0.6);
    keyLight.position.set(3, 8, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -8; keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8; keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);
    scene.add(new THREE.DirectionalLight(0x4466ff, 0.15).translateX(-4).translateY(3).translateZ(-2));

    // ── Ground ──
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x08080c, metalness: 0.85, roughness: 0.25 })
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const gridHelper = new THREE.GridHelper(40, 80, 0x111120, 0x0a0a14);
    gridHelper.position.y = 0.003; scene.add(gridHelper);
    setProgress(20, 'Ground ready');

    // ── Workshop walls ──
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c0c14, metalness: 0.15, roughness: 0.85 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, 0.2), wallMat);
    backWall.position.set(0, 1.75, -4); backWall.castShadow = true; backWall.receiveShadow = true; scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 5), wallMat);
    leftWall.position.set(-4, 1.75, -1.5); leftWall.castShadow = true; leftWall.receiveShadow = true; scene.add(leftWall);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 5), wallMat);
    rightWall.position.set(4, 1.75, -1.5); rightWall.castShadow = true; rightWall.receiveShadow = true; scene.add(rightWall);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.15, 5.4), new THREE.MeshStandardMaterial({ color: 0x0a0a10, metalness: 0.3, roughness: 0.7 }));
    roof.position.set(0, 3.55, -1.5); roof.castShadow = true; scene.add(roof);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.5, roughness: 0.4 });
    for (let bx = -3; bx <= 3; bx += 2) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 5), beamMat); b.position.set(bx, 3.45, -1.5); scene.add(b); }

    // ── Neon Signs ──
    function createNeonText(text, color, fontSize, width, height) {
        const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 512, 128);
        ctx.fillStyle = color; ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 64);
        const tex = new THREE.CanvasTexture(canvas); tex.minFilter = THREE.LinearFilter;
        return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    }
    const neonSign1 = createNeonText('AGENTIC BIZ', '#00ccff', 52, 3, 0.75);
    neonSign1.position.set(0, 2.8, -3.85); scene.add(neonSign1);
    const neonBorder = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.2, 0.95)), new THREE.LineBasicMaterial({ color: 0x00ccff }));
    neonBorder.position.copy(neonSign1.position); neonBorder.position.z += 0.01; scene.add(neonBorder);
    const neonSign2 = createNeonText('⚡ HERMES AGENT', '#ff0088', 40, 2.8, 0.6);
    neonSign2.position.set(0, 2.0, -3.85); scene.add(neonSign2);

    const plCyan = new THREE.PointLight(0x00ccff, 6, 12, 2); plCyan.position.set(0, 2.8, -3.2); scene.add(plCyan);
    const plPink = new THREE.PointLight(0xff0088, 4, 10, 2); plPink.position.set(0, 2.0, -3.2); scene.add(plPink);
    const plOrange = new THREE.PointLight(0xff6600, 3, 8, 2); plOrange.position.set(3.8, 2, 0); scene.add(plOrange);
    const plPurple = new THREE.PointLight(0x9900ff, 3, 8, 2); plPurple.position.set(-3.5, 4.5, 1.5); scene.add(plPurple);
    setProgress(35, 'Workshop built');

    // ── Cityscape ──
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x060610, metalness: 0.2, roughness: 0.8 });
    [{x:-10,z:-14,w:2.5,h:8,d:2},{x:-6,z:-16,w:1.8,h:12,d:1.5},{x:-3,z:-18,w:3,h:6,d:2},
     {x:1,z:-15,w:2,h:10,d:1.8},{x:5,z:-17,w:2.5,h:7,d:2},{x:8,z:-14,w:1.5,h:14,d:1.5},
     {x:12,z:-16,w:3,h:9,d:2.5},{x:-12,z:-18,w:2,h:11,d:2},{x:14,z:-19,w:2.8,h:6.5,d:2}
    ].forEach(b => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), bldgMat);
        mesh.position.set(b.x, b.h / 2, b.z); scene.add(mesh);
    });
    for (let gx = -2; gx <= 2; gx += 2) {
        for (let gz = -1; gz <= 1; gz += 2) {
            const pl = new THREE.PointLight(0xfff5e6, 3, 6, 2);
            pl.position.set(gx, 3.3, gz); scene.add(pl);
        }
    }

    // ── Props ──
    const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.5 });
    [[3.2,0.45,-2.5],[3.7,0.45,-2.2],[3.4,0.45,-1.8]].forEach(p => {
        const b = new THREE.Mesh(barrelGeo, barrelMat); b.position.set(p[0], p[1], p[2]); b.castShadow = true; b.receiveShadow = true; scene.add(b);
    });
    setProgress(45, 'Environment done');

    // ════════════════════════════════════════════
    //  CHARACTER
    // ════════════════════════════════════════════
    const character = new THREE.Group();
    const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.6, 4, 8), new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.1, roughness: 0.8 }));
    bodyMesh.position.y = 0.55; character.add(bodyMesh);
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({ color: 0xddbb99, metalness: 0.1, roughness: 0.7 }));
    headMesh.position.y = 1.1; character.add(headMesh);
    const charLight = new THREE.PointLight(0x4488ff, 2, 4, 2);
    charLight.position.y = 1.5; character.add(charLight);
    character.position.set(2.5, 0, 2.5);
    character.visible = true;
    scene.add(character);

    const moveState = { forward: false, backward: false, left: false, right: false };
    const characterSpeed = 3;

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.forward = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.backward = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.right = true;
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.forward = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.backward = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.right = false;
    });

    // ════════════════════════════════════════════
    //  CAR INTERIOR BUILD (standalone group, will be parented to carModel)
    // ════════════════════════════════════════════
    function buildCarInterior() {
        const group = new THREE.Group();
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.3, roughness: 0.85 });
        const dashMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.4 });
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.1, roughness: 0.9 });
        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.05, roughness: 0.95 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1.0, roughness: 0.05 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x111133, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.2 });

        // Floor
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 2.0), cabinMat);
        floor.position.set(0, 0.08, 0); group.add(floor);

        // Dashboard
        const dash = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.12), dashMat);
        dash.position.set(0, 0.5, 0.7); group.add(dash);
        const dashTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.2), dashMat);
        dashTop.position.set(0, 0.66, 0.62); group.add(dashTop);

        // Steering wheel
        const sg = new THREE.Group();
        const steerRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 8, 24), chromeMat);
        sg.add(steerRing);
        for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 3) {
            const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.28), chromeMat);
            spoke.position.set(Math.sin(a) * 0.14, 0, Math.cos(a) * 0.14);
            spoke.rotation.y = a;
            sg.add(spoke);
        }
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), dashMat);
        hub.rotation.x = Math.PI / 2;
        sg.add(hub);
        sg.position.set(-0.4, 0.52, 0.55);
        sg.rotation.x = -0.45;
        sg.rotation.z = 0.12;
        group.add(sg);
        steerGroup = sg;

        // Driver seat
        const driverSeat = new THREE.Group();
        const dBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), seatMat);
        dBase.position.set(0, 0.18, 0); driverSeat.add(dBase);
        const dBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.1), seatMat);
        dBack.position.set(0, 0.48, -0.2); driverSeat.add(dBack);
        const dHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.07), seatMat);
        dHead.position.set(0, 0.82, -0.22); driverSeat.add(dHead);
        driverSeat.position.set(-0.45, 0, -0.15);
        group.add(driverSeat);

        // Passenger seat
        const passSeat = new THREE.Group();
        const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), seatMat);
        pBase.position.set(0, 0.18, 0); passSeat.add(pBase);
        const pBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.1), seatMat);
        pBack.position.set(0, 0.48, -0.2); passSeat.add(pBack);
        const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.07), seatMat);
        pHead.position.set(0, 0.82, -0.22); passSeat.add(pHead);
        passSeat.position.set(0.45, 0, -0.15);
        group.add(passSeat);

        // Center console
        const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.8), leatherMat);
        consoleMesh.position.set(0, 0.25, 0.15); group.add(consoleMesh);

        // Gear shifter
        const gearStick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.15, 8), chromeMat);
        gearStick.position.set(0, 0.45, 0.15); group.add(gearStick);
        const gearKnob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), leatherMat);
        gearKnob.position.set(0, 0.54, 0.15); group.add(gearKnob);

        // Windshield
        const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.7), glassMat);
        windshield.position.set(0, 0.72, 0.78);
        windshield.rotation.x = -0.3;
        group.add(windshield);

        // Rear window
        const rearWin = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.55), glassMat);
        rearWin.position.set(0, 0.7, -0.9);
        rearWin.rotation.x = 0.35;
        rearWin.rotation.y = Math.PI;
        group.add(rearWin);

        // A-pillars
        const pillarGeo = new THREE.BoxGeometry(0.05, 0.55, 0.05);
        const pL = new THREE.Mesh(pillarGeo, cabinMat);
        pL.position.set(-0.6, 0.65, 0.6);
        pL.rotation.z = 0.35;
        group.add(pL);
        const pR = new THREE.Mesh(pillarGeo, cabinMat);
        pR.position.set(0.6, 0.65, 0.6);
        pR.rotation.z = -0.35;
        group.add(pR);

        // Interior neon
        const dashNeon = new THREE.PointLight(0x00ccff, 1.5, 2.5, 2);
        dashNeon.position.set(0, 0.4, 0.5);
        group.add(dashNeon);

        return group;
    }

    function buildLaptopMesh() {
        const group = new THREE.Group();
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 });
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.035, 0.45), baseMat));
        const screenM = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
        const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.015), screenM);
        screenMesh.position.set(0, 0.23, -0.22); screenMesh.rotation.x = -0.3; group.add(screenMesh);
        laptopScreenCanvas = document.createElement('canvas');
        laptopScreenCanvas.width = 512; laptopScreenCanvas.height = 320;
        laptopScreenTexture = new THREE.CanvasTexture(laptopScreenCanvas);
        laptopScreenTexture.minFilter = THREE.LinearFilter;
        const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.37), new THREE.MeshBasicMaterial({ map: laptopScreenTexture }));
        displayMesh.position.set(0, 0.24, -0.21); displayMesh.rotation.x = -0.3; group.add(displayMesh);
        const kb = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.28), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.3, roughness: 0.8 }));
        kb.position.set(0, 0.02, 0.04); kb.rotation.x = -Math.PI / 2; group.add(kb);
        return group;
    }

    // ════════════════════════════════════════════
    //  CAR MODEL LOADING
    // ════════════════════════════════════════════
    const interactive = [];
    const loader = new GLTFLoader();

    loader.load('assets/models/runx.glb', (gltf) => {
        try {
            carModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(carModel);
            const size = new THREE.Vector3(); box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const S = 3.5 / maxDim;
            carModel.scale.setScalar(S);
            const center = new THREE.Vector3(); box.getCenter(center);
            carModel.position.set(-center.x * S, -box.min.y * S, 1.0 - center.z * S);

            let paintCount = 0;
            carModel.traverse(child => {
                if (!child.isMesh) return;
                child.castShadow = true; child.receiveShadow = true;
                if (!child.material) return;
                const mn = (child.material.name || '').toLowerCase();
                if (mn === 'paint1' || mn.includes('paint')) {
                    const cb = new THREE.Box3().setFromObject(child);
                    const cs = cb.getSize(new THREE.Vector3());
                    if (cs.x * cs.y * S > 0.3) {
                        child.material = makeFlakeBlackPaint(envMap);
                        paintCount++;
                    }
                }
                if (mn.includes('chrome') || mn === 'silver_metallic_199') {
                    if (child.material.color) child.material.color.setHex(0xcccccc);
                    child.material.metalness = 1.0;
                    child.material.roughness = 0.05;
                    child.material.envMap = envMap;
                    child.material.envMapIntensity = 2.0;
                    child.material.needsUpdate = true;
                }
                if (mn.includes('glass') || mn.includes('translucent')) {
                    child.material.envMap = envMap;
                    child.material.envMapIntensity = 1.5;
                    child.material.needsUpdate = true;
                }
            });

            // Build interior and parent to car
            carInterior = buildCarInterior();
            const carBox = new THREE.Box3().setFromObject(carModel);
            carInterior.position.set(0, -carBox.min.y * S + 0.02, (carBox.max.z - carBox.min.z) * S * 0.15);
            carModel.add(carInterior);

            // Laptop on passenger seat
            laptop = buildLaptopMesh();
            laptop.position.set(0.42, 0.26, -0.12);
            laptop.rotation.y = 0.25;
            laptop.rotation.x = -0.1;
            laptop.scale.setScalar(0.22);
            carInterior.add(laptop);

            scene.add(carModel);
            interactive.push({ mesh: carModel, data: { label: 'GARAGE', type: 'car' } });
            interactive.push({ mesh: laptop, data: { label: 'LAPTOP', type: 'laptop' } });

            // Find exhaust
            let exhaustFound = false;
            const exhaustPos = new THREE.Vector3();
            carModel.traverse(child => {
                if (!child.isMesh) return;
                const mn = (child.name || '').toLowerCase();
                if (mn.includes('exhaust') || mn.includes('pipe') || mn.includes('muffler')) {
                    child.getWorldPosition(exhaustPos);
                    exhaustFound = true;
                }
            });
            if (!exhaustFound) {
                exhaustPos.set(carModel.position.x + 0.3, carModel.position.y + 0.12, carModel.position.z - (carBox.max.z - carBox.min.z) * S * 0.45);
            }
            window.__exhaustPos = exhaustPos;

            renderStreamlitDashboard();
            setProgress(100, `Car loaded • ${paintCount} panels resprayed 🖤`);
            setTimeout(hideLoad, 600);
        } catch (e) {
            console.error('Car load error:', e);
            setProgress(100, 'Car load error');
            setTimeout(hideLoad, 600);
        }
    }, (xhr) => {
        if (xhr.total > 0) setProgress(50 + Math.round(xhr.loaded / xhr.total * 40), `Loading car: ${Math.round(xhr.loaded / xhr.total * 100)}%`);
    }, (err) => {
        console.error('GLB error:', err);
        // Build interior anyway for testing without GLB
        carInterior = buildCarInterior();
        carInterior.position.set(0, 0, 1.0);
        laptop = buildLaptopMesh();
        laptop.position.set(0.42, 0.26, -0.12);
        laptop.rotation.y = 0.25;
        laptop.rotation.x = -0.1;
        laptop.scale.setScalar(0.22);
        carInterior.add(laptop);
        scene.add(carInterior);
        interactive.push({ mesh: laptop, data: { label: 'LAPTOP', type: 'laptop' } });
        window.__exhaustPos = new THREE.Vector3(0.3, 0.12, -0.8);
        renderStreamlitDashboard();
        setProgress(100, 'Car loaded (no GLB)');
        setTimeout(hideLoad, 600);
    });

    // ════════════════════════════════════════════
    //  FLAME SYSTEM
    // ════════════════════════════════════════════
    let flameActive = false;
    let flameParticles = null;
    let flameLight = null;
    let flameEmitIndex = 0;

    function createFlameSystem() {
        const count = 60;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const lifetimes = new Float32Array(count);
        for (let i = 0; i < count; i++) { positions[i * 3 + 1] = -1000; lifetimes[i] = 0; }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geo.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        const mat = new THREE.PointsMaterial({ color: 0xff6600, size: 0.12, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
        flameParticles = new THREE.Points(geo, mat);
        flameParticles.userData = { velocities, lifetimes };
        scene.add(flameParticles);
        flameLight = new THREE.PointLight(0xff4400, 0, 5, 2);
        scene.add(flameLight);
    }
    createFlameSystem();

    function getExhaustWorldPos() {
        if (window.__exhaustPos) return window.__exhaustPos.clone();
        if (carModel) {
            const p = new THREE.Vector3(0.3, 0.12, -1.5);
            p.applyMatrix4(carModel.matrixWorld);
            return p;
        }
        return new THREE.Vector3(0.3, 0.12, -0.8);
    }

    function emitFlame() {
        if (!flameParticles) return;
        const geo = flameParticles.geometry;
        const pos = geo.attributes.position.array;
        const vel = flameParticles.userData.velocities;
        const life = flameParticles.userData.lifetimes;
        const count = pos.length / 3;
        const ep = getExhaustWorldPos();
        for (let n = 0; n < 3; n++) {
            const i = flameEmitIndex % count;
            pos[i * 3] = ep.x + (Math.random() - 0.5) * 0.12;
            pos[i * 3 + 1] = ep.y + Math.random() * 0.04;
            pos[i * 3 + 2] = ep.z + (Math.random() - 0.5) * 0.08 - 0.2;
            vel[i * 3] = (Math.random() - 0.5) * 0.015;
            vel[i * 3 + 1] = Math.random() * 0.05 + 0.02;
            vel[i * 3 + 2] = -Math.random() * 0.06 - 0.03;
            life[i] = 1.0;
            flameEmitIndex++;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.lifetime.needsUpdate = true;
    }

    function updateFlame(dt) {
        if (!flameParticles) return;
        const geo = flameParticles.geometry;
        const pos = geo.attributes.position.array;
        const vel = flameParticles.userData.velocities;
        const life = flameParticles.userData.lifetimes;
        const count = pos.length / 3;
        for (let i = 0; i < count; i++) {
            if (life[i] <= 0) continue;
            life[i] -= dt * 2.5;
            pos[i * 3] += vel[i * 3] * dt;
            pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
            pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
            vel[i * 3 + 1] *= 0.98;
            if (life[i] <= 0) pos[i * 3 + 1] = -1000;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.lifetime.needsUpdate = true;
        if (flameLight) {
            flameLight.intensity = flameActive ? (3 + Math.sin(performance.now() * 0.02) * 1.5) : 0;
            if (flameActive) {
                const ep = getExhaustWorldPos();
                flameLight.position.copy(ep);
            }
        }
    }

    setProgress(50, 'Flame system ready');

    // ════════════════════════════════════════════
    //  LAPTOP SCREEN RENDERING
    // ════════════════════════════════════════════
    function getPageTitle(page) {
        const t = { dashboard: '> AGENT_DASHBOARD', projects: '> PROJECTS.md', garage: '> GARAGE.glb', agents: '> HERMES.exe', contact: '> CONTACT.json', videos: '> VIDEOS.mp4' };
        return t[page] || page;
    }
    function getPageContent(page) {
        const c = {
            dashboard: ['','$ whoami','→ akhil.pillay — sa | kzn | tongaat','','$ hermes --status','● gateway    — running (v2.4.0)','● provider   — openrouter/free','● memory     — 96% (4809/5000)','● cron jobs  — 4 active','','$ ls projects/','→ agenticbiz    [live] 🟢','→ hush-v1       [live] 🟢','→ dirt-hands    [dev]  🟡','→ comfort-shoot [auto] 🟢','','$ runx --specs','→ 140rt | toyota | full black | manual','→ flames: yes (when hot 🔥)'],
            projects: ['','## Active Projects','','[1] AgenticBiz','    AI agent deployment','    → agenticbiz.vercel.app','','[2] Hush v1','    Car social platform (SA)','    → hush-v1.vercel.app','','[3] Dirt Hands Crew','    JDM mobile game','    Godot 4.4+ | Supabase','','[4] Ventrix Petroleum','    Industrial fuel co.','    React + Vite | Parallax'],
            garage: ['','## The Garage','','VEHICLE: Toyota 140rt Runx','COLOR:   Gloss black + metallic','TRANS:   Manual','FUEL:    95 + NOS 😏','','SPECS:','→ Weekly drags: Link Road','→ Strip: King Shaka Airport Rd','→ Flames: YES (on demand 🔥)','','MOD LIST:','→ Full black paint w/ metallic','→ Tinted windows | Lowered','→ Custom exhaust (flame-capable)','','$ status: BORN TO DRAG'],
            agents: ['','## Hermes Agent System','','CAPABILITIES:','• Wix form → WhatsApp pipeline','• XAUUSD trading analysis','• Video production (HyperFrames)','• Client mgmt automation','• Cron-based monitoring','','INFRA:','→ Local: Lenovo IdeaPad 3','  (32GB RAM | RTX 3050)','→ Cloud: Daytona + Orgo','','\"Stop thinking in endless manual','implementation. Start thinking in','outcomes, systems, and intelligent','execution.\"'],
            contact: ['','## Get In Touch','','{','  \"name\":    \"Akhil Pillay\",','  \"location\": \"Tongaat, KZN, SA\",','  \"email\":   \"akhilpillay2.0@gmail.com\",','  \"phone\":   \"067 865 9396\",','  \"whatsapp\": \"wa.me/27678659396\",','  \"youtube\":  \"youtube.com/@that-it-dude\",','  \"tiktok\":   \"tiktok.com/@that_it_.guy\",','  \"web\":      \"agenticbiz.vercel.app\"','}','','$ ping akhil — response: fast ⚡'],
            videos: ['','## 🎬 Durban Drag Videos','','▶ Link Road Drags','  Every weekend — Durban North','','▶ King Shaka Airport Strip','  Full throttle runs','','▶ 140rt Runx Build Series','  Full black | Flame exhaust | Manual','','▶ Car Meet Highlights','  SA car culture — Durban','','[ Click PLAY to watch ]']
        };
        return c[page] || ['coming soon...'];
    }
    function renderStreamlitDashboard() {
        if (!laptopScreenCanvas) return;
        const ctx = laptopScreenCanvas.getContext('2d');
        const cw = laptopScreenCanvas.width, ch = laptopScreenCanvas.height;
        ctx.fillStyle = '#0e1117'; ctx.fillRect(0, 0, cw, ch);
        const sbW = streamlitState.sidebarOpen ? 120 : 0;
        if (streamlitState.sidebarOpen) {
            ctx.fillStyle = '#1a1d27'; ctx.fillRect(0, 0, sbW, ch);
            ctx.fillStyle = '#00ccff'; ctx.font = 'bold 11px "JetBrains Mono", monospace'; ctx.fillText('⚡ HERMES', 8, 24);
            ctx.fillStyle = '#666'; ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText('v2.4.0 — free', 8, 38);
            ['dashboard','projects','garage','agents','contact','videos'].forEach((p, i) => {
                const y = 58 + i * 26;
                if (streamlitState.activePage === p) { ctx.fillStyle = 'rgba(0,204,255,0.1)'; ctx.fillRect(0, y - 12, sbW, 24); ctx.fillStyle = '#00ccff'; }
                else ctx.fillStyle = '#888';
                ctx.font = '10px "JetBrains Mono", monospace';
                ctx.fillText(['📊','🚀','🏎️','⚡','📬','🎬'][i] + ' ' + p, 8, y);
            });
        } else {
            ctx.fillStyle = '#1a1d27'; ctx.fillRect(0, 0, 24, ch);
            ctx.fillStyle = '#00ccff'; ctx.font = '14px monospace'; ctx.fillText('▶', 6, 24);
        }
        const mx = sbW + 12;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px "JetBrains Mono", monospace'; ctx.fillText(getPageTitle(streamlitState.activePage), mx, 30);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx, 40); ctx.lineTo(cw - 12, 40); ctx.stroke();
        ctx.fillStyle = '#ccc'; ctx.font = '10px "JetBrains Mono", monospace';
        getPageContent(streamlitState.activePage).forEach((line, i) => { ctx.fillText(line, mx, 58 + i * 16); });
        ctx.fillStyle = '#0a0c12'; ctx.fillRect(0, ch - 20, cw, 20);
        ctx.fillStyle = '#00ff88'; ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText('● ONLINE', 8, ch - 7);
        ctx.fillStyle = '#666'; ctx.fillText('OpenRouter // free tier', sbW + 8, ch - 7);
        if (laptopScreenTexture) laptopScreenTexture.needsUpdate = true;
    }

    // ════════════════════════════════════════════
    //  CAR ENTRY / EXIT
    // ════════════════════════════════════════════
    function getDriverEyeWorldPos() {
        if (!carInterior) return new THREE.Vector3(-0.45, 0.7, 1.0);
        const local = DRIVER_SEAT_LOCAL.clone().add(DRIVER_EYE_LOCAL);
        local.applyMatrix4(carInterior.matrixWorld);
        return local;
    }

    function getDriverLookTarget() {
        if (!carInterior) return new THREE.Vector3(-0.45, 0.7, 3.0);
        const forward = new THREE.Vector3(0, 0, 4);
        const eye = DRIVER_SEAT_LOCAL.clone().add(DRIVER_EYE_LOCAL);
        eye.add(forward);
        eye.applyMatrix4(carInterior.matrixWorld);
        return eye;
    }

    function enterCar() {
        if (playerState !== 'walking') return;
        if (!carInterior) { $('info-bar').textContent = 'Car not loaded yet...'; return; }
        playerState = 'entering';
        if (isPointerLocked) document.exitPointerLock();
        entryAnim.active = true;
        entryAnim.t = 0;
        entryAnim.fromPos.copy(camera.position);
        entryAnim.fromLook.copy(controls.target);
        entryAnim.toPos.copy(getDriverEyeWorldPos());
        entryAnim.toLook.copy(getDriverLookTarget());
        character.visible = false;
        controls.enabled = false;
        $('info-bar').textContent = '🚗 Entering driver seat...';
    }

    function exitCar() {
        if (playerState !== 'driving') return;
        playerState = 'exiting';
        if (isPointerLocked) document.exitPointerLock();
        entryAnim.active = true;
        entryAnim.t = 0;
        entryAnim.fromPos.copy(camera.position);
        const currentLook = new THREE.Vector3();
        camera.getWorldDirection(currentLook);
        entryAnim.fromLook.copy(camera.position).add(currentLook.multiplyScalar(3));
        const exitPos = (carModel || carInterior).position.clone().add(new THREE.Vector3(-2.5, 0, 0.5));
        character.position.copy(exitPos);
        character.visible = true;
        entryAnim.toPos.copy(exitPos).add(new THREE.Vector3(-2.5, 2.5, 3));
        entryAnim.toLook.copy(exitPos);
        $('info-bar').textContent = '🚶 Exiting car...';
    }

    // ════════════════════════════════════════════
    //  CONTROLS
    // ════════════════════════════════════════════
    const gasIndicator = $('gas-indicator');

    document.addEventListener('keydown', e => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (playerState === 'driving') {
                flameActive = !flameActive;
                gasIndicator.style.color = flameActive ? 'rgba(255,102,0,1)' : 'rgba(255,102,0,0)';
            }
        }
        if (e.code === 'KeyE') {
            if (playerState === 'walking') {
                const refPos = carModel ? carModel.position : (carInterior ? carInterior.position : new THREE.Vector3(0, 0, 1));
                const dist = character.position.distanceTo(refPos);
                if (dist < 4) enterCar();
                else {
                    $('info-bar').textContent = '🚶 Walk closer to the car (E)';
                    setTimeout(() => { if (playerState === 'walking') $('info-bar').textContent = "The Agent's Workshop — explore the garage"; }, 2000);
                }
            } else if (playerState === 'driving') {
                exitCar();
            }
        }
    });
    document.addEventListener('keyup', e => { if (e.code === 'Space') e.preventDefault(); });

    // Pointer lock
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === renderer.domElement;
    });
    document.addEventListener('mousemove', (e) => {
        if (!isPointerLocked || playerState !== 'driving') return;
        fpYaw -= e.movementX * 0.003;
        fpPitch -= e.movementY * 0.003;
        fpPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, fpPitch));
    });

    // ════════════════════════════════════════════
    //  MOUSE INTERACTION
    // ════════════════════════════════════════════
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let tapStart = { x: 0, y: 0, time: 0 };

    renderer.domElement.addEventListener('pointerdown', e => {
        tapStart = { x: e.clientX, y: e.clientY, time: Date.now() };
    });
    renderer.domElement.addEventListener('pointerup', e => {
        const dx = e.clientX - tapStart.x, dy = e.clientY - tapStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const elapsed = Date.now() - tapStart.time;
        if (dist > 8 || elapsed > 500) return;

        if (playerState === 'driving' && !isPointerLocked) {
            renderer.domElement.requestPointerLock();
            return;
        }

        pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = -(e.clientY / innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(interactive.map(i => i.mesh), true);
        if (hits.length) {
            const hit = hits[0].object;
            const item = interactive.find(i => {
                if (i.mesh === hit) return true;
                let p = hit.parent; while (p) { if (i.mesh === p) return true; p = p.parent; } return false;
            });
            if (item) {
                if (item.data.type === 'car' && playerState === 'walking') enterCar();
                else if (item.data.type === 'laptop') openFullscreenLaptop();
                else if (item.data.type === 'car' && playerState === 'driving') {
                    flameActive = !flameActive;
                    gasIndicator.style.color = flameActive ? 'rgba(255,102,0,1)' : 'rgba(255,102,0,0)';
                }
            }
        }
    });

    // ════════════════════════════════════════════
    //  FULLSCREEN LAPTOP OVERLAY
    // ════════════════════════════════════════════
    let fsCanvas = null, fsCtx = null;
    let fsSidebarOpen = true, fsActivePage = 'dashboard';

    const fsOverlay = document.createElement('div');
    fsOverlay.id = 'fs-laptop-overlay';
    fsOverlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);justify-content:center;align-items:center;overflow:hidden;';
    document.body.appendChild(fsOverlay);

    const fsLaptopFrame = document.createElement('div');
    fsLaptopFrame.style.cssText = 'width:85vw;height:82vh;max-width:1200px;background:#0e1117;border-radius:12px;border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;overflow:hidden;';
    fsOverlay.appendChild(fsLaptopFrame);

    const titleBar = document.createElement('div');
    titleBar.style.cssText = 'height:36px;background:#1a1d27;display:flex;align-items:center;padding:0 12px;gap:8px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;';
    titleBar.innerHTML = '<span style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></span><span style="width:12px;height:12px;border-radius:50%;background:#febc2e"></span><span style="width:12px;height:12px;border-radius:50%;background:#28c840"></span><span style="color:rgba(255,255,255,0.4);font-family:JetBrains Mono,monospace;font-size:11px;margin-left:12px">agent@workshop:~/desktop</span>';
    fsLaptopFrame.appendChild(titleBar);

    const fsClose = document.createElement('button');
    fsClose.textContent = '✕';
    fsClose.style.cssText = 'position:absolute;top:8px;right:12px;background:rgba(255,255,255,0.06);border:none;border-radius:6px;width:28px;height:28px;color:rgba(255,255,255,0.5);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:5;';
    fsClose.onclick = () => { fsOverlay.style.display = 'none'; document.removeEventListener('keydown', fsEscHandler); };
    fsOverlay.appendChild(fsClose);

    const screenArea = document.createElement('div');
    screenArea.style.cssText = 'flex:1;display:flex;overflow:hidden;';
    fsLaptopFrame.appendChild(screenArea);

    const fsSidebar = document.createElement('div');
    fsSidebar.style.cssText = 'width:180px;background:#1a1d27;border-right:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;flex-shrink:0;transition:width 0.25s;';
    screenArea.appendChild(fsSidebar);

    const fsMainArea = document.createElement('div');
    fsMainArea.style.cssText = 'flex:1;position:relative;overflow:hidden;display:flex;flex-direction:column;';
    screenArea.appendChild(fsMainArea);

    fsCanvas = document.createElement('canvas');
    fsCanvas.width = 900; fsCanvas.height = 600;
    fsCanvas.style.cssText = 'flex:1;width:100%;';
    fsMainArea.appendChild(fsCanvas);
    fsCtx = fsCanvas.getContext('2d');

    // Video container
    const fsVideoContainer = document.createElement('div');
    fsVideoContainer.style.cssText = 'display:none;flex:1;background:#000;';
    fsMainArea.appendChild(fsVideoContainer);

    // Sidebar
    const sbHeader = document.createElement('div');
    sbHeader.style.cssText = 'padding:16px 14px 10px;border-bottom:1px solid rgba(255,255,255,0.06);';
    sbHeader.innerHTML = '<div style="color:#00ccff;font-family:JetBrains Mono,monospace;font-size:14px;font-weight:700">⚡ HERMES</div><div style="color:#666;font-family:JetBrains Mono,monospace;font-size:10px;margin-top:4px">v2.4.0 — free</div>';
    fsSidebar.appendChild(sbHeader);

    const navItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'projects', icon: '🚀', label: 'Projects' },
        { id: 'garage',   icon: '🏎️', label: 'Garage' },
        { id: 'agents',   icon: '⚡', label: 'Agents' },
        { id: 'contact',  icon: '📬', label: 'Contact' },
        { id: 'videos',   icon: '🎬', label: 'Videos' },
    ];
    const sbNavItems = [];
    navItems.forEach(item => {
        const el = document.createElement('div');
        el.style.cssText = 'padding:10px 14px;color:#888;font-family:JetBrains Mono,monospace;font-size:12px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:8px;border-left:3px solid transparent;';
        el.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`;
        el.onclick = () => { fsActivePage = item.id; renderFsPage(); };
        el.onmouseenter = () => { if (fsActivePage !== item.id) el.style.background = 'rgba(255,255,255,0.04)'; };
        el.onmouseleave = () => { if (fsActivePage !== item.id) el.style.background = 'transparent'; };
        fsSidebar.appendChild(el);
        sbNavItems.push({ el, item });
    });

    const collapseBtn = document.createElement('div');
    collapseBtn.style.cssText = 'margin-top:auto;padding:12px 14px;color:#555;font-family:JetBrains Mono,monospace;font-size:10px;cursor:pointer;border-top:1px solid rgba(255,255,255,0.06);';
    collapseBtn.textContent = '◀ collapse';
    collapseBtn.onclick = () => {
        fsSidebarOpen = !fsSidebarOpen;
        fsSidebar.style.width = fsSidebarOpen ? '180px' : '36px';
        collapseBtn.textContent = fsSidebarOpen ? '◀ collapse' : '▶';
        sbHeader.style.display = fsSidebarOpen ? 'block' : 'none';
        sbNavItems.forEach(ni => { ni.el.innerHTML = fsSidebarOpen ? `<span>${ni.item.icon}</span><span>${ni.item.label}</span>` : `<span style="text-align:center;width:100%">${ni.item.icon}</span>`; });
        renderFsPage();
    };
    fsSidebar.appendChild(collapseBtn);

    // ── Real YouTube videos: SA car culture / Durban drag ──
    const videoList = [
        { title: 'SA Street Racing Culture', yt: '8jPQjjsBbIc' },
        { title: 'Durban Car Meet 2024', yt: 'XqZsoesa55w' },
        { title: 'Toyota Runx Build & Drag', yt: 'kJQP7kiw5Fk' },
        { title: 'King Shaka Strip Runs', yt: 'RgKAFK5djSk' },
    ];
    let currentVideoIdx = 0;

    function buildVideoPlayer() {
        fsVideoContainer.innerHTML = '';
        fsVideoContainer.style.display = 'flex';
        fsVideoContainer.style.flexDirection = 'column';

        const vidTitle = document.createElement('div');
        vidTitle.style.cssText = 'padding:10px 16px;color:#fff;font-family:JetBrains Mono,monospace;font-size:13px;background:rgba(0,0,0,0.5);flex-shrink:0;';
        vidTitle.textContent = '🎬 ' + videoList[currentVideoIdx].title;
        fsVideoContainer.appendChild(vidTitle);

        const iframeWrap = document.createElement('div');
        iframeWrap.style.cssText = 'flex:1;position:relative;';
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
        iframe.src = `https://www.youtube.com/embed/${videoList[currentVideoIdx].yt}?rel=0&modestbranding=1&autoplay=0`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframeWrap.appendChild(iframe);
        fsVideoContainer.appendChild(iframeWrap);

        const selector = document.createElement('div');
        selector.style.cssText = 'display:flex;gap:6px;padding:8px 12px;background:rgba(0,0,0,0.7);overflow-x:auto;flex-shrink:0;';
        videoList.forEach((v, i) => {
            const btn = document.createElement('button');
            btn.style.cssText = `padding:6px 12px;border-radius:6px;border:none;font-family:JetBrains Mono,monospace;font-size:10px;cursor:pointer;white-space:nowrap;${i === currentVideoIdx ? 'background:#00ccff;color:#000;' : 'background:rgba(255,255,255,0.1);color:#888;'}`;
            btn.textContent = v.title.substring(0, 22) + '...';
            btn.onclick = () => { currentVideoIdx = i; buildVideoPlayer(); };
            selector.appendChild(btn);
        });
        fsVideoContainer.appendChild(selector);
    }

    function renderFsPage() {
        if (!fsCtx) return;
        sbNavItems.forEach(ni => {
            if (ni.item.id === fsActivePage) {
                ni.el.style.cssText = ni.el.style.cssText.replace('color:#888', 'color:#00ccff').replace('border-left:3px solid transparent', 'border-left:3px solid #00ccff');
                ni.el.style.background = 'rgba(0,204,255,0.1)';
                ni.el.style.color = '#00ccff';
                ni.el.style.borderLeftColor = '#00ccff';
            } else {
                ni.el.style.background = 'transparent';
                ni.el.style.color = '#888';
                ni.el.style.borderLeftColor = 'transparent';
            }
        });

        if (fsActivePage === 'videos') {
            fsCanvas.style.display = 'none';
            buildVideoPlayer();
            return;
        } else {
            fsCanvas.style.display = 'block';
            fsVideoContainer.style.display = 'none';
        }

        const cw = fsCanvas.width, ch = fsCanvas.height;
        fsCtx.fillStyle = '#0e1117'; fsCtx.fillRect(0, 0, cw, ch);
        fsCtx.fillStyle = '#fff'; fsCtx.font = 'bold 18px "JetBrains Mono", monospace';
        fsCtx.fillText(getPageTitle(fsActivePage), 20, 36);
        fsCtx.strokeStyle = '#333'; fsCtx.lineWidth = 1;
        fsCtx.beginPath(); fsCtx.moveTo(20, 48); fsCtx.lineTo(cw - 20, 48); fsCtx.stroke();
        fsCtx.fillStyle = '#ccc'; fsCtx.font = '12px "JetBrains Mono", monospace';
        getPageContent(fsActivePage).forEach((line, i) => { fsCtx.fillText(line, 20, 72 + i * 18); });
        fsCtx.fillStyle = '#0a0c12'; fsCtx.fillRect(0, ch - 24, cw, 24);
        fsCtx.fillStyle = '#00ff88'; fsCtx.font = '10px "JetBrains Mono", monospace';
        fsCtx.fillText('● ONLINE', 10, ch - 8);
        fsCtx.fillStyle = '#666'; fsCtx.fillText('OpenRouter // free tier', 100, ch - 8);
    }

    function openFullscreenLaptop() {
        fsOverlay.style.display = 'flex';
        fsActivePage = streamlitState.activePage;
        renderFsPage();
        document.addEventListener('keydown', fsEscHandler);
    }
    function fsEscHandler(e) { if (e.code === 'Escape') { fsOverlay.style.display = 'none'; document.removeEventListener('keydown', fsEscHandler); } }
    fsOverlay.addEventListener('click', (e) => { if (e.target === fsOverlay) { fsOverlay.style.display = 'none'; document.removeEventListener('keydown', fsEscHandler); } });

    // ════════════════════════════════════════════
    //  MOBILE CONTROLS
    // ════════════════════════════════════════════
    let joystickActive = false, joystickStart = { x: 0, y: 0 };
    renderer.domElement.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        if (e.touches[0].clientX / innerWidth < 0.4) { joystickActive = true; joystickStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
    }, { passive: true });
    renderer.domElement.addEventListener('touchmove', (e) => {
        if (!joystickActive || e.touches.length !== 1) return;
        const t = e.touches[0];
        const dx = (t.clientX - joystickStart.x) / 50, dy = (t.clientY - joystickStart.y) / 50;
        moveState.forward = dy < -0.3; moveState.backward = dy > 0.3;
        moveState.left = dx < -0.3; moveState.right = dx > 0.3;
    }, { passive: true });
    renderer.domElement.addEventListener('touchend', () => {
        joystickActive = false; moveState.forward = moveState.backward = moveState.left = moveState.right = false;
    });

    const btnGas = document.getElementById('btn-gas');
    const btnLaptop = document.getElementById('btn-laptop');
    if (btnGas) {
        btnGas.addEventListener('touchstart', function(e) { e.preventDefault(); flameActive = !flameActive; gasIndicator.style.color = flameActive ? 'rgba(255,102,0,1)' : 'rgba(255,102,0,0)'; });
        btnGas.addEventListener('click', function() { flameActive = !flameActive; gasIndicator.style.color = flameActive ? 'rgba(255,102,0,1)' : 'rgba(255,102,0,0)'; });
    }
    if (btnLaptop) {
        btnLaptop.addEventListener('touchstart', function(e) { e.preventDefault(); openFullscreenLaptop(); });
        btnLaptop.addEventListener('click', function() { openFullscreenLaptop(); });
    }

    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    if (joystickZone) {
        joystickZone.addEventListener('touchstart', function(e) { e.preventDefault(); joystickActive = true; var t = e.touches[0]; joystickStart = { x: t.clientX, y: t.clientY }; });
        joystickZone.addEventListener('touchmove', function(e) {
            e.preventDefault(); if (!joystickActive) return;
            var t = e.touches[0]; var dx = t.clientX - joystickStart.x, dy = t.clientY - joystickStart.y;
            var maxDist = 30, dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDist) { dx = dx / dist * maxDist; dy = dy / dist * maxDist; }
            joystickKnob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
            moveState.forward = dy < -10; moveState.backward = dy > 10; moveState.left = dx < -10; moveState.right = dx > 10;
        });
        joystickZone.addEventListener('touchend', function() { joystickActive = false; moveState.forward = moveState.backward = moveState.left = moveState.right = false; joystickKnob.style.transform = 'translate(-50%,-50%)'; });
    }

    // ════════════════════════════════════════════
    //  ANIMATION LOOP
    // ════════════════════════════════════════════
    let prevTime = performance.now();
    function animate() {
        requestAnimationFrame(animate);
        const now = performance.now(), dt = Math.min((now - prevTime) * 0.001, 0.05); prevTime = now;
        const t = now * 0.001;

        // Entry/exit animation
        if (entryAnim.active) {
            entryAnim.t += dt / entryAnim.duration;
            const alpha = Math.min(1, entryAnim.t);
            const eased = 1 - Math.pow(1 - alpha, 3);
            camera.position.lerpVectors(entryAnim.fromPos, entryAnim.toPos, eased);
            const lookTarget = new THREE.Vector3().lerpVectors(entryAnim.fromLook, entryAnim.toLook, eased);
            camera.lookAt(lookTarget);
            if (alpha >= 1) {
                entryAnim.active = false;
                if (playerState === 'entering') {
                    playerState = 'driving';
                    controls.enabled = false;
                    $('info-bar').textContent = '🚗 DRIVING — click to look, SPACE flames, E exit';
                    setTimeout(() => { renderer.domElement.requestPointerLock(); }, 200);
                } else if (playerState === 'exiting') {
                    playerState = 'walking';
                    controls.enabled = true;
                    controls.target.copy(character.position).add(new THREE.Vector3(0, 1, 0));
                    camera.position.copy(entryAnim.toPos);
                    $('info-bar').textContent = "The Agent's Workshop — explore the garage";
                }
            }
        }

        // Walking
        if (playerState === 'walking') {
            const moveDir = new THREE.Vector3();
            if (moveState.forward) moveDir.z -= 1;
            if (moveState.backward) moveDir.z += 1;
            if (moveState.left) moveDir.x -= 1;
            if (moveState.right) moveDir.x += 1;
            if (moveDir.length() > 0) {
                moveDir.normalize();
                const camDir = new THREE.Vector3(); camera.getWorldDirection(camDir); camDir.y = 0; camDir.normalize();
                const camRight = new THREE.Vector3(); camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
                const fm = new THREE.Vector3();
                fm.addScaledVector(camDir, -moveDir.z); fm.addScaledVector(camRight, moveDir.x);
                character.position.x += fm.x * characterSpeed * dt;
                character.position.z += fm.z * characterSpeed * dt;
                character.position.y = 0;
                character.rotation.y = Math.atan2(fm.x, fm.z);
            }
            const refPos = carModel ? carModel.position : (carInterior ? carInterior.position : new THREE.Vector3(0, 0, 1));
            const distToCar = character.position.distanceTo(refPos);
            if (distToCar < 4 && distToCar > 1.5) $('info-bar').textContent = '🚗 Press E to get in the car';
            else if (playerState === 'walking') $('info-bar').textContent = "The Agent's Workshop — explore the garage";
            controls.update();
        }

        // Driving (first person from driver seat)
        if (playerState === 'driving' && !entryAnim.active) {
            const eyePos = getDriverEyeWorldPos();
            // Idle vibration
            const bobX = Math.sin(t * 8) * 0.003;
            const bobY = Math.abs(Math.sin(t * 12)) * 0.002;
            camera.position.set(eyePos.x + bobX, eyePos.y + bobY, eyePos.z);

            const lookDir = new THREE.Vector3(
                Math.sin(fpYaw) * Math.cos(fpPitch),
                Math.sin(fpPitch),
                Math.cos(fpYaw) * Math.cos(fpPitch)
            );
            camera.lookAt(camera.position.clone().add(lookDir.multiplyScalar(5)));

            // Steering wheel follows mouse
            if (steerGroup) {
                steerGroup.rotation.z = 0.12 + Math.max(-0.5, Math.min(0.5, -fpYaw * 0.08));
            }

            // Flame shake
            if (flameActive) {
                camera.position.x += (Math.random() - 0.5) * 0.008;
                camera.position.y += (Math.random() - 0.5) * 0.005;
            }
        }

        // Laptop breathing
        if (laptop) {
            const breathe = Math.sin(t * 1.5) * 0.012;
            laptop.scale.setScalar(0.22 + breathe);
        }

        // Neon pulse
        plCyan.intensity = 6 + Math.sin(t * 1.8) * 1.5;
        plPink.intensity = 4 + Math.cos(t * 1.5) * 1;
        plOrange.intensity = 3 + Math.sin(t * 2.2) * 0.8;
        plPurple.intensity = 3 + Math.cos(t * 1.2) * 0.8;

        if (flameActive) emitFlame();
        updateFlame(dt);
        if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) renderStreamlitDashboard();
        composer.render();
    }
    animate();
    setProgress(55, 'Ready to roll...');

    // Safety timeout: force-hide loading after 4 seconds regardless
    setTimeout(() => {
        setProgress(100, 'Loaded');
        hideLoad();
    }, 4000);
}
