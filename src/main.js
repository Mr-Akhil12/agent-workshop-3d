/**
 * The Agent's Workshop — Interactive 3D Portfolio
 * Main entry point for Vite IIFE bundle
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

    // ── DOM Helpers ──
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

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(6, 4, 8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.8, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minPolarAngle = Math.PI * 0.08;
    controls.enablePan = false;
    controls.update();

    // ── Environment Map ──
    const envMap = createEnvMap(renderer);

    // ── Post-Processing ──
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.15, 0.85, 0.01);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    setProgress(10, 'Scene initialized');

    // ── Lighting (realistic garage, warm, bright enough) ──
    scene.add(new THREE.AmbientLight(0x2a2a33, 0.8));
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    keyLight.position.set(3, 8, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -8; keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8; keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffddaa, 0.6);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);
    // Ceiling point light
    const plCeiling = new THREE.PointLight(0xfff8f0, 10, 25, 1.5);
    plCeiling.position.set(0, 3.2, 0);
    scene.add(plCeiling);
    // Strong spotlight on the car
    const spotCar = new THREE.SpotLight(0xffffff, 15, 20, Math.PI/6, 0.5, 1);
    spotCar.position.set(2, 5, 4);
    spotCar.target.position.set(0, 0, 0);
    scene.add(spotCar);
    scene.add(spotCar.target);

    // ── Ground (dark concrete, no grid) ──
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.15, roughness: 0.75 })
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    setProgress(20, 'Ground and lighting ready');

    // ── Signpost ──
    const signData = [
        { label: 'PROJECTS', color: 0xff0088 },
        { label: 'HUSH',     color: 0x00ff88 },
        { label: 'GARAGE',   color: 0xff6600 },
        { label: 'AGENTS',   color: 0x00ccff },
        { label: 'CONTACT',  color: 0xff00ff },
    ];
    const signObjects = [];
    const signpostGroup = new THREE.Group();
    signpostGroup.position.set(-3.5, 0, 1.5);

    const poleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0x222228, metalness: 0.7, roughness: 0.3 })
    );
    poleMesh.position.y = 2.5; poleMesh.castShadow = true; signpostGroup.add(poleMesh);

    const capMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), makeNeonMaterial(0x00ccff, 3));
    capMesh.position.y = 5.1; signpostGroup.add(capMesh);

    signData.forEach((s, i) => {
        const y = 4.2 - i * 0.8;
        const sg = new THREE.Group(); sg.position.set(0, y, 0);
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.35, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x0c0c12, emissive: s.color, emissiveIntensity: 0.4, metalness: 0.2, roughness: 0.5 })
        );
        body.position.x = 0.9; body.castShadow = true; sg.add(body);
        const tipShape = new THREE.Shape();
        tipShape.moveTo(0, 0.2); tipShape.lineTo(0.35, 0); tipShape.lineTo(0, -0.2); tipShape.closePath();
        const tip = new THREE.Mesh(new THREE.ExtrudeGeometry(tipShape, { depth: 0.08, bevelEnabled: false }), makeNeonMaterial(s.color, 2));
        tip.position.set(2.1, 0, -0.04); sg.add(tip);
        const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 256, 64);
        ctx.fillStyle = '#' + new THREE.Color(s.color).getHexString();
        ctx.font = 'bold 36px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s.label, 128, 32);
        const textMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1.4, 0.28),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
        );
        textMesh.position.set(0.9, 0, 0.05); sg.add(textMesh);
        signpostGroup.add(sg);
        signObjects.push({ mesh: body, data: s });
        signObjects.push({ mesh: tip, data: s });
    });
    scene.add(signpostGroup);
    setProgress(30, 'Signpost built');

    // ── Workshop ──
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c0c14, metalness: 0.15, roughness: 0.85 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, 0.2), wallMat);
    backWall.position.set(0, 1.75, -4); backWall.castShadow = true; backWall.receiveShadow = true; scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 5), wallMat);
    leftWall.position.set(-4, 1.75, -1.5); leftWall.castShadow = true; leftWall.receiveShadow = true; scene.add(leftWall);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 5), wallMat);
    rightWall.position.set(4, 1.75, -1.5); rightWall.castShadow = true; rightWall.receiveShadow = true; scene.add(rightWall);
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(8.4, 0.15, 5.4),
        new THREE.MeshStandardMaterial({ color: 0x0a0a10, metalness: 0.3, roughness: 0.7 })
    );
    roof.position.set(0, 3.55, -1.5); roof.castShadow = true; scene.add(roof);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.5, roughness: 0.4 });
    for (let bx = -3; bx <= 3; bx += 2) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 5), beamMat); b.position.set(bx, 3.45, -1.5); scene.add(b); }
    setProgress(40, 'Workshop structure built');

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
    const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.2, 0.95)),
        new THREE.LineBasicMaterial({ color: 0x00ccff })
    );
    border.position.copy(neonSign1.position); border.position.z += 0.01; scene.add(border);
    const neonSign2 = createNeonText('⚡ HERMES AGENT', '#ff0088', 40, 2.8, 0.6);
    neonSign2.position.set(0, 2.0, -3.85); scene.add(neonSign2);

    setProgress(50, 'Scene built');
    function createWire(p1, p2, sag = 0.3) {
        const pts = [];
        for (let t = 0; t <= 1; t += 0.05) {
            pts.push(new THREE.Vector3(
                p1.x + (p2.x - p1.x) * t,
                p1.y + (p2.y - p1.y) * t - sag * Math.sin(Math.PI * t),
                p1.z + (p2.z - p1.z) * t
            ));
        }
        return new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.015, 4, false),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.6 })
        );
    }
    setProgress(50, 'Scene built');

    // ── Props ──
    const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.5 });
    [[3.2,0.45,-2.5],[3.7,0.45,-2.2],[3.4,0.45,-1.8]].forEach(p => {
        const b = new THREE.Mesh(barrelGeo, barrelMat); b.position.set(p[0], p[1], p[2]); b.castShadow = true; b.receiveShadow = true; scene.add(b);
    });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 2), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 }));
    shelf.position.set(-3.8, 1.5, -2); scene.add(shelf);
    setProgress(55, 'Props placed');

    // ── Laptop (on passenger seat) ──
    let laptopScreenCanvas = null;
    let laptopScreenTexture = null;
    const streamlitState = { sidebarOpen: true, activePage: 'dashboard' };

    function buildLaptop() {
        const group = new THREE.Group();
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 });
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.55), baseMat));
        const screenM = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
        const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.02), screenM);
        screenMesh.position.set(0, 0.27, -0.26); screenMesh.rotation.x = -0.3; group.add(screenMesh);
        laptopScreenCanvas = document.createElement('canvas');
        laptopScreenCanvas.width = 512; laptopScreenCanvas.height = 320;
        laptopScreenTexture = new THREE.CanvasTexture(laptopScreenCanvas);
        laptopScreenTexture.minFilter = THREE.LinearFilter;
        const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.44), new THREE.MeshBasicMaterial({ map: laptopScreenTexture }));
        displayMesh.position.set(0, 0.28, -0.245); displayMesh.rotation.x = -0.3; group.add(displayMesh);
        const kb = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.35), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.3, roughness: 0.8 }));
        kb.position.set(0, 0.025, 0.05); kb.rotation.x = -Math.PI / 2; group.add(kb);
        return group;
    }

    function getPageTitle(page) {
        const t = { dashboard: '> AGENT_DASHBOARD', projects: '> PROJECTS.md', garage: '> GARAGE.glb', agents: '> HERMES.exe', contact: '> CONTACT.json' };
        return t[page] || page;
    }
    function getPageContent(page) {
        const c = {
            dashboard: ['','$ whoami','→ akhil.pillay — sa | kzn | tongaat','','$ hermes --status','● gateway    — running (v2.4.0)','● provider   — openrouter/free','● memory     — 96% (4809/5000)','● cron jobs  — 4 active','','$ ls projects/','→ agenticbiz    [live] 🟢','→ hush-v1       [live] 🟢','→ dirt-hands    [dev]  🟡','→ comfort-shoot [auto] 🟢','','$ runx --specs','→ 140rt | toyota | full black | manual','→ flames: yes (when hot 🔥)'],
            projects: ['','## Active Projects','','[1] AgenticBiz','    AI agent deployment','    → agenticbiz.vercel.app','','[2] Hush v1','    Car social platform (SA)','    → hush-v1.vercel.app','','[3] Dirt Hands Crew','    JDM mobile game','    Godot 4.4+ | Supabase','','[4] Ventrix Petroleum','    Industrial fuel co.','    React + Vite | Parallax'],
            garage: ['','## The Garage','','VEHICLE: Toyota 140rt Runx','COLOR:   Gloss black + metallic','TRANS:   Manual','FUEL:    95 + NOS 😏','','SPECS:','→ Weekly drags: Link Road','→ Strip: King Shaka Airport Rd','→ Flames: YES (on demand 🔥)','','MOD LIST:','→ Full black paint w/ metallic','→ Tinted windows | Lowered','→ Custom exhaust (flame-capable)','','$ status: BORN TO DRAG'],
            agents: ['','## Hermes Agent System','','CAPABILITIES:','• Wix form → WhatsApp pipeline','• XAUUSD trading analysis','• Video production (HyperFrames)','• Client mgmt automation','• Cron-based monitoring','','INFRA:','→ Local: Lenovo IdeaPad 3','  (32GB RAM | RTX 3050)','→ Cloud: Daytona + Orgo','','"Stop thinking in endless manual','implementation. Start thinking in','outcomes, systems, and intelligent','execution."'],
            contact: ['','## Get In Touch','','{','  "name":    "Akhil Pillay",','  "location": "Tongaat, KZN, SA",','  "email":   "akhilpillay2.0@gmail.com",','  "phone":   "067 865 9396",','  "whatsapp": "wa.me/27678659396",','  "youtube":  "youtube.com/@that-it-dude",','  "tiktok":   "tiktok.com/@that_it_.guy",','  "web":      "agenticbiz.vercel.app"','}','','$ ping akhil — response: fast ⚡']
        };
        return c[page] || ['coming soon...'];
    }
    function renderStreamlitDashboard() {
        if (!laptopScreenCanvas) return;
        const ctx = laptopScreenCanvas.getContext('2d');
        const W = laptopScreenCanvas.width, H = laptopScreenCanvas.height;
        ctx.fillStyle = '#0e1117'; ctx.fillRect(0, 0, W, H);
        const sbW = streamlitState.sidebarOpen ? 120 : 0;
        if (streamlitState.sidebarOpen) {
            ctx.fillStyle = '#1a1d27'; ctx.fillRect(0, 0, sbW, H);
            ctx.fillStyle = '#00ccff'; ctx.font = 'bold 11px "JetBrains Mono", monospace'; ctx.fillText('⚡ HERMES', 8, 24);
            ctx.fillStyle = '#666'; ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText('v2.4.0 — free', 8, 38);
            ['dashboard','projects','garage','agents','contact'].forEach((p, i) => {
                const y = 60 + i * 28;
                if (streamlitState.activePage === p) { ctx.fillStyle = 'rgba(0,204,255,0.1)'; ctx.fillRect(0, y-12, sbW, 24); ctx.fillStyle = '#00ccff'; }
                else ctx.fillStyle = '#888';
                ctx.font = '10px "JetBrains Mono", monospace';
                ctx.fillText(['📊','🚀','🏎️','⚡','📬'][i] + ' ' + p, 8, y);
            });
            ctx.fillStyle = '#444'; ctx.font = '8px "JetBrains Mono", monospace'; ctx.fillText('[◀] collapse', 8, H-10);
        } else {
            ctx.fillStyle = '#1a1d27'; ctx.fillRect(0, 0, 24, H);
            ctx.fillStyle = '#00ccff'; ctx.font = '14px monospace'; ctx.fillText('▶', 6, 24);
        }
        const mx = sbW + 12;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px "JetBrains Mono", monospace'; ctx.fillText(getPageTitle(streamlitState.activePage), mx, 30);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx, 40); ctx.lineTo(W-12, 40); ctx.stroke();
        ctx.fillStyle = '#ccc'; ctx.font = '10px "JetBrains Mono", monospace';
        getPageContent(streamlitState.activePage).forEach((line, i) => { ctx.fillText(line, mx, 58 + i * 16); });
        ctx.fillStyle = '#0a0c12'; ctx.fillRect(0, H-20, W, 20);
        ctx.fillStyle = '#00ff88'; ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText('● ONLINE', 8, H-7);
        ctx.fillStyle = '#666'; ctx.fillText('OpenRouter // free tier', sbW+8, H-7);
        if (laptopScreenTexture) laptopScreenTexture.needsUpdate = true;
    }

    // ── Flame System ──
    let flameActive = false;
    let flameParticles = null;
    let flameLight = null;
    const exhaustPos = new THREE.Vector3(0, 0.3, 3.5);
    let flameEmitIndex = 0;

    function createFlameSystem() {
        const count = 60;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const lifetimes = new Float32Array(count);
        for (let i = 0; i < count; i++) { positions[i*3+1] = -1000; lifetimes[i] = 0; }
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

    function emitFlame() {
        if (!flameParticles) return;
        const geo = flameParticles.geometry;
        const pos = geo.attributes.position.array;
        const vel = flameParticles.userData.velocities;
        const life = flameParticles.userData.lifetimes;
        const count = pos.length / 3;
        for (let n = 0; n < 3; n++) {
            const i = flameEmitIndex % count;
            pos[i*3]   = exhaustPos.x + (Math.random()-0.5)*0.15;
            pos[i*3+1] = exhaustPos.y + Math.random()*0.05;
            pos[i*3+2] = exhaustPos.z + (Math.random()-0.5)*0.1 - 0.3;
            vel[i*3]   = (Math.random()-0.5)*0.02;
            vel[i*3+1] = Math.random()*0.06+0.03;
            vel[i*3+2] = -Math.random()*0.08-0.04;
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
            pos[i*3] += vel[i*3]*dt;
            pos[i*3+1] += vel[i*3+1]*dt;
            pos[i*3+2] += vel[i*3+2]*dt;
            vel[i*3+1] *= 0.98;
            if (life[i] <= 0) pos[i*3+1] = -1000;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.lifetime.needsUpdate = true;
        if (flameLight) flameLight.intensity = flameActive ? (3 + Math.sin(performance.now()*0.02)*1.5) : 0;
    }

    setProgress(60, 'Particle systems ready');

    // ── Car Loading ──
    let carModel = null;
    const interactive = signObjects.slice();
    const loader = new GLTFLoader();

    loader.load('assets/models/runx.glb', (gltf) => {
        carModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(carModel);
        const size = new THREE.Vector3(); box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const S = 3.5 / maxDim;
        carModel.scale.setScalar(S);
        const center = new THREE.Vector3(); box.getCenter(center);
        carModel.position.set(-center.x*S, -box.min.y*S, 1.0 - center.z*S);

        let paintCount = 0;
        carModel.traverse(child => {
            if (!child.isMesh) return;
            child.castShadow = true; child.receiveShadow = true;
            const mat = child.material; if (!mat) return;
            const mn = (mat.name || '').toLowerCase();
            if (mn === 'paint1' || mn.includes('paint')) {
                const cb = new THREE.Box3().setFromObject(child);
                const cs = cb.getSize(new THREE.Vector3());
                if (cs.x*cs.y*S > 0.3) { child.material = makeFlakeBlackPaint(envMap); paintCount++; }
            }
            if (mn.includes('chrome') || mn === 'silver_metallic_199') {
                if (mat.color) mat.color.setHex(0xcccccc);
                mat.metalness = 1.0; mat.roughness = 0.05;
                mat.envMap = envMap; mat.envMapIntensity = 2.0; mat.needsUpdate = true;
            }
            if (mn.includes('glass') || mn.includes('translucent')) {
                mat.envMap = envMap; mat.envMapIntensity = 1.5; mat.needsUpdate = true;
            }
        });

        scene.add(carModel);
        interactive.push({ mesh: carModel, data: { label: 'GARAGE', color: 0xff6600 } });

        // Laptop on passenger seat
        const laptop = buildLaptop();
        laptop.position.set(carModel.position.x + 0.45*S, carModel.position.y + 0.55*S, carModel.position.z - 0.3*S);
        laptop.rotation.y = -0.3; laptop.scale.setScalar(0.4); scene.add(laptop);

        exhaustPos.set(carModel.position.x, carModel.position.y + 0.2*S, carModel.position.z - 1.8*S);
        renderStreamlitDashboard();

        setProgress(100, `Car loaded • ${paintCount} panels resprayed 🖤`);
        setTimeout(hideLoad, 600);

        // Debug: add visible info overlay
        var dbg = document.createElement('div');
        dbg.id = 'debug-info';
        dbg.style.cssText = 'position:fixed;top:40px;left:10px;color:#0f0;font-family:monospace;font-size:11px;z-index:999;background:rgba(0,0,0,0.7);padding:8px;border-radius:4px;white-space:pre-line;';
        dbg.textContent = 'Camera: ' + camera.position.x.toFixed(1) + ',' + camera.position.y.toFixed(1) + ',' + camera.position.z.toFixed(1) + '\nCar: ' + carModel.position.x.toFixed(1) + ',' + carModel.position.y.toFixed(1) + ',' + carModel.position.z.toFixed(1) + '\nDist: ' + camera.position.distanceTo(carModel.position).toFixed(1);
        document.body.appendChild(dbg);
    }, (xhr) => {
        if (xhr.total > 0) setProgress(60 + Math.round(xhr.loaded/xhr.total*35), `Loading car: ${Math.round(xhr.loaded/xhr.total*100)}%`);
    }, (err) => {
        console.error('GLB error:', err);
        setProgress(100, 'Car load error');
        setTimeout(hideLoad, 600);
    });

    // ── Gas It Controls ──
    const gasIndicator = $('gas-indicator');
    let gasClickActive = false;

    document.addEventListener('keydown', e => {
        if (e.code === 'Space' && !flameActive) { e.preventDefault(); flameActive = true; gasIndicator.style.color = 'rgba(255,102,0,1)'; }
    });
    document.addEventListener('keyup', e => {
        if (e.code === 'Space') { e.preventDefault(); flameActive = false; gasIndicator.style.color = 'rgba(255,102,0,0)'; }
    });

    // ── Raycaster ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragged = false, pointerDown = { x: 0, y: 0 };

    renderer.domElement.addEventListener('pointerdown', e => { pointerDown = { x: e.clientX, y: e.clientY }; dragged = false; });
    renderer.domElement.addEventListener('pointermove', e => {
        const dx = e.clientX - pointerDown.x, dy = e.clientY - pointerDown.y;
        if (Math.sqrt(dx*dx+dy*dy) > 5) dragged = true;
    });
    renderer.domElement.addEventListener('pointerup', e => {
        if (dragged) return;
        pointer.x = (e.clientX/innerWidth)*2-1; pointer.y = -(e.clientY/innerHeight)*2+1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(interactive.map(i => i.mesh), true);
        if (hits.length) {
            const hit = hits[0].object;
            const item = interactive.find(i => {
                if (i.mesh === hit) return true;
                let p = hit.parent; while (p) { if (i.mesh === p) return true; p = p.parent; } return false;
            });
            if (item) {
                if (item.data.label === 'GARAGE') {
                    gasClickActive = !gasClickActive; flameActive = gasClickActive;
                    gasIndicator.style.color = flameActive ? 'rgba(255,102,0,1)' : 'rgba(255,102,0,0)';
                }
                showDetail(item.data);
            }
        }
    });

    // ── Typewriter ──
    function typewriteText(el, text, speed = 15) {
        el.innerHTML = '';
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) { el.innerHTML = text.substring(0, i+1) + '<span class="cursor"></span>'; i++; }
            else { clearInterval(interval); setTimeout(() => { el.innerHTML = text; }, 800); }
        }, speed);
    }

    // ── Detail Panels ──
    const detailContent = {
        PROJECTS: { title: '🚀 Projects', body: '$ ls -la /home/akhil/projects/\n\nagenticbiz.vercel.app\n→ AI agent deployment for businesses\n→ Next.js 15 | Resend forms\n\nhush-v1.vercel.app\n→ Private car social platform (SA)\n→ React 19 PWA | Real-time chat\n\ndirt-hands-crew (github)\n→ JDM mobile game — Godot 4.4+\n→ Supabase backend | Freemium\n\nventrix-petroleum-2.vercel.app\n→ Industrial fuel company website\n→ React + Vite | Parallax imagery' },
        HUSH: { title: '🏎️ Hush', body: '$ cat /projects/hush/README.md\n\n> "Time to take it off WhatsApp."\n\nPrivate social platform for SA car\nenthusiasts. React 19 PWA.\n\nFeatures:\n• Live Meet Map (real-time)\n• Crews & profiles\n• Event coordination\n• Car culture, not criminals\n\n→ hush-v1.vercel.app' },
        GARAGE: { title: '🔧 The Garage', body: '$ runx --info\n\n140rt Toyota Runx\nColor: Gloss black w/ metallic flake\nTrans: Manual\nFuel: 95 + attitude\n\nExhaust: Flame-capable 🔥\nDrags: Link Road (weekly)\nStrip: King Shaka Airport Rd\n\n> "Where AI agents meet engine oil."' },
        AGENTS: { title: '⚡ Hermes Agent', body: '$ hermes --version && hermes --status\n\nHermes Agent v2.4.0\nProvider: OpenRouter (free tier)\n\nCapabilities:\n• Wix form → WhatsApp pipeline\n• XAUUSD trading analysis\n• Video production (HyperFrames)\n• Client mgmt automation\n• Cron-based monitoring\n\n"I help people stop thinking in\nendless manual implementation\nand start thinking in outcomes,\nsystems, and intelligent execution."' },
        CONTACT: { title: '📬 Get In Touch', body: '$ cat contact.json\n\n{\n  "name":    "Akhil Pillay",\n  "location": "Tongaat, KZN, SA",\n  "email":   "akhilpillay2.0@gmail.com",\n  "phone":   "067 865 9396",\n  "whatsapp": "wa.me/27678659396",\n  "youtube":  "youtube.com/@that-it-dude",\n  "tiktok":   "tiktok.com/@that_it_.guy",\n  "web":      "agenticbiz.vercel.app"\n}\n\n→ Response time: Fast ⚡' }
    };

    function showDetail(data) {
        const content = detailContent[data.label] || { title: data.label, body: 'Coming soon.' };
        $('d-title').textContent = content.title;
        typewriteText($('d-body'), content.body, 15);
        $('detail-overlay').classList.add('show');
        $('info-bar').textContent = data.label;
    }

    window.closeDetail = function() {
        $('detail-overlay').classList.remove('show');
        $('info-bar').textContent = "The Agent's Workshop — click the signs to explore";
    };

    // ── Resize ──
    addEventListener('resize', () => {
        const w = innerWidth, h = innerHeight;
        camera.aspect = w/h; camera.updateProjectionMatrix();
        renderer.setSize(w, h); composer.setSize(w, h);
    });

    // ── Animation Loop ──
    let prevTime = performance.now();
    function animate() {
        requestAnimationFrame(animate);
        const now = performance.now(), dt = (now - prevTime) * 0.001; prevTime = now;
        const t = now * 0.001;
        controls.update();
        plCyan.intensity = 6 + Math.sin(t*1.8)*1.5;
        plPink.intensity = 4 + Math.cos(t*1.5)*1;
        plOrange.intensity = 3 + Math.sin(t*2.2)*0.8;
        plPurple.intensity = 3 + Math.cos(t*1.2)*0.8;
        capMesh.material.emissiveIntensity = 3 + Math.sin(t*2)*0.5;
        if (flameActive) emitFlame();
        updateFlame(dt);
        if (Math.floor(t*2) !== Math.floor((t-dt)*2)) renderStreamlitDashboard();
        composer.render();
    }
    animate();
    setProgress(65, 'Scene complete');
}
