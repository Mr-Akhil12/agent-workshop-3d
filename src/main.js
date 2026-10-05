/**
 * v2 — daylight Tongaat driveway. Only the RunX mesh is kept from v1.
 * First person is the default. V switches to third. Houses stop the camera;
 * there is no garage box to clip through.
 */
import { THREE } from './three-setup.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { makeFlakeBlackPaint } from './materials.js';
import { buildYard, createDayEnv } from './environment.js';
import { buildCity } from './city.js';
import { buildCivic } from './civic.js';

export function start() {
    const $ = (id) => document.getElementById(id);
    const barEl = $('load-bar');
    const statusEl = $('load-status');
    const infoBar = $('info-bar');
    const hintEl = $('hint');
    const gasIndicator = $('gas-indicator');

    function setProgress(p, msg) {
        if (barEl) barEl.style.width = Math.min(100, p) + '%';
        if (msg && statusEl) statusEl.textContent = msg;
    }
    function say(text) { if (infoBar) infoBar.textContent = text; }
    function hideLoad() {
        const el = $('loading');
        if (el) el.classList.add('hidden');
    }
    if (hintEl) hintEl.textContent = 'RHD seat  ·  1–5 or Shift/Ctrl  ·  R reverse  ·  lift off for the pop';

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9aa3ab);
    scene.fog = new THREE.Fog(0xa7b0b6, 28, 150);

    const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.08, 420);
    const envMap = createDayEnv(THREE, renderer);
    scene.environment = envMap;

    scene.add(new THREE.HemisphereLight(0xb7c0c6, 0x6a645c, 0.9));
    scene.add(new THREE.AmbientLight(0xc8c2b8, 0.22));
    const sun = new THREE.DirectionalLight(0xfff0dc, 1.35);
    sun.position.set(14, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 46;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    scene.add(sun.target);
    const fill = new THREE.DirectionalLight(0x9eb8d8, 0.35);
    fill.position.set(-6, 6, -4);
    scene.add(fill);
    setProgress(12, 'Daylight');

    const yard = buildYard(THREE, scene);
    const city = buildCity(THREE, scene);
    const visited = new Set();
    const fleet = [];
    let carName = 'RunX';
    function blocked(x, z, r) {
        return yard.blocked(x, z, r) || city.blocked(x, z, r);
    }
    function shorten(from, to) {
        return city.shorten(from, yard.shorten(from, to));
    }
    setProgress(30, 'City laid out');
    const civic = buildCivic(THREE, envMap);
    mountSimple(civic, 'Civic', city.civicSpot);
    civic.rotation.y = 0.04;
    new GLTFLoader().load('assets/models/civic.glb', (gltf) => {
        const old = fleet.find((v) => v.name === 'Civic' || v.name === 'Hatch');
        if (old) {
            scene.remove(old.root);
            fleet.splice(fleet.indexOf(old), 1);
        }
        const root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        root.scale.setScalar(4.2 / maxDim);
        mountSimple(root, 'Civic', city.civicSpot);
    }, undefined, () => {});

    const stopsEl = document.createElement('div');
    stopsEl.id = 'stops';
    stopsEl.style.cssText = 'position:fixed;top:18px;right:18px;z-index:20;background:rgba(8,10,16,0.72);color:#fff;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 12px;font:12px/1.45 JetBrains Mono,monospace;min-width:148px;';
    document.body.appendChild(stopsEl);
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = 168;
    mapCanvas.height = 168;
    mapCanvas.style.cssText = 'position:fixed;left:18px;bottom:52px;z-index:20;width:132px;height:132px;border-radius:10px;border:1px solid rgba(255,255,255,0.16);background:rgba(8,10,16,0.55);';
    document.body.appendChild(mapCanvas);
    const mapCtx = mapCanvas.getContext('2d');
    const toast = document.createElement('div');
    toast.style.cssText = 'display:none;position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:30;max-width:min(440px,90vw);background:#f6f1e8;color:#1c1916;border-radius:12px;padding:14px 16px;font:15px/1.45 Space Grotesk,sans-serif;';
    document.body.appendChild(toast);
    let toastUntil = 0;
    function showStop(pin) {
        toast.style.display = 'block';
        toast.innerHTML = `<strong>${pin.title}</strong><div style="margin-top:4px;color:#5c564e">${pin.body}</div>`;
        toastUntil = performance.now() + 6500;
        if (pin.ring) pin.ring.material.color.setHex(0x3ddc97);
    }
    function drawMap(px, pz) {
        const ctx = mapCtx;
        ctx.clearRect(0, 0, 168, 168);
        const X = (x) => ((x + 90) / 200) * 168;
        const Z = (z) => 168 - ((z + 10) / 240) * 168;
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 2;
        [-72, -36, 0, 36, 72].forEach((x) => {
            ctx.beginPath(); ctx.moveTo(X(x), Z(40)); ctx.lineTo(X(x), Z(210)); ctx.stroke();
        });
        [48, 88, 128, 168, 208].forEach((z) => {
            ctx.beginPath(); ctx.moveTo(X(-80), Z(z)); ctx.lineTo(X(80), Z(z)); ctx.stroke();
        });
        city.pins.forEach((pin) => {
            ctx.fillStyle = visited.has(pin.id) ? '#3ddc97' : pin.color;
            ctx.beginPath(); ctx.arc(X(pin.pos.x), Z(pin.pos.z), 4, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(X(px), Z(pz), 3.5, 0, Math.PI * 2); ctx.fill();
        const lines = city.pins.map((p) => `${visited.has(p.id) ? '✓' : '○'} ${p.title.split(' ')[0]}`);
        stopsEl.innerHTML = `<div style="opacity:.55;margin-bottom:4px">${visited.size}/4</div>${lines.join('<br>')}`;
    }

    const player = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.8 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc48a62, roughness: 0.65 });
    const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.46, 4, 8), cloth);
    legs.position.y = 0.42;
    legs.castShadow = true;
    player.add(legs);
    const torso = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.2, 0.36, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0xc4564a, roughness: 0.7 })
    );
    torso.position.y = 0.98;
    torso.castShadow = true;
    player.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), skin);
    head.position.y = 1.42;
    head.castShadow = true;
    player.add(head);
    const face = new THREE.Mesh(
        new THREE.CircleGeometry(0.1, 20),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
    );
    face.position.set(0, 1.42, 0.12);
    face.visible = false;
    player.add(face);
    const faceImg = new Image();
    faceImg.onload = () => {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d');
        ctx.beginPath();
        ctx.arc(256, 240, 210, 0, Math.PI * 2);
        ctx.clip();
        const sw = faceImg.width * 0.62;
        const sh = faceImg.height * 0.5;
        ctx.drawImage(faceImg, (faceImg.width - sw) / 2, faceImg.height * 0.02, sw, sh, 0, 0, 512, 512);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        face.material.map = tex;
        face.material.needsUpdate = true;
        face.visible = true;
    };
    faceImg.src = 'assets/portraits/akhil-face.jpg';
    player.position.set(1.85, 0, 6.8);
    player.visible = false;
    scene.add(player);

    const keys = { f: false, b: false, l: false, r: false };
    let mode = 'walk';
    let view = 'first';
    let yaw = Math.PI;
    let pitch = -0.06;
    let lookOffset = 0;
    let pointerLocked = false;
    let dragging = false;

    let car = null;
    let frame = null;
    let eyeAnchor = null;
    let exhaustAnchor = null;
    let doorLocal = null;
    let headLights = null;
    const drive = { speed: 0 };
    const GEARBOX = [
        { name: 'R', dir: -1, vmax: 9, pull: 18 },
        { name: '1', dir: 1, vmax: 14.2, pull: 30 },
        { name: '2', dir: 1, vmax: 24, pull: 22 },
        { name: '3', dir: 1, vmax: 35, pull: 15 },
        { name: '4', dir: 1, vmax: 45, pull: 10 },
        { name: '5', dir: 1, vmax: 52.8, pull: 9 },
    ];
    let gear = 1;
    let gearRpm = 0.15;
    let wasThrottle = false;
    let backfireUntil = 0;
    let nextPop = 0;
    let flameOn = false;

    const loader = new GLTFLoader();
    loader.load('assets/models/runx.glb', (gltf) => {
        car = gltf.scene;
        const box = new THREE.Box3().setFromObject(car);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const S = 4.15 / maxDim;
        car.scale.setScalar(S);
        const center = new THREE.Vector3();
        box.getCenter(center);
        car.position.set(-center.x * S, -box.min.y * S + 0.02, 2.2 - center.z * S);

        car.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            child.castShadow = true;
            child.receiveShadow = true;
            const mn = (child.material.name || '').toLowerCase();
            const cb = new THREE.Box3().setFromObject(child);
            const cs = cb.getSize(new THREE.Vector3());
            const vol = cs.x * cs.y * cs.z;
            // Body panels on this GLB are named Silver / Paint, not just Paint.
            // Rims stay metal. Large silver shells are the panels that were reading pale blue.
            const skip = /glass|translucent|tire|tyre|rim|light|chrome|mirror|wheel/;
            const trim = /plastic|internal|interior/;
            const body = !skip.test(mn) && !trim.test(mn) && (mn.includes('paint') || mn.includes('silver') || mn.includes('steel') || mn.includes('white') || vol > 1.3);
            if (body) {
                child.material = makeFlakeBlackPaint(envMap);
            } else if (mn.includes('chrome') || mn.includes('rim') || mn.includes('aluminum')) {
                child.material.metalness = 1;
                child.material.roughness = 0.18;
                child.material.envMap = envMap;
                child.material.envMapIntensity = 0.8;
                if (child.material.color) child.material.color.setHex(0xc8c8c8);
                child.material.needsUpdate = true;
            } else if (mn.includes('glass') || mn.includes('translucent')) {
                child.material.transparent = true;
                child.material.opacity = 0.28;
                if (child.material.color) child.material.color.setHex(0x0c1218);
                child.material.envMap = envMap;
                child.material.needsUpdate = true;
            } else if (mn.includes('light')) {
                child.material.emissive = new THREE.Color(0xfff1d0);
                child.material.emissiveIntensity = 0.35;
                child.material.needsUpdate = true;
            }
        });
        scene.add(car);
        car.updateMatrixWorld(true);

        const world = new THREE.Box3().setFromObject(car);
        const c = world.getCenter(new THREE.Vector3());
        const sz = world.getSize(new THREE.Vector3());
        const frontPts = [];
        car.traverse((obj) => {
            if ((obj.name || '').toLowerCase().includes('front-gla')) {
                const b = new THREE.Box3().setFromObject(obj);
                if (!b.isEmpty()) frontPts.push(b.getCenter(new THREE.Vector3()));
            }
        });
        const forward = new THREE.Vector3(0, 0, 1);
        if (frontPts.length) {
            const f = frontPts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / frontPts.length);
            forward.copy(f).sub(c);
            forward.y = 0;
            if (forward.lengthSq() > 1e-6) forward.normalize();
        }
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
        const length = Math.abs(sz.dot(new THREE.Vector3(Math.abs(forward.x), 0, Math.abs(forward.z)))) || sz.z;
        const width = Math.abs(sz.dot(new THREE.Vector3(Math.abs(right.x), 0, Math.abs(right.z)))) || sz.x;
        frame = { forward, right, length, width };

        function toLocal(worldPos) {
            return car.worldToLocal(worldPos.clone());
        }
        const driverSide = right.clone().multiplyScalar(-1);
        eyeAnchor = new THREE.Object3D();
        const eyeWorld = c.clone().addScaledVector(driverSide, width * 0.16).addScaledVector(forward, length * 0.2);
        eyeWorld.y = world.min.y + sz.y * 0.74;
        eyeAnchor.position.copy(toLocal(eyeWorld));
        car.add(eyeAnchor);

        exhaustAnchor = new THREE.Object3D();
        const exWorld = c.clone().addScaledVector(forward, -length * 0.48).addScaledVector(right, width * 0.22);
        exWorld.y = world.min.y + sz.y * 0.1;
        exhaustAnchor.position.copy(toLocal(exWorld));
        car.add(exhaustAnchor);

        const doorWorld = c.clone().addScaledVector(driverSide, width * 0.5 + 0.85);
        doorWorld.y = 0;
        doorLocal = toLocal(doorWorld);

        const front = c.clone().addScaledVector(forward, length * 0.49);
        front.y = world.min.y + sz.y * 0.28;
        const plate = plateMesh();
        car.add(plate);
        plate.position.copy(toLocal(front));
        plate.lookAt(front.clone().add(forward));
        const back = c.clone().addScaledVector(forward, -length * 0.49);
        back.y = front.y;
        const rear = plateMesh();
        car.add(rear);
        rear.position.copy(toLocal(back));
        rear.lookAt(back.clone().addScaledVector(forward, -1));

        headLights = new THREE.SpotLight(0xfff6ea, 0, 22, 0.55, 0.45, 1);
        const nose = c.clone().addScaledVector(forward, length * 0.46);
        nose.y = world.min.y + 0.55;
        headLights.position.copy(toLocal(nose));
        const aim = new THREE.Object3D();
        aim.position.copy(toLocal(nose.clone().addScaledVector(forward, 12)));
        car.add(headLights);
        car.add(aim);
        headLights.target = aim;

        yaw = Math.atan2(c.x - player.position.x, c.z - player.position.z);
        fleet.push({ root: car, frame, eye: eyeAnchor, exhaust: exhaustAnchor, door: doorLocal, lights: headLights, name: 'RunX' });
        if (location.search.includes('view=third')) {
            view = 'third';
            player.visible = true;
        }
        if (location.search.includes('city=1')) {
            car.position.set(0, car.position.y, 90);
            mode = 'drive';
            view = 'first';
            pitch = 0.12;
            player.visible = false;
            keys.f = true;
            if (headLights) headLights.intensity = 8;
        }
        if (location.search.includes('drive=1')) {
            mode = 'drive';
            view = 'first';
            pitch = 0.12;
            player.visible = false;
            keys.f = true;
            if (headLights) headLights.intensity = 10;
        }
        setProgress(100, 'RunX in the driveway');
        say(viewLabel());
        setTimeout(hideLoad, 280);
    }, (xhr) => {
        if (xhr.total) setProgress(40 + Math.round((xhr.loaded / xhr.total) * 50), 'Loading the RunX');
    }, () => {
        setProgress(100, 'Car model missing');
        hideLoad();
    });

    function plateMesh() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 220;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#f4f7fb';
        ctx.fillRect(0, 0, 512, 220);
        ctx.strokeStyle = '#163a86';
        ctx.lineWidth = 16;
        ctx.strokeRect(8, 8, 496, 204);
        ctx.fillStyle = '#163a86';
        ctx.textAlign = 'center';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('KWAZULU-NATAL', 256, 50);
        ctx.font = 'bold 68px sans-serif';
        ctx.fillText('CP 43FW ZN', 256, 142);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.2), new THREE.MeshBasicMaterial({ map: tex }));
    }

    const flameCount = 70;
    const flamePos = new Float32Array(flameCount * 3);
    const flameVel = new Float32Array(flameCount * 3);
    const flameLife = new Float32Array(flameCount);
    for (let i = 0; i < flameCount; i++) flamePos[i * 3 + 1] = -50;
    const flameGeo = new THREE.BufferGeometry();
    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
    const flames = new THREE.Points(flameGeo, new THREE.PointsMaterial({
        color: 0xff6a00, size: 0.16, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    scene.add(flames);
    let flameCursor = 0;

    function emitFlame() {
        if (!exhaustAnchor || !car) return;
        const tip = exhaustAnchor.getWorldPosition(new THREE.Vector3());
        const back = frame
            ? frame.forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y).multiplyScalar(-1)
            : new THREE.Vector3(0, 0, -1).applyQuaternion(car.quaternion);
        for (let n = 0; n < 3; n++) {
            const i = flameCursor++ % flameCount;
            flamePos[i * 3] = tip.x;
            flamePos[i * 3 + 1] = tip.y;
            flamePos[i * 3 + 2] = tip.z;
            const k = 1.2 + Math.random();
            flameVel[i * 3] = back.x * k;
            flameVel[i * 3 + 1] = 0.3 + Math.random() * 0.5;
            flameVel[i * 3 + 2] = back.z * k;
            flameLife[i] = 1;
        }
        flameGeo.attributes.position.needsUpdate = true;
    }
    function updateFlame(dt) {
        for (let i = 0; i < flameCount; i++) {
            if (flameLife[i] <= 0) continue;
            flameLife[i] -= dt * 1.6;
            flamePos[i * 3] += flameVel[i * 3] * dt;
            flamePos[i * 3 + 1] += flameVel[i * 3 + 1] * dt;
            flamePos[i * 3 + 2] += flameVel[i * 3 + 2] * dt;
            if (flameLife[i] <= 0) flamePos[i * 3 + 1] = -50;
        }
        flameGeo.attributes.position.needsUpdate = true;
        if (gasIndicator) gasIndicator.style.color = flameOn ? 'rgba(180,70,20,0.9)' : 'rgba(255,102,0,0)';
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:300;background:rgba(20,16,12,0.55);justify-content:center;align-items:center;padding:24px;';
    const panel = document.createElement('div');
    panel.style.cssText = 'width:min(720px,94vw);max-height:82vh;overflow:auto;background:#f6f1e8;color:#1c1916;border-radius:12px;padding:28px 32px;font-family:Space Grotesk,sans-serif;position:relative;';
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'position:absolute;top:12px;right:12px;border:none;background:#1c1916;color:#fff;border-radius:6px;padding:6px 10px;cursor:pointer;';
    closeBtn.onclick = () => { overlay.style.display = 'none'; };
    panel.appendChild(closeBtn);
    const body = document.createElement('div');
    body.style.cssText = 'font-size:15px;line-height:1.6;';
    panel.appendChild(body);
    body.innerHTML = `
        <h2 style="margin:0 0 8px;font-size:22px">Akhil Pillay</h2>
        <p style="margin:0 0 12px;color:#5c564e">Tongaat driveway. Ballito work. The black RunX in between.</p>
        <p>Lead web and app at Comfort Shooting. Hush is the car social. AgenticBiz is the systems work.</p>
        <p><a href="https://akhil-devs-portfolio.vercel.app" target="_blank" rel="noopener">Portfolio</a> ·
           <a href="https://github.com/Mr-Akhil12" target="_blank" rel="noopener">GitHub</a> ·
           <a href="https://hush-v1.vercel.app" target="_blank" rel="noopener">Hush</a> ·
           <a href="https://www.agenticbiz.co.za/" target="_blank" rel="noopener">AgenticBiz</a></p>
        <p style="color:#5c564e">WhatsApp <a href="https://wa.me/27678659396">+27 67 865 9396</a> · <a href="mailto:akhilpillay2.0@gmail.com">akhilpillay2.0@gmail.com</a></p>
        <p style="font-size:12px;color:#8a8176">RunX mesh by OUTPISTON, CC BY-NC-SA 4.0. Drop a rev recording at assets/audio/runx-rev.mp3 and it replaces the synth.</p>`;
    function closeLaptop() { overlay.style.display = 'none'; }
    function openLaptop() { overlay.style.display = 'flex'; }
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLaptop(); });

    function mountSimple(root, name, spot) {
        root.position.set(spot.x, 0, spot.z);
        scene.add(root);
        root.updateMatrixWorld(true);
        const world = new THREE.Box3().setFromObject(root);
        const c = world.getCenter(new THREE.Vector3());
        const sz = world.getSize(new THREE.Vector3());
        const frame = { forward: new THREE.Vector3(0, 0, 1), right: new THREE.Vector3(1, 0, 0), length: sz.z, width: sz.x };
        const eye = new THREE.Object3D();
        const eyeWorld = new THREE.Vector3(c.x + 0.32, 1.08, c.z + 0.05);
        root.add(eye);
        root.worldToLocal(eye.position.copy(eyeWorld));
        const exhaust = new THREE.Object3D();
        const ex = new THREE.Vector3(c.x + 0.35, 0.32, c.z - sz.z * 0.42);
        root.add(exhaust);
        root.worldToLocal(exhaust.position.copy(ex));
        const door = root.worldToLocal(new THREE.Vector3(c.x + sz.x * 0.5 + 0.85, 0, c.z));
        const lights = new THREE.SpotLight(0xfff6ea, 0, 22, 0.55, 0.45, 1);
        const nose = new THREE.Vector3(c.x, 0.5, c.z + sz.z * 0.46);
        root.add(lights);
        root.worldToLocal(lights.position.copy(nose));
        const aim = new THREE.Object3D();
        root.add(aim);
        root.worldToLocal(aim.position.copy(nose.clone().add(new THREE.Vector3(0, 0, 10))));
        lights.target = aim;
        const blob = new THREE.Mesh(
            new THREE.CircleGeometry(1.2, 20),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
        );
        blob.rotation.x = -Math.PI / 2;
        blob.position.y = 0.02;
        root.add(blob);
        fleet.push({ root, frame, eye, exhaust, door, lights, name });
    }
    function nearestVehicle() {
        let best = null;
        let bestD = 1.7;
        fleet.forEach((v) => {
            if (!v.root || !v.door) return;
            const door = v.root.localToWorld(v.door.clone());
            door.y = 0;
            const d = player.position.distanceTo(door);
            if (d < bestD) { bestD = d; best = v; }
        });
        return best;
    }
    function bindVehicle(v) {
        car = v.root;
        frame = v.frame;
        eyeAnchor = v.eye;
        exhaustAnchor = v.exhaust;
        doorLocal = v.door;
        headLights = v.lights;
        carName = v.name;
    }
    function nearLaptop() {
        return player.position.distanceTo(yard.laptopSpot) < 1.6;
    }
    function nearDoor() {
        return !!nearestVehicle();
    }
    function baseYaw() {
        if (!frame || !car) return 0;
        return Math.atan2(frame.forward.x, frame.forward.z) + car.rotation.y;
    }
    function enterCar() {
        const v = nearestVehicle();
        if (!v || mode !== 'walk') return;
        bindVehicle(v);
        mode = 'drive';
        drive.speed = 0;
        lookOffset = 0;
        pitch = 0.12;
        player.visible = false;
        if (headLights) headLights.intensity = 8;
        view = 'first';
        say(viewLabel());
    }
    function exitCar() {
        if (mode !== 'drive' || !car || !doorLocal) return;
        const stand = car.localToWorld(doorLocal.clone());
        stand.y = 0;
        if (blocked(stand.x, stand.z, 0.3)) stand.z += 1.2;
        player.position.copy(stand);
        mode = 'walk';
        drive.speed = 0;
        if (headLights) headLights.intensity = 0;
        player.visible = view === 'third';
        const carPos = new THREE.Vector3();
        car.getWorldPosition(carPos);
        yaw = Math.atan2(carPos.x - stand.x, carPos.z - stand.z);
        say(viewLabel());
    }
    function toggleView() {
        view = view === 'first' ? 'third' : 'first';
        player.visible = mode === 'walk' && view === 'third';
        if (view === 'first') renderer.domElement.requestPointerLock?.();
        else document.exitPointerLock?.();
        say(viewLabel());
    }
    function viewLabel() {
        const cam = view === 'first' ? 'first person' : 'third person';
        if (mode === 'drive') {
            const g = GEARBOX[gear];
            return `${carName}  ·  ${g.name}  ·  ${(drive.speed * 3.6).toFixed(0)} km/h  ·  Shift up  Ctrl down  ·  E out`;
        }
        if (nearDoor()) return `${cam}  ·  E sit in  ·  ${visited.size}/4 stops`;
        if (nearLaptop()) return `${cam}  ·  E laptop  ·  V camera`;
        return `${cam}  ·  WASD  ·  V camera  ·  driver door is on the right of the car`;
    }
    function slide(pos, delta, radius) {
        const next = pos.clone().add(delta);
        if (!blocked(next.x, next.z, radius)) return next;
        const xOnly = pos.clone();
        xOnly.x += delta.x;
        if (!blocked(xOnly.x, xOnly.z, radius)) return xOnly;
        const zOnly = pos.clone();
        zOnly.z += delta.z;
        if (!blocked(zOnly.x, zOnly.z, radius)) return zOnly;
        return pos;
    }

    let audioCtx = null;
    let engineGain = null;
    let engineOsc = null;
    let revBuffer = null;
    let revSource = null;
    function bootAudio() {
        if (audioCtx) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
        engineGain = audioCtx.createGain();
        engineGain.gain.value = 0;
        engineGain.connect(audioCtx.destination);
        engineOsc = audioCtx.createOscillator();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = 55;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 280;
        engineOsc.connect(filter);
        filter.connect(engineGain);
        engineOsc.start();
        fetch('assets/audio/runx-rev.mp3').then((r) => (r.ok ? r.arrayBuffer() : null)).then((buf) => {
            if (!buf) return null;
            return audioCtx.decodeAudioData(buf);
        }).then((decoded) => {
            if (!decoded) return;
            revBuffer = decoded;
            engineOsc.disconnect();
        }).catch(() => {});
    }
    function setEngine(throttle, speed) {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const rpm = gearRpm;
        if (revBuffer) {
            if (!revSource) {
                revSource = audioCtx.createBufferSource();
                revSource.buffer = revBuffer;
                revSource.loop = true;
                revSource.connect(engineGain);
                revSource.start();
            }
            revSource.playbackRate.value = 0.45 + rpm * 1.3;
            engineGain.gain.setTargetAtTime(throttle || Math.abs(speed) > 0.2 ? 0.55 : 0.08, audioCtx.currentTime, 0.08);
            return;
        }
        if (!engineOsc) return;
        engineOsc.frequency.setTargetAtTime(48 + rpm * 140, audioCtx.currentTime, 0.05);
        engineGain.gain.setTargetAtTime(mode === 'drive' && (throttle || Math.abs(speed) > 0.2) ? 0.045 : 0, audioCtx.currentTime, 0.08);
    }

    function shiftGear(dir) {
        if (mode !== 'drive') return;
        shiftGearTo(gear + dir);
    }
    function shiftGearTo(next) {
        if (mode !== 'drive') return;
        if (next < 0 || next >= GEARBOX.length || next === gear) return;
        const crossing = GEARBOX[gear].dir !== GEARBOX[next].dir;
        if (crossing && Math.abs(drive.speed) > 1.4) return;
        const down = next < gear && GEARBOX[next].dir > 0;
        gear = next;
        bootAudio();
        if (down) backfire(0.12);
    }
    function backfire(seconds) {
        const now = performance.now();
        backfireUntil = Math.max(backfireUntil, now + seconds * 1000);
        if (now < nextPop) return;
        nextPop = now + 260;
        emitFlame();
        if (!audioCtx) return;
        const dur = 0.09;
        const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * dur), audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / data.length;
            data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
        }
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 140 + Math.random() * 180;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.42;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        src.start();
    }
    addEventListener('keydown', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.f = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.b = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = true;
        if (e.code === 'Space') { e.preventDefault(); flameOn = true; bootAudio(); }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { e.preventDefault(); shiftGear(1); }
        if (e.code === 'ControlLeft' || e.code === 'ControlRight') { e.preventDefault(); shiftGear(-1); }
        if (e.code === 'KeyR' && mode === 'drive') shiftGearTo(0);
        if (e.code === 'Digit1') shiftGearTo(1);
        if (e.code === 'Digit2') shiftGearTo(2);
        if (e.code === 'Digit3') shiftGearTo(3);
        if (e.code === 'Digit4') shiftGearTo(4);
        if (e.code === 'Digit5') shiftGearTo(5);
        if (e.code === 'KeyV') toggleView();
        if (e.code === 'KeyE') {
            bootAudio();
            if (overlay.style.display === 'flex') closeLaptop();
            else if (mode === 'drive') exitCar();
            else if (nearDoor()) enterCar();
            else if (nearLaptop()) openLaptop();
        }
        if (e.code === 'Escape') {
            closeLaptop();
            document.exitPointerLock?.();
        }
        if (keys.f || keys.b) bootAudio();
    });
    addEventListener('keyup', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.f = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.b = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = false;
        if (e.code === 'Space') flameOn = false;
    });
    renderer.domElement.addEventListener('click', () => {
        if (overlay.style.display === 'flex') return;
        if (view === 'first') renderer.domElement.requestPointerLock?.();
    });
    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === renderer.domElement;
    });
    renderer.domElement.addEventListener('pointerdown', (e) => {
        dragging = true;
        lx = e.clientX;
        ly = e.clientY;
    });
    addEventListener('pointerup', () => { dragging = false; });
    let lx = 0;
    let ly = 0;
    addEventListener('mousemove', (e) => {
        let dx = 0;
        let dy = 0;
        if (pointerLocked) {
            dx = e.movementX || 0;
            dy = e.movementY || 0;
        } else if (dragging) {
            dx = e.clientX - lx;
            dy = e.clientY - ly;
            lx = e.clientX;
            ly = e.clientY;
        } else return;
        const sens = pointerLocked ? 0.0022 : 0.004;
        if (mode === 'drive') lookOffset = THREE.MathUtils.clamp(lookOffset - dx * sens, -1.1, 1.1);
        else yaw -= dx * sens;
        pitch = THREE.MathUtils.clamp(pitch - dy * sens * 0.75, -0.65, 0.45);
    });

    const joy = $('joystick-zone');
    const knob = $('joystick-knob');
    if (joy && knob) {
        let active = false;
        const setJoy = (cx, cy) => {
            const r = joy.getBoundingClientRect();
            let x = cx - (r.left + r.width / 2);
            let y = cy - (r.top + r.height / 2);
            const m = Math.hypot(x, y) || 1;
            const cap = r.width * 0.32;
            if (m > cap) { x = x / m * cap; y = y / m * cap; }
            knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
            keys.f = y < -12;
            keys.b = y > 12;
            keys.l = x < -12;
            keys.r = x > 12;
        };
        joy.addEventListener('pointerdown', (e) => { active = true; joy.setPointerCapture(e.pointerId); setJoy(e.clientX, e.clientY); bootAudio(); });
        joy.addEventListener('pointermove', (e) => { if (active) setJoy(e.clientX, e.clientY); });
        const endJoy = () => {
            active = false;
            knob.style.transform = 'translate(-50%, -50%)';
            keys.f = keys.b = keys.l = keys.r = false;
        };
        joy.addEventListener('pointerup', endJoy);
        joy.addEventListener('pointercancel', endJoy);
    }
    $('btn-gas')?.addEventListener('pointerdown', (e) => { e.preventDefault(); flameOn = true; bootAudio(); });
    addEventListener('pointerup', (e) => { if (e.target && e.target.id === 'btn-gas') flameOn = false; });
    $('btn-laptop')?.addEventListener('click', () => {
        if (mode === 'drive') exitCar();
        else if (nearDoor()) enterCar();
        else openLaptop();
    });
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-btn';
    viewBtn.textContent = '👁';
    viewBtn.title = 'First / third person';
    $('action-buttons')?.appendChild(viewBtn);
    viewBtn.addEventListener('click', toggleView);

    addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    const look = new THREE.Vector3();
    const desired = new THREE.Vector3();
    const headPos = new THREE.Vector3();
    let last = performance.now();
    let labelTick = 0;

    function tick(now) {
        requestAnimationFrame(tick);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        if (mode === 'walk') {
            const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
            const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
            const wish = new THREE.Vector3();
            if (keys.f) wish.add(forward);
            if (keys.b) wish.sub(forward);
            if (keys.l) wish.sub(right);
            if (keys.r) wish.add(right);
            if (wish.lengthSq() > 0) {
                wish.normalize().multiplyScalar(3.1 * dt);
                player.position.copy(slide(player.position, wish, 0.28));
            }
            player.rotation.y = yaw;
            player.visible = view === 'third';
        } else if (car && frame) {
            const g = GEARBOX[gear];
            const throttle = keys.f && !keys.b;
            if (throttle) {
                const along = drive.speed * g.dir;
                const headroom = Math.max(0, g.vmax - Math.max(0, along));
                const pull = 0.25 + 0.75 * (headroom / g.vmax);
                if (along < g.vmax) drive.speed += g.dir * g.pull * pull * dt;
            }
            if (keys.b) {
                const brake = 22 * dt;
                if (Math.abs(drive.speed) <= brake) drive.speed = 0;
                else drive.speed -= Math.sign(drive.speed) * brake;
            } else if (!throttle) {
                drive.speed *= 1 - 0.55 * dt;
                if (Math.abs(drive.speed) < 0.15) drive.speed = 0;
            }
            if (drive.speed * g.dir > g.vmax) {
                drive.speed -= g.dir * 10 * dt;
            }
            const span = Math.max(0.5, g.vmax * 0.85);
            gearRpm = Math.min(1, Math.max(0.12, Math.abs(drive.speed) / span));
            const steer = (keys.l ? 1 : 0) - (keys.r ? 1 : 0);
            const speedForSteer = Math.min(1, Math.abs(drive.speed) / 8);
            if (Math.abs(drive.speed) > 0.2) car.rotation.y += steer * 1.15 * dt * Math.sign(drive.speed) * (0.45 + speedForSteer);
            const fwd = frame.forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
            const step = fwd.multiplyScalar(drive.speed * dt);
            const radius = Math.max(frame.width || 1.6, 1.4) * 0.45;
            const hops = Math.max(1, Math.ceil(step.length() / 0.7));
            const sub = step.clone().multiplyScalar(1 / hops);
            for (let i = 0; i < hops; i++) {
                const next = car.position.clone().add(sub);
                if (blocked(next.x, next.z, radius)) {
                    drive.speed *= -0.12;
                    break;
                }
                car.position.add(sub);
            }
            if (headLights) headLights.intensity = throttle || Math.abs(drive.speed) > 0.4 ? 10 : 4;
            if (wasThrottle && !throttle && gearRpm > 0.55 && Math.abs(drive.speed) > 6) backfire(0.16);
            else if (!throttle && gearRpm > 0.7 && Math.abs(drive.speed) > 10 && Math.random() < dt * 1.6) backfire(0.07);
            wasThrottle = throttle;
        }

        if (flameOn || performance.now() < backfireUntil) emitFlame();
        updateFlame(dt);
        setEngine(keys.f || flameOn, mode === 'drive' ? drive.speed : 0);

        const focus = mode === 'drive' && car ? car.position : player.position;
        sun.position.set(focus.x + 12, 18, focus.z + 6);
        sun.target.position.set(focus.x, 0, focus.z);
        sun.target.updateMatrixWorld();

        if (location.search.includes('street=1')) {
            camera.position.set(-1.2, 2.2, 36);
            camera.lookAt(1.5, 1.2, 72);
        } else if (location.search.includes('overview=1') && car) {
            camera.position.set(28, 42, 8);
            camera.lookAt(0, 0, 90);
        } else if (view === 'first') {
            if (mode === 'drive' && eyeAnchor && frame) {
                eyeAnchor.getWorldPosition(camera.position);
                const fwd = frame.forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y + lookOffset);
                fwd.y = Math.sin(pitch);
                fwd.normalize();
                camera.lookAt(camera.position.clone().add(fwd));
            } else {
                camera.position.set(player.position.x, 1.62, player.position.z);
                look.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
                camera.lookAt(camera.position.clone().add(look));
            }
        } else if (mode === 'drive' && car) {
            const ay = baseYaw();
            headPos.set(car.position.x, 1.05, car.position.z);
            desired.set(headPos.x - Math.sin(ay) * 5.6, 1.85, headPos.z - Math.cos(ay) * 5.6);
            const safe = shorten(headPos, desired);
            camera.position.lerp(safe, 1 - Math.exp(-8 * dt));
            camera.lookAt(headPos);
        } else {
            headPos.set(player.position.x, 1.35, player.position.z);
            const side = Math.cos(yaw) * 1.15;
            const sideZ = -Math.sin(yaw) * 1.15;
            desired.set(headPos.x - Math.sin(yaw) * 3.8 + side, 1.7, headPos.z - Math.cos(yaw) * 3.8 + sideZ);
            const safe = shorten(headPos, desired);
            camera.position.lerp(safe, 1 - Math.exp(-10 * dt));
            camera.lookAt(headPos.x, 1.4, headPos.z);
        }

        if (mode === 'drive' && car) {
            city.pins.forEach((pin) => {
                if (visited.has(pin.id)) return;
                const dx = car.position.x - pin.pos.x;
                const dz = car.position.z - pin.pos.z;
                if (dx * dx + dz * dz < 144) {
                    visited.add(pin.id);
                    showStop(pin);
                }
            });
        }
        if (toastUntil && performance.now() > toastUntil) toast.style.display = 'none';
        const focusNow = mode === 'drive' && car ? car.position : player.position;
        drawMap(focusNow.x, focusNow.z);

        labelTick += dt;
        if (labelTick > 0.25) {
            labelTick = 0;
            say(viewLabel());
        }
        renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
}
