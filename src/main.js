/**
 * v2 — daylight Tongaat driveway. Only the RunX mesh is kept from v1.
 * First person is the default. V switches to third. Houses stop the camera;
 * there is no garage box to clip through.
 */
import { THREE } from './three-setup.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { makeFlakeBlackPaint } from './materials.js';
import { buildYard, createDayEnv } from './environment.js';

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
    if (hintEl) hintEl.textContent = 'Click to look  ·  WASD  ·  V first / third  ·  E sit or laptop';

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
    scene.background = new THREE.Color(0x8eb6dc);
    scene.fog = new THREE.Fog(0xc5d4e2, 28, 78);

    const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.08, 160);
    const envMap = createDayEnv(THREE, renderer);
    scene.environment = envMap;

    scene.add(new THREE.HemisphereLight(0xc5dff5, 0x8a735c, 0.72));
    scene.add(new THREE.AmbientLight(0xfff4e8, 0.18));
    const sun = new THREE.DirectionalLight(0xfff1e0, 2.6);
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
    setProgress(30, 'Driveway');

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
            const body = (mn.includes('paint') && vol > 0.4) || (mn.includes('silver') && vol > 2 && !mn.includes('rim'));
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
        eyeAnchor = new THREE.Object3D();
        const eyeWorld = c.clone().addScaledVector(right, width * 0.14).addScaledVector(forward, length * 0.16);
        eyeWorld.y = world.min.y + sz.y * 0.7;
        eyeAnchor.position.copy(toLocal(eyeWorld));
        car.add(eyeAnchor);

        exhaustAnchor = new THREE.Object3D();
        const exWorld = c.clone().addScaledVector(forward, -length * 0.48).addScaledVector(right, width * 0.22);
        exWorld.y = world.min.y + sz.y * 0.1;
        exhaustAnchor.position.copy(toLocal(exWorld));
        car.add(exhaustAnchor);

        const doorWorld = c.clone().addScaledVector(right, width * 0.5 + 0.85);
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
        if (location.search.includes('view=third')) {
            view = 'third';
            player.visible = true;
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

    function nearLaptop() {
        return player.position.distanceTo(yard.laptopSpot) < 1.6;
    }
    function nearDoor() {
        if (!car || !doorLocal) return false;
        const door = car.localToWorld(doorLocal.clone());
        door.y = 0;
        return player.position.distanceTo(door) < 1.5;
    }
    function baseYaw() {
        if (!frame || !car) return 0;
        return Math.atan2(frame.forward.x, frame.forward.z) + car.rotation.y;
    }
    function enterCar() {
        if (!car || mode !== 'walk') return;
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
        if (yard.blocked(stand.x, stand.z, 0.3)) stand.z += 1.2;
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
        if (mode === 'drive') return `${cam}  ·  ${Math.abs(drive.speed * 3.6).toFixed(0)} km/h  ·  W drive  A/D steer  V camera  E out`;
        if (nearDoor()) return `${cam}  ·  E sit in  ·  V camera`;
        if (nearLaptop()) return `${cam}  ·  E laptop  ·  V camera`;
        return `${cam}  ·  WASD  ·  V camera  ·  driver door is on the right of the car`;
    }
    function slide(pos, delta, radius) {
        const next = pos.clone().add(delta);
        if (!yard.blocked(next.x, next.z, radius)) return next;
        const xOnly = pos.clone();
        xOnly.x += delta.x;
        if (!yard.blocked(xOnly.x, xOnly.z, radius)) return xOnly;
        const zOnly = pos.clone();
        zOnly.z += delta.z;
        if (!yard.blocked(zOnly.x, zOnly.z, radius)) return zOnly;
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
        const rpm = 0.15 + Math.min(1, Math.abs(speed) / 12) * 0.7 + (throttle ? 0.25 : 0);
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

    addEventListener('keydown', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.f = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.b = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = true;
        if (e.code === 'Space') { e.preventDefault(); flameOn = true; bootAudio(); }
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
            const accel = (keys.f ? 7.5 : 0) - (keys.b ? 10 : 0);
            drive.speed += accel * dt;
            drive.speed *= 1 - 1.4 * dt;
            drive.speed = THREE.MathUtils.clamp(drive.speed, -3.5, 12);
            const steer = (keys.l ? 1 : 0) - (keys.r ? 1 : 0);
            if (Math.abs(drive.speed) > 0.15) car.rotation.y += steer * 1.5 * dt * Math.sign(drive.speed || 1);
            const fwd = frame.forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
            const step = fwd.multiplyScalar(drive.speed * dt);
            const radius = Math.max(frame.width, 1.4) * 0.55;
            const next = car.position.clone().add(step);
            if (yard.blocked(next.x, next.z, radius)) drive.speed *= -0.15;
            else car.position.add(step);
            if (headLights) headLights.intensity = keys.f || Math.abs(drive.speed) > 0.4 ? 10 : 4;
        }

        if (flameOn) emitFlame();
        updateFlame(dt);
        setEngine(keys.f || flameOn, mode === 'drive' ? drive.speed : 0);

        const focus = mode === 'drive' && car ? car.position : player.position;
        sun.position.set(focus.x + 12, 18, focus.z + 6);
        sun.target.position.set(focus.x, 0, focus.z);
        sun.target.updateMatrixWorld();

        if (view === 'first') {
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
            const safe = yard.shorten(headPos, desired);
            camera.position.lerp(safe, 1 - Math.exp(-8 * dt));
            camera.lookAt(headPos);
        } else {
            headPos.set(player.position.x, 1.35, player.position.z);
            const side = Math.cos(yaw) * 1.15;
            const sideZ = -Math.sin(yaw) * 1.15;
            desired.set(headPos.x - Math.sin(yaw) * 3.8 + side, 1.7, headPos.z - Math.cos(yaw) * 3.8 + sideZ);
            const safe = yard.shorten(headPos, desired);
            camera.position.lerp(safe, 1 - Math.exp(-10 * dt));
            camera.lookAt(headPos.x, 1.4, headPos.z);
        }

        labelTick += dt;
        if (labelTick > 0.25) {
            labelTick = 0;
            say(viewLabel());
        }
        renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
}
