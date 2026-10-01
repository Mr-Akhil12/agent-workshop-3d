/**
 * The Agent's Workshop — finished bay.
 * Poster shot of the black RunX, then walk in: driver door, laptop, rear rev.
 * Car frame is measured from the loaded GLB (RHD — SA RunX), not guessed offsets.
 */
import { THREE } from './three-setup.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createEnvMap, makeFlakeBlackPaint } from './materials.js';

export function start() {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const barEl = $('load-bar');
    const statusEl = $('load-status');
    const infoBar = $('info-bar');
    const gasIndicator = $('gas-indicator');
    const hintEl = $('hint');

    let carReady = false;
    function setProgress(p, msg) {
        if (barEl) barEl.style.width = Math.min(100, p) + '%';
        if (msg && statusEl) statusEl.textContent = msg;
    }
    function hideLoad() {
        const el = $('loading');
        if (el) el.classList.add('hidden');
    }
    function say(text) {
        if (infoBar) infoBar.textContent = text;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080e);
    scene.fog = new THREE.Fog(0x07080e, 18, 42);

    const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.05, 80);
    camera.position.set(4.2, 1.7, 6.2);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.32, 0.4, 0.85);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const envMap = createEnvMap(renderer);
    scene.environment = envMap;
    setProgress(8, 'Lighting the bay');

    scene.add(new THREE.HemisphereLight(0x8aa4c8, 0x1a120c, 0.55));
    scene.add(new THREE.AmbientLight(0x1a1c28, 0.35));

    const keyLight = new THREE.DirectionalLight(0xfff1e0, 1.35);
    keyLight.position.set(6, 8, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 28;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const rim = new THREE.DirectionalLight(0x66ccff, 0.55);
    rim.position.set(-6, 4, -2);
    scene.add(rim);

    const plCyan = new THREE.PointLight(0x00ccff, 8, 14, 2);
    plCyan.position.set(0, 2.6, -3.2);
    scene.add(plCyan);
    const plPink = new THREE.PointLight(0xff0088, 5, 12, 2);
    plPink.position.set(0, 1.8, -3.2);
    scene.add(plPink);
    const bayLightL = new THREE.PointLight(0xfff4dd, 6, 10, 2);
    bayLightL.position.set(-1.6, 3.1, 0.4);
    scene.add(bayLightL);
    const bayLightR = new THREE.PointLight(0xfff4dd, 6, 10, 2);
    bayLightR.position.set(1.6, 3.1, 0.4);
    scene.add(bayLightR);
    const underglow = new THREE.PointLight(0x00aaff, 3.5, 5.5, 2);
    underglow.position.set(0, 0.18, 1);
    scene.add(underglow);

    const noseLight = new THREE.SpotLight(0xfff6ee, 7, 14, 0.7, 0.55, 1);
    noseLight.position.set(2.4, 3.4, 4.2);
    noseLight.target.position.set(0, 0.7, 1);
    noseLight.castShadow = false;
    scene.add(noseLight);
    scene.add(noseLight.target);

    // ── Bay ──
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x1a1c26,
        metalness: 0.55,
        roughness: 0.38,
        envMap,
        envMapIntensity: 0.55,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(40, 40, 0x3a4258, 0x242838);
    grid.position.y = 0.004;
    scene.add(grid);

    function bayLine(x, z, w, d, color) {
        const m = new THREE.Mesh(
            new THREE.PlaneGeometry(w, d),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(x, 0.008, z);
        scene.add(m);
    }
    bayLine(-1.15, 1.1, 0.04, 4.2, 0x00ccff);
    bayLine(1.15, 1.1, 0.04, 4.2, 0x00ccff);
    bayLine(0, -0.95, 2.2, 0.04, 0xffaa00);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x222433, metalness: 0.25, roughness: 0.72 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.6, 0.16), wallMat);
    backWall.position.set(0, 1.8, -4);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.6, 6.2), wallMat);
    leftWall.position.set(-4.05, 1.8, -0.9);
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    const rightWall = leftWall.clone();
    rightWall.position.x = 4.05;
    scene.add(rightWall);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(8.4, 0.08, 6.4),
        new THREE.MeshStandardMaterial({ color: 0x12131c, metalness: 0.4, roughness: 0.6 })
    );
    roof.position.set(0, 3.6, -0.9);
    scene.add(roof);

    function tube(x, z, len, color, intensity) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(len, 0.045, 0.045),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity })
        );
        mesh.position.set(x, 3.42, z);
        scene.add(mesh);
    }
    tube(0, -1.2, 6.4, 0xfff2dd, 2.2);
    tube(0, 0.8, 6.4, 0x88ddff, 1.4);

    function neonSign(text, color, w, h, y) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 1024, 256);
        ctx.shadowColor = color;
        ctx.shadowBlur = 28;
        ctx.fillStyle = color;
        ctx.font = 'bold 120px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 512, 128);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );
        mesh.position.set(0, y, -3.9);
        scene.add(mesh);
        const frame = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.18, h + 0.12)),
            new THREE.LineBasicMaterial({ color })
        );
        frame.position.copy(mesh.position);
        frame.position.z += 0.01;
        scene.add(frame);
    }
    neonSign('AGENTIC BIZ', '#7af6ff', 3.4, 0.72, 2.85);
    neonSign('HERMES', '#ff4d9a', 2.2, 0.42, 2.15);

    // Tool wall — reads as a workshop, not an empty box
    const toolMat = new THREE.MeshStandardMaterial({ color: 0x3a3e4e, metalness: 0.7, roughness: 0.35 });
    [[-2.6, 1.5, 0.55, 0.08, 0.9], [-2.2, 1.7, 0.08, 0.5, 0.08], [-3.1, 1.2, 0.35, 0.08, 0.35]].forEach((t) => {
        const tool = new THREE.Mesh(new THREE.BoxGeometry(t[2], t[3], t[4]), toolMat);
        tool.position.set(t[0], t[1], -3.88);
        scene.add(tool);
    });

    // City behind the bay, with window lights so the skyline isn't a black wall
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x12141e, metalness: 0.15, roughness: 0.8 });
    const buildings = [
        [-10, -16, 2.4, 9, 2], [-6, -18, 1.8, 13, 1.6], [-2, -15, 2.6, 7, 2],
        [2, -17, 2, 11, 1.8], [6, -16, 2.4, 8, 2], [10, -19, 1.6, 15, 1.6],
        [13, -15, 2.8, 6.5, 2.2], [-13, -18, 2, 10, 2],
    ];
    const winGeo = new THREE.BoxGeometry(0.12, 0.16, 0.04);
    const winMats = [
        new THREE.MeshBasicMaterial({ color: 0xffe1a8 }),
        new THREE.MeshBasicMaterial({ color: 0x9fd7ff }),
        new THREE.MeshBasicMaterial({ color: 0xff8fb8 }),
    ];
    buildings.forEach((b, i) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(b[2], b[3], b[4]), bldgMat);
        mesh.position.set(b[0], b[3] / 2, b[1]);
        scene.add(mesh);
        const cols = 3;
        const rows = Math.max(3, Math.floor(b[3] / 1.4));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r * 3 + c + i) % 3 === 0) continue;
                const w = new THREE.Mesh(winGeo, winMats[(r + c + i) % 3]);
                w.position.set(
                    b[0] - b[2] * 0.28 + c * b[2] * 0.28,
                    0.8 + r * 1.15,
                    b[1] + b[4] * 0.5 + 0.02
                );
                scene.add(w);
            }
        }
    });
    setProgress(28, 'Bay built');

    // ── Character: hooded figure, not a light bomb ──
    const character = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: 0x1c1e28, roughness: 0.75, metalness: 0.08 });
    const visorMat = new THREE.MeshStandardMaterial({
        color: 0x071018, emissive: 0x00ccff, emissiveIntensity: 1.6, roughness: 0.2, metalness: 0.4,
    });
    const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 4, 8), cloth);
    legs.position.y = 0.38;
    character.add(legs);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.38, 4, 8), cloth);
    torso.position.y = 0.95;
    character.add(torso);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), cloth);
    hood.position.y = 1.38;
    character.add(hood);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.04), visorMat);
    visor.position.set(0, 1.36, 0.13);
    character.add(visor);
    character.position.set(1.7, 0, 2.4);
    character.visible = false;
    scene.add(character);

    const moveState = { forward: false, backward: false, left: false, right: false };
    const speed = 2.7;

    // ── Interaction markers (placed once the car frame is known) ──
    const markers = [];
    function makeRing(color) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.38, 0.48, 32),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        scene.add(ring);
        return ring;
    }
    function makeTag(text, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.font = 'bold 64px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        sprite.scale.set(1.35, 0.34, 1);
        scene.add(sprite);
        return sprite;
    }

    // ── Laptop mesh, placed on the bench after the car loads ──
    let laptop = null;
    let laptopScreenTexture = null;
    function buildLaptop() {
        const group = new THREE.Group();
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(0.62, 0.028, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85, roughness: 0.25 })
        );
        group.add(base);
        const lid = new THREE.Mesh(
            new THREE.BoxGeometry(0.62, 0.4, 0.018),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.18 })
        );
        lid.position.set(0, 0.22, -0.19);
        lid.rotation.x = -0.22;
        group.add(lid);
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0e1117';
        ctx.fillRect(0, 0, 512, 320);
        ctx.fillStyle = '#00ccff';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('HERMES', 24, 48);
        ctx.fillStyle = '#e8e8e8';
        ctx.font = '16px monospace';
        ctx.fillText('akhil pillay', 24, 90);
        ctx.fillStyle = '#8b93a7';
        ctx.fillText('press E  —  open', 24, 124);
        laptopScreenTexture = new THREE.CanvasTexture(canvas);
        laptopScreenTexture.colorSpace = THREE.SRGBColorSpace;
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(0.56, 0.32),
            new THREE.MeshBasicMaterial({ map: laptopScreenTexture })
        );
        screen.position.set(0, 0.23, -0.175);
        screen.rotation.x = -0.22;
        group.add(screen);
        return group;
    }

    const bench = new THREE.Group();
    const benchTop = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.06, 0.55),
        new THREE.MeshStandardMaterial({ color: 0x2a241c, roughness: 0.65, metalness: 0.15 })
    );
    benchTop.position.y = 0.78;
    benchTop.castShadow = true;
    benchTop.receiveShadow = true;
    bench.add(benchTop);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.4 });
    [[-0.45, -0.2], [0.45, -0.2], [-0.45, 0.2], [0.45, 0.2]].forEach((p) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.78, 0.05), legMat);
        leg.position.set(p[0], 0.39, p[1]);
        bench.add(leg);
    });
    bench.visible = false;
    scene.add(bench);

    // ── Car ──
    let carModel = null;
    let frame = null;
    const loader = new GLTFLoader();

    function measureFrame(root) {
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const frontPts = [];
        root.traverse((obj) => {
            const name = (obj.name || '').toLowerCase();
            if (!name.includes('front-gla')) return;
            const b = new THREE.Box3().setFromObject(obj);
            if (b.isEmpty()) return;
            frontPts.push(b.getCenter(new THREE.Vector3()));
        });
        const forward = new THREE.Vector3(0, 0, 1);
        if (frontPts.length) {
            const front = frontPts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / frontPts.length);
            forward.copy(front).sub(center);
        }
        forward.y = 0;
        if (forward.lengthSq() < 1e-6) forward.set(0, 0, 1);
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
        const halfW = size.x * 0.5;
        const halfL = Math.max(size.x, size.z) * 0.5;
        // Length is the axis along forward. size.z is world Z, which matches this model, but
        // project the box so a rotated import still gets door/exhaust spacing right.
        const length = Math.abs(size.dot(new THREE.Vector3(Math.abs(forward.x), 0, Math.abs(forward.z)))) || size.z;
        const width = Math.abs(size.dot(new THREE.Vector3(Math.abs(right.x), 0, Math.abs(right.z)))) || size.x;

        const driverStand = center.clone().addScaledVector(right, width * 0.5 + 0.85);
        driverStand.y = 0;
        const passengerStand = center.clone().addScaledVector(right, -(width * 0.5 + 1.15));
        passengerStand.y = 0;
        const rearStand = center.clone().addScaledVector(forward, -(length * 0.5 + 0.9));
        rearStand.y = 0;

        const driverEye = center.clone()
            .addScaledVector(right, width * 0.18)
            .addScaledVector(forward, length * 0.02);
        driverEye.y = box.min.y + size.y * 0.62;

        const exhaust = center.clone()
            .addScaledVector(forward, -(length * 0.48))
            .addScaledVector(right, width * 0.22);
        exhaust.y = box.min.y + size.y * 0.1;

        return {
            box, center, size, forward, right, length, width, halfW, halfL,
            driverStand, passengerStand, rearStand, driverEye, exhaust,
        };
    }

    function placeWorld() {
        frame = measureFrame(carModel);

        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(1, 40),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false })
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.copy(frame.center);
        shadow.position.y = 0.01;
        shadow.scale.set(frame.width * 0.55, frame.length * 0.42, 1);
        scene.add(shadow);

        underglow.position.set(frame.center.x, 0.16, frame.center.z);
        noseLight.position.copy(frame.center).addScaledVector(frame.forward, frame.length * 0.55).addScaledVector(frame.right, frame.width * 1.15);
        noseLight.position.y = 3.4;
        noseLight.target.position.copy(frame.center);
        noseLight.target.position.y = 0.65;

        // Lit mouth of the bay, ahead of the nose, so the driver seat has a view.
        const mouth = frame.center.clone().addScaledVector(frame.forward, frame.length * 0.5 + 3.4);
        mouth.y = 0;
        const mouthMat = new THREE.MeshStandardMaterial({
            color: 0x7af6ff, emissive: 0x00ccff, emissiveIntensity: 2.2, roughness: 0.4,
        });
        const span = 4.4;
        const postH = 2.7;
        [-1, 1].forEach((side) => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, postH, 0.07), mouthMat);
            post.position.copy(mouth).addScaledVector(frame.right, side * span * 0.5);
            post.position.y = postH / 2;
            scene.add(post);
        });
        const header = new THREE.Mesh(new THREE.BoxGeometry(span, 0.07, 0.07), mouthMat);
        header.position.copy(mouth);
        header.position.y = postH;
        header.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), frame.right.clone().normalize());
        scene.add(header);
        const apron = new THREE.PointLight(0x9fd7ff, 5, 12, 2);
        apron.position.copy(mouth).addScaledVector(frame.forward, -1.6);
        apron.position.y = 1.1;
        scene.add(apron);

        const zones = [
            { id: 'driver', label: 'DRIVER', color: 0x00ccff, pos: frame.driverStand, action: 'enter', prompt: 'E  —  sit in the RunX' },
            { id: 'laptop', label: 'LAPTOP', color: 0xff4d9a, pos: frame.passengerStand, action: 'laptop', prompt: 'E  —  open the laptop' },
            { id: 'rev', label: 'REV', color: 0xff6600, pos: frame.rearStand, action: 'rev', prompt: 'SPACE  —  rev it' },
        ];
        zones.forEach((z) => {
            const ring = makeRing(z.color);
            ring.position.x = z.pos.x;
            ring.position.z = z.pos.z;
            const tag = makeTag(z.label, '#' + z.color.toString(16).padStart(6, '0'));
            tag.position.set(z.pos.x, 1.15, z.pos.z);
            markers.push({ ...z, ring, tag });
        });

        bench.position.copy(frame.passengerStand);
        bench.position.y = 0;
        bench.lookAt(frame.center.x, 0, frame.center.z);
        bench.visible = true;

        laptop = buildLaptop();
        laptop.position.set(0, 0.84, 0);
        laptop.rotation.y = Math.PI;
        bench.add(laptop);

        character.position.copy(frame.driverStand);
        character.position.x += frame.right.x * 0.15;
        character.position.z += frame.right.z * 0.15;
        character.lookAt(frame.center.x, 0, frame.center.z);

        const hero = frame.center.clone()
            .addScaledVector(frame.forward, frame.length * 0.95)
            .addScaledVector(frame.right, frame.width * 0.7);
        hero.y = 1.55;
        camera.position.copy(hero);
        showcase.focus.copy(frame.center);
        showcase.focus.y = 0.72;
        showcase.theta = Math.atan2(hero.x - showcase.focus.x, hero.z - showcase.focus.z);
        showcase.dist = hero.distanceTo(showcase.focus);
        showcase.phi = 0.22;
        applyShowcase();
    }

    loader.load('assets/models/runx.glb', (gltf) => {
        try {
            carModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(carModel);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const S = 3.5 / maxDim;
            carModel.scale.setScalar(S);
            const center = new THREE.Vector3();
            box.getCenter(center);
            carModel.position.set(-center.x * S, -box.min.y * S, 1.0 - center.z * S);

            let paintCount = 0;
            carModel.traverse((child) => {
                if (!child.isMesh || !child.material) return;
                child.castShadow = true;
                child.receiveShadow = true;
                const mn = (child.material.name || '').toLowerCase();
                if (mn === 'paint1' || mn.includes('paint')) {
                    const cb = new THREE.Box3().setFromObject(child);
                    const cs = cb.getSize(new THREE.Vector3());
                    if (cs.x * cs.y * S > 0.3) {
                        child.material = makeFlakeBlackPaint(envMap);
                        paintCount++;
                    }
                } else if (mn.includes('chrome') || mn.includes('silver') || mn.includes('rim')) {
                    child.material.metalness = 1;
                    child.material.roughness = 0.08;
                    child.material.envMap = envMap;
                    child.material.envMapIntensity = 1.6;
                    if (child.material.color) child.material.color.setHex(0xdddddd);
                    child.material.needsUpdate = true;
                } else if (mn.includes('glass') || mn.includes('translucent')) {
                    child.material.envMap = envMap;
                    child.material.envMapIntensity = 1.2;
                    child.material.needsUpdate = true;
                } else if (mn.includes('light')) {
                    child.material.emissive = new THREE.Color(0xff7722);
                    child.material.emissiveIntensity = 1.4;
                    child.material.needsUpdate = true;
                }
            });

            scene.add(carModel);
            placeWorld();
            carReady = true;
            setProgress(100, 'RunX in the bay');
            say('Drag to orbit  ·  WASD to walk in  ·  E opens the laptop');
            setTimeout(hideLoad, 400);
            console.log('CAR FRAME', {
                center: frame.center.toArray().map((n) => +n.toFixed(2)),
                forward: frame.forward.toArray().map((n) => +n.toFixed(2)),
                paintCount,
            });
        } catch (err) {
            console.error(err);
            setProgress(100, 'Car failed to place');
            hideLoad();
        }
    }, (xhr) => {
        if (xhr.total) setProgress(30 + Math.round((xhr.loaded / xhr.total) * 60), 'Loading the RunX');
    }, (err) => {
        console.error(err);
        setProgress(100, 'Car model missing');
        hideLoad();
    });

    setTimeout(() => {
        if (!carReady) {
            setProgress(100, 'Still waiting on the car');
            hideLoad();
        }
    }, 12000);

    // ── Flames ──
    let flameActive = false;
    const flameCount = 80;
    const flameGeo = new THREE.BufferGeometry();
    const flamePos = new Float32Array(flameCount * 3);
    const flameVel = new Float32Array(flameCount * 3);
    const flameLife = new Float32Array(flameCount);
    for (let i = 0; i < flameCount; i++) flamePos[i * 3 + 1] = -100;
    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
    const flames = new THREE.Points(
        flameGeo,
        new THREE.PointsMaterial({
            color: 0xff6a00, size: 0.22, transparent: true, opacity: 0.9,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        })
    );
    scene.add(flames);
    const flameLight = new THREE.PointLight(0xff4400, 0, 6, 2);
    scene.add(flameLight);
    let flameCursor = 0;

    function emitFlame() {
        if (!frame) return;
        for (let n = 0; n < 4; n++) {
            const i = flameCursor % flameCount;
            flameCursor++;
            flamePos[i * 3] = frame.exhaust.x + (Math.random() - 0.5) * 0.08;
            flamePos[i * 3 + 1] = frame.exhaust.y + Math.random() * 0.04;
            flamePos[i * 3 + 2] = frame.exhaust.z + (Math.random() - 0.5) * 0.08;
            const back = frame.forward.clone().multiplyScalar(-(0.9 + Math.random() * 1.4));
            flameVel[i * 3] = back.x + (Math.random() - 0.5) * 0.3;
            flameVel[i * 3 + 1] = 0.4 + Math.random() * 0.8;
            flameVel[i * 3 + 2] = back.z + (Math.random() - 0.5) * 0.3;
            flameLife[i] = 1;
        }
        flameGeo.attributes.position.needsUpdate = true;
    }
    function updateFlame(dt) {
        for (let i = 0; i < flameCount; i++) {
            if (flameLife[i] <= 0) continue;
            flameLife[i] -= dt * 1.8;
            flamePos[i * 3] += flameVel[i * 3] * dt;
            flamePos[i * 3 + 1] += flameVel[i * 3 + 1] * dt;
            flamePos[i * 3 + 2] += flameVel[i * 3 + 2] * dt;
            if (flameLife[i] <= 0) flamePos[i * 3 + 1] = -100;
        }
        flameGeo.attributes.position.needsUpdate = true;
        flameLight.intensity = flameActive ? 6 + Math.sin(performance.now() * 0.03) * 2 : 0;
        if (frame && flameActive) flameLight.position.copy(frame.exhaust);
        if (gasIndicator) gasIndicator.style.color = flameActive ? 'rgba(255,120,40,0.95)' : 'rgba(255,102,0,0)';
    }
    function toggleFlame() {
        flameActive = !flameActive;
    }

    // ── Modes ──
    // showcase: poster orbit. walk: follow cam. driving: cabin.
    let mode = 'showcase';
    const showcase = {
        focus: new THREE.Vector3(0, 0.7, 1),
        theta: 0.6,
        phi: 0.28,
        dist: 6.2,
    };
    let camYaw = 0.4;
    let camDist = 4.2;
    let dragging = false;
    let dragMoved = false;
    let lastX = 0;
    let lastY = 0;
    const entry = {
        active: false, t: 0, dur: 0.85,
        from: new THREE.Vector3(), to: new THREE.Vector3(),
        fromLook: new THREE.Vector3(), toLook: new THREE.Vector3(),
    };
    let fpYaw = 0;
    let fpPitch = -0.04;
    let pointerLocked = false;

    function applyShowcase() {
        const h = Math.cos(showcase.phi) * showcase.dist;
        camera.position.set(
            showcase.focus.x + Math.sin(showcase.theta) * h,
            showcase.focus.y + Math.sin(showcase.phi) * showcase.dist,
            showcase.focus.z + Math.cos(showcase.theta) * h
        );
        camera.lookAt(showcase.focus);
    }

    function nearestZone() {
        if (!frame || mode !== 'walk') return null;
        let best = null;
        let bestD = 1.35;
        markers.forEach((z) => {
            const dx = character.position.x - z.pos.x;
            const dz = character.position.z - z.pos.z;
            const d = Math.hypot(dx, dz);
            if (d < bestD) { bestD = d; best = z; }
        });
        return best;
    }

    function enterCar() {
        if (!frame || mode !== 'walk') return;
        mode = 'entering';
        entry.active = true;
        entry.t = 0;
        entry.from.copy(camera.position);
        entry.fromLook.copy(character.position);
        entry.fromLook.y = 1.2;
        entry.to.copy(frame.driverEye);
        entry.toLook.copy(frame.driverEye).addScaledVector(frame.forward, 4);
        character.visible = false;
        say('Getting in…');
    }
    function finishEnter() {
        mode = 'driving';
        fpYaw = Math.atan2(frame.forward.x, frame.forward.z);
        fpPitch = -0.06;
        noseLight.intensity = 0;
        say('In the seat  ·  click to look  ·  SPACE rev  ·  E to get out');
        renderer.domElement.requestPointerLock?.();
    }
    function exitCar() {
        if (mode !== 'driving' || !frame) return;
        if (pointerLocked) document.exitPointerLock();
        mode = 'exiting';
        entry.active = true;
        entry.t = 0;
        entry.from.copy(camera.position);
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        entry.fromLook.copy(camera.position).add(dir);
        character.position.copy(frame.driverStand);
        character.visible = true;
        entry.to.copy(frame.driverStand).add(new THREE.Vector3(0, 1.6, 0)).addScaledVector(frame.right, 1.6);
        entry.toLook.copy(frame.center);
        entry.toLook.y = 0.8;
        say('Stepping out…');
    }
    function finishExit() {
        mode = 'walk';
        const back = frame.driverStand.clone().sub(frame.center);
        back.y = 0;
        camYaw = Math.atan2(back.x, back.z);
        noseLight.intensity = 7;
        say('WASD  ·  rings on the floor are the doors');
    }

    function openLaptop() {
        fsOverlay.style.display = 'flex';
        renderFsPage();
    }
    function closeLaptop() {
        fsOverlay.style.display = 'none';
    }

    function interact() {
        if (mode === 'showcase') {
            openLaptop();
            return;
        }
        if (mode === 'driving') {
            exitCar();
            return;
        }
        const zone = nearestZone();
        if (!zone) {
            say('Walk to a ring  —  driver door, laptop bench, or the rear');
            return;
        }
        if (zone.action === 'enter') enterCar();
        else if (zone.action === 'laptop') openLaptop();
        else if (zone.action === 'rev') toggleFlame();
    }

    function pushOutOfCar() {
        if (!frame) return;
        const rel = character.position.clone().sub(frame.center);
        const along = rel.dot(frame.forward);
        const side = rel.dot(frame.right);
        const halfL = frame.length * 0.5 + 0.28;
        const halfW = frame.width * 0.5 + 0.28;
        if (Math.abs(along) < halfL && Math.abs(side) < halfW) {
            const outL = halfL - Math.abs(along);
            const outW = halfW - Math.abs(side);
            if (outW < outL) character.position.addScaledVector(frame.right, Math.sign(side || 1) * (outW + 0.02));
            else character.position.addScaledVector(frame.forward, Math.sign(along || 1) * (outL + 0.02));
        }
        character.position.x = Math.max(-3.7, Math.min(3.7, character.position.x));
        character.position.z = Math.max(-3.3, Math.min(6.4, character.position.z));
        character.position.y = 0;
    }

    // ── Laptop overlay (real links, not painted text) ──
    const fsOverlay = document.createElement('div');
    fsOverlay.id = 'fs-laptop-overlay';
    fsOverlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:300;background:rgba(4,6,12,0.9);backdrop-filter:blur(16px);justify-content:center;align-items:center;padding:24px;';
    document.body.appendChild(fsOverlay);

    const fsFrame = document.createElement('div');
    fsFrame.style.cssText = 'width:min(920px,94vw);height:min(640px,86vh);background:#0e1117;border:1px solid rgba(255,255,255,0.08);border-radius:14px;display:flex;flex-direction:column;overflow:hidden;position:relative;';
    fsOverlay.appendChild(fsFrame);

    const titleBar = document.createElement('div');
    titleBar.style.cssText = 'height:40px;background:#161922;display:flex;align-items:center;gap:8px;padding:0 14px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;';
    titleBar.innerHTML = '<span style="width:11px;height:11px;border-radius:50%;background:#ff5f57"></span><span style="width:11px;height:11px;border-radius:50%;background:#febc2e"></span><span style="width:11px;height:11px;border-radius:50%;background:#28c840"></span><span style="margin-left:10px;color:rgba(255,255,255,0.45);font-family:JetBrains Mono,monospace;font-size:12px">agent@workshop — akhil pillay</span>';
    fsFrame.appendChild(titleBar);

    const fsClose = document.createElement('button');
    fsClose.textContent = '✕';
    fsClose.setAttribute('aria-label', 'Close laptop');
    fsClose.style.cssText = 'position:absolute;top:6px;right:10px;width:28px;height:28px;border:none;border-radius:6px;background:rgba(255,255,255,0.06);color:#aaa;cursor:pointer;';
    fsClose.onclick = closeLaptop;
    fsFrame.appendChild(fsClose);

    const body = document.createElement('div');
    body.style.cssText = 'flex:1;display:flex;min-height:0;';
    fsFrame.appendChild(body);

    const side = document.createElement('nav');
    side.style.cssText = 'width:168px;background:#141824;border-right:1px solid rgba(255,255,255,0.06);padding:12px 0;flex-shrink:0;';
    body.appendChild(side);

    const pageHost = document.createElement('div');
    pageHost.style.cssText = 'flex:1;overflow:auto;padding:22px 26px 28px;font-family:JetBrains Mono,monospace;color:#d5d8e0;font-size:13px;line-height:1.65;';
    body.appendChild(pageHost);

    const link = (href, label) => `<a href="${href}" target="_blank" rel="noopener" style="color:#7af6ff;text-decoration:none;border-bottom:1px solid rgba(122,246,255,0.35)">${label}</a>`;
    const pages = {
        now: {
            label: 'Now',
            html: `
                <h2 style="margin:0 0 12px;font-size:18px;color:#fff">Akhil Pillay</h2>
                <p>Lead Web &amp; App Dev at Comfort Shooting. Ballito / Tongaat, KZN.</p>
                <p>I build the systems, then I try to take myself out of the loop. This bay is the workshop those systems live next to — the black RunX included.</p>
                <p>${link('https://akhil-devs-portfolio.vercel.app', 'Portfolio')}<br>
                ${link('https://github.com/Mr-Akhil12', 'GitHub — Mr-Akhil12')}<br>
                ${link('https://www.agenticbiz.co.za/', 'AgenticBiz')}<br>
                ${link('https://hush-v1.vercel.app', 'Hush')}</p>`,
        },
        projects: {
            label: 'Projects',
            html: `
                <h2 style="margin:0 0 12px;font-size:18px;color:#fff">Shipped</h2>
                <p><b style="color:#fff">Hush</b> — SA car social. ${link('https://hush-v1.vercel.app', 'hush-v1.vercel.app')}</p>
                <p><b style="color:#fff">AgenticBiz</b> — agentic systems, in public. ${link('https://www.agenticbiz.co.za/', 'agenticbiz.co.za')}</p>
                <p><b style="color:#fff">Comfort Shooting</b> — day job. Systems, portals, the unglamorous things that have to stay up.</p>
                <p><b style="color:#fff">This bay</b> — the 3D workshop. Walk it. Sit in the car. The model is not mine; credit is on the floor of the page.</p>`,
        },
        garage: {
            label: 'Garage',
            html: `
                <h2 style="margin:0 0 12px;font-size:18px;color:#fff">140rt RunX</h2>
                <p>Toyota RunX. Gloss black. Manual. Flames when it is asked.</p>
                <p>Right-hand drive — driver door is the right-hand ring. Rear ring revs it. Passenger side is the bench, not a seat you have to clip through.</p>
                <p>Model: 2001 Toyota Corolla RunX by ${link('https://sketchfab.com/outpiston', 'OUTPISTON')}, ${link('https://creativecommons.org/licenses/by-nc-sa/4.0/', 'CC BY-NC-SA 4.0')}.</p>`,
        },
        contact: {
            label: 'Contact',
            html: `
                <h2 style="margin:0 0 12px;font-size:18px;color:#fff">Contact</h2>
                <p>${link('mailto:akhilpillay2.0@gmail.com', 'akhilpillay2.0@gmail.com')}<br>
                ${link('https://wa.me/27678659396', 'WhatsApp +27 67 865 9396')}<br>
                ${link('https://youtube.com/@that-it-dude', 'YouTube @that-it-dude')}<br>
                ${link('https://www.tiktok.com/@that_it_dude', 'TikTok @that_it_dude')}<br>
                ${link('https://github.com/Mr-Akhil12', 'github.com/Mr-Akhil12')}</p>
                <p style="color:#8b93a7">Ballito, KwaZulu-Natal.</p>`,
        },
    };
    let activePage = 'now';
    const navBtns = {};
    Object.entries(pages).forEach(([id, page]) => {
        const btn = document.createElement('button');
        btn.textContent = page.label;
        btn.style.cssText = 'display:block;width:100%;text-align:left;background:transparent;border:none;border-left:3px solid transparent;color:#8b93a7;font-family:JetBrains Mono,monospace;font-size:12px;padding:10px 14px;cursor:pointer;';
        btn.onclick = () => { activePage = id; renderFsPage(); };
        side.appendChild(btn);
        navBtns[id] = btn;
    });
    function renderFsPage() {
        Object.entries(navBtns).forEach(([id, btn]) => {
            const on = id === activePage;
            btn.style.color = on ? '#7af6ff' : '#8b93a7';
            btn.style.borderLeftColor = on ? '#7af6ff' : 'transparent';
            btn.style.background = on ? 'rgba(122,246,255,0.06)' : 'transparent';
        });
        pageHost.innerHTML = pages[activePage].html;
    }
    fsOverlay.addEventListener('click', (e) => { if (e.target === fsOverlay) closeLaptop(); });

    // ── Input ──
    addEventListener('keydown', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.forward = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.backward = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.right = true;
        const walkingKey = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
        if (walkingKey && mode === 'showcase' && carReady) {
            mode = 'walk';
            character.visible = true;
            if (frame) {
                const back = character.position.clone().sub(frame.center);
                back.y = 0;
                camYaw = Math.atan2(back.x, back.z);
            }
            say('WASD  ·  rings on the floor are the doors');
        }
        if (e.code === 'KeyE') {
            if (fsOverlay.style.display === 'flex') closeLaptop();
            else interact();
        }
        if (e.code === 'Space') {
            e.preventDefault();
            if (mode === 'driving' || mode === 'showcase' || (mode === 'walk' && nearestZone()?.action === 'rev')) toggleFlame();
        }
        if (e.code === 'Escape') closeLaptop();
    });
    addEventListener('keyup', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.forward = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.backward = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.right = false;
    });

    renderer.domElement.addEventListener('pointerdown', (e) => {
        dragging = true;
        dragMoved = false;
        lastX = e.clientX;
        lastY = e.clientY;
    });
    addEventListener('pointermove', (e) => {
        if (!dragging || mode === 'driving') return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.hypot(dx, dy) > 3) dragMoved = true;
        lastX = e.clientX;
        lastY = e.clientY;
        if (mode === 'showcase') {
            showcase.theta -= dx * 0.005;
            showcase.phi = Math.max(0.08, Math.min(1.05, showcase.phi + dy * 0.004));
        } else if (mode === 'walk') {
            camYaw -= dx * 0.005;
        }
    });
    addEventListener('pointerup', () => { dragging = false; });
    renderer.domElement.addEventListener('pointerup', (e) => {
        if (dragMoved) return;
        if (mode === 'driving' && !pointerLocked) {
            renderer.domElement.requestPointerLock?.();
            return;
        }
        if (mode === 'walk') interact();
    });
    renderer.domElement.addEventListener('wheel', (e) => {
        if (mode !== 'showcase') return;
        showcase.dist = Math.max(3.2, Math.min(9, showcase.dist + Math.sign(e.deltaY) * 0.35));
    }, { passive: true });

    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === renderer.domElement;
    });
    document.addEventListener('mousemove', (e) => {
        if (!pointerLocked || mode !== 'driving') return;
        fpYaw -= e.movementX * 0.0025;
        fpPitch -= e.movementY * 0.0022;
        fpPitch = Math.max(-0.6, Math.min(0.45, fpPitch));
    });

    const btnGas = $('btn-gas');
    const btnLaptop = $('btn-laptop');
    if (btnGas) {
        const fire = (e) => { e.preventDefault(); toggleFlame(); };
        btnGas.addEventListener('click', fire);
        btnGas.addEventListener('touchstart', fire, { passive: false });
    }
    if (btnLaptop) {
        const open = (e) => { e.preventDefault(); openLaptop(); };
        btnLaptop.addEventListener('click', open);
        btnLaptop.addEventListener('touchstart', open, { passive: false });
    }

    const joystickZone = $('joystick-zone');
    const joystickKnob = $('joystick-knob');
    if (joystickZone && joystickKnob) {
        let joy = false;
        let joyStart = { x: 0, y: 0 };
        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joy = true;
            const t = e.touches[0];
            joyStart = { x: t.clientX, y: t.clientY };
            if (mode === 'showcase' && carReady) {
                mode = 'walk';
                character.visible = true;
            }
        }, { passive: false });
        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!joy) return;
            const t = e.touches[0];
            let dx = t.clientX - joyStart.x;
            let dy = t.clientY - joyStart.y;
            const dist = Math.hypot(dx, dy);
            const max = 30;
            if (dist > max) { dx = dx / dist * max; dy = dy / dist * max; }
            joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            moveState.forward = dy < -10;
            moveState.backward = dy > 10;
            moveState.left = dx < -10;
            moveState.right = dx > 10;
        }, { passive: false });
        joystickZone.addEventListener('touchend', () => {
            joy = false;
            moveState.forward = moveState.backward = moveState.left = moveState.right = false;
            joystickKnob.style.transform = 'translate(-50%, -50%)';
        });
    }

    addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        composer.setSize(innerWidth, innerHeight);
    });

    if (hintEl) hintEl.textContent = 'Drag to orbit  ·  WASD to walk in  ·  E interact  ·  SPACE rev';

    // ── Loop ──
    let prev = performance.now();
    function animate() {
        requestAnimationFrame(animate);
        const now = performance.now();
        const dt = Math.min((now - prev) * 0.001, 0.05);
        prev = now;
        const t = now * 0.001;

        if (entry.active) {
            entry.t += dt / entry.dur;
            const a = Math.min(1, entry.t);
            const e = 1 - Math.pow(1 - a, 3);
            camera.position.lerpVectors(entry.from, entry.to, e);
            camera.lookAt(new THREE.Vector3().lerpVectors(entry.fromLook, entry.toLook, e));
            if (a >= 1) {
                entry.active = false;
                if (mode === 'entering') finishEnter();
                else if (mode === 'exiting') finishExit();
            }
        } else if (mode === 'showcase') {
            applyShowcase();
        } else if (mode === 'walk') {
            const wish = new THREE.Vector3();
            const look = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
            const strafe = new THREE.Vector3(look.z, 0, -look.x);
            if (moveState.forward) wish.add(look);
            if (moveState.backward) wish.sub(look);
            if (moveState.right) wish.add(strafe);
            if (moveState.left) wish.sub(strafe);
            if (wish.lengthSq() > 0) {
                wish.normalize();
                character.position.addScaledVector(wish, speed * dt);
                pushOutOfCar();
                character.rotation.y = Math.atan2(wish.x, wish.z);
            }
            const head = character.position.clone();
            head.y = 1.25;
            const ideal = head.clone();
            ideal.x += Math.sin(camYaw) * camDist;
            ideal.z += Math.cos(camYaw) * camDist;
            ideal.y = 1.7;
            camera.position.lerp(ideal, 1 - Math.exp(-7 * dt));
            camera.lookAt(head);
            const zone = nearestZone();
            say(zone ? zone.prompt : 'WASD  ·  cyan driver  ·  pink laptop  ·  orange rev');
        } else if (mode === 'driving' && frame) {
            const bob = Math.sin(t * 11) * 0.004;
            camera.position.copy(frame.driverEye);
            camera.position.y += bob;
            if (flameActive) {
                camera.position.x += (Math.random() - 0.5) * 0.01;
                camera.position.y += (Math.random() - 0.5) * 0.006;
            }
            const look = new THREE.Vector3(
                Math.sin(fpYaw) * Math.cos(fpPitch),
                Math.sin(fpPitch),
                Math.cos(fpYaw) * Math.cos(fpPitch)
            );
            camera.lookAt(camera.position.clone().add(look));
        }

        markers.forEach((z) => {
            const pulse = 0.9 + Math.sin(t * 3 + z.pos.x) * 0.08;
            z.ring.scale.setScalar(pulse);
            const hot = mode === 'walk' && nearestZone() === z;
            z.ring.material.opacity = hot ? 1 : 0.45;
            z.tag.position.y = 1.12 + Math.sin(t * 2 + z.pos.z) * 0.04;
        });

        plCyan.intensity = 7 + Math.sin(t * 1.6) * 1.2;
        plPink.intensity = 4.5 + Math.cos(t * 1.3) * 0.8;
        if (flameActive) emitFlame();
        updateFlame(dt);
        composer.render();
    }
    animate();
    setProgress(40, 'Waiting on the RunX');
}
