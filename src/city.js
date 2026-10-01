/**
 * Coastal city north of the Tongaat driveway.
 * Avenues run north. Pins are the portfolio stops. Buildings are colliders;
 * the camera shortens against them the same way it does in the yard.
 */
export function buildCity(THREE, scene) {
    const boxes = [];
    const rand = mulberry(0xC0FFEE);

    const road = canvasTex(THREE, 512, 512, (ctx, w, h) => {
        ctx.fillStyle = '#5a5854';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) {
            ctx.fillStyle = `rgba(30,28,26,${0.12 + rand() * 0.25})`;
            ctx.fillRect(rand() * w, rand() * h, 2 + rand() * 6, 1);
        }
        ctx.strokeStyle = 'rgba(230,210,140,0.85)';
        ctx.lineWidth = 6;
        ctx.setLineDash([28, 22]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();
    });
    road.repeat.set(1, 8);
    const roadMat = new THREE.MeshStandardMaterial({ map: road, roughness: 0.92, metalness: 0.02 });
    const vergeMat = new THREE.MeshStandardMaterial({ color: 0x7d8a62, roughness: 1 });
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xd8c7a2, roughness: 1 });
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x1a6f9a, roughness: 0.18, metalness: 0.05,
    });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(280, 240), vergeMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.03, 130);
    ground.receiveShadow = true;
    scene.add(ground);

    const avenues = [-72, -36, 0, 36, 72];
    const streets = [48, 88, 128, 168, 208];
    avenues.forEach((x) => {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 200), roadMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.01, 128);
        mesh.receiveShadow = true;
        scene.add(mesh);
    });
    streets.forEach((z) => {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(168, 12), roadMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(0, 0.012, z);
        mesh.receiveShadow = true;
        scene.add(mesh);
    });
    // Connector from the driveway mouth into the first cross street.
    const connector = new THREE.Mesh(new THREE.PlaneGeometry(9, 28), roadMat);
    connector.rotation.x = -Math.PI / 2;
    connector.position.set(0.2, 0.011, 34);
    connector.receiveShadow = true;
    scene.add(connector);

    const stuccoTex = canvasTex(THREE, 128, 256, (ctx, w, h) => {
        ctx.fillStyle = '#efe6d8';
        ctx.fillRect(0, 0, w, h);
        for (let y = 18; y < h - 8; y += 22) {
            for (let x = 8; x < w - 8; x += 18) {
                ctx.fillStyle = rand() > 0.35 ? '#f4e7b0' : '#2a3340';
                ctx.fillRect(x, y, 8, 10);
            }
        }
    });
    const glassTex = canvasTex(THREE, 128, 256, (ctx, w, h) => {
        ctx.fillStyle = '#8ea8bc';
        ctx.fillRect(0, 0, w, h);
        for (let y = 10; y < h - 6; y += 16) {
            for (let x = 6; x < w - 6; x += 14) {
                ctx.fillStyle = rand() > 0.4 ? '#d7e6f2' : '#1c2833';
                ctx.fillRect(x, y, 8, 9);
            }
        }
    });
    const stuccoMat = new THREE.MeshStandardMaterial({ map: stuccoTex, roughness: 0.9, color: 0xffffff });
    const creamMat = new THREE.MeshStandardMaterial({ map: stuccoTex, roughness: 0.9, color: 0xf3efe6 });
    const glassMat = new THREE.MeshStandardMaterial({ map: glassTex, roughness: 0.35, metalness: 0.25, color: 0xffffff });
    const tileMat = new THREE.MeshStandardMaterial({ color: 0x8d5a42, roughness: 0.85 });
    const mats = [stuccoMat, creamMat, glassMat];

    function block(x, z, w, d, h, mat) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, h / 2, z);
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        scene.add(mesh);
        boxes.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h });
        if (h < 16 && mat !== glassMat) {
            const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.22, d + 0.3), tileMat);
            roof.position.set(x, h + 0.1, z);
            scene.add(roof);
        }
        return mesh;
    }

    for (let ix = 0; ix < avenues.length - 1; ix++) {
        for (let iz = 0; iz < streets.length - 1; iz++) {
            const x0 = (avenues[ix] + avenues[ix + 1]) / 2;
            const z0 = (streets[iz] + streets[iz + 1]) / 2;
            const gap = 7;
            const bw = (avenues[ix + 1] - avenues[ix]) - 12 - gap;
            const bd = (streets[iz + 1] - streets[iz]) - 12 - gap;
            if (bw < 6 || bd < 6) continue;
            const towers = 1 + Math.floor(rand() * 2);
            for (let t = 0; t < towers; t++) {
                const ww = bw * (0.42 + rand() * 0.2);
                const dd = bd * (0.4 + rand() * 0.25);
                const ox = (rand() - 0.5) * (bw - ww) * 0.6;
                const oz = (rand() - 0.5) * (bd - dd) * 0.6;
                const tall = rand() > 0.82;
                const h = tall ? 18 + rand() * 22 : 4 + rand() * 9;
                const mat = tall ? glassMat : mats[Math.floor(rand() * 2)];
                block(x0 + ox, z0 + oz, ww, dd, h, mat);
            }
        }
    }

    // Ocean on the east, with a curb so the car stays on the road.
    const water = new THREE.Mesh(new THREE.PlaneGeometry(70, 220), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(118, -0.04, 140);
    scene.add(water);
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(16, 200), sandMat);
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(92, 0.005, 140);
    scene.add(beach);
    boxes.push({ minX: 100, maxX: 160, minZ: 20, maxZ: 250, h: 1.2 });

    const foam = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 200),
        new THREE.MeshBasicMaterial({ color: 0xf4f7fb })
    );
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(84, 0.02, 140);
    scene.add(foam);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.6 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff1c8 });
    for (let z = 56; z <= 200; z += 24) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 5), lampMat);
        pole.position.set(-7.2, 2.1, z);
        scene.add(pole);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), bulbMat);
        bulb.position.set(-7.2, 4.2, z);
        scene.add(bulb);
    }
    palm(THREE, scene, 88, 110);
    palm(THREE, scene, 84, 156);
    const highway = new THREE.Mesh(new THREE.PlaneGeometry(16, 220), roadMat);
    highway.rotation.x = -Math.PI / 2;
    highway.position.set(0, 0.015, 320);
    highway.receiveShadow = true;
    scene.add(highway);

    const pins = [
        {
            id: 'comfort',
            title: 'Comfort Shooting',
            body: 'Lead web and app. The systems that have to stay up. Ballito, under Wayne.',
            pos: new THREE.Vector3(-36, 0, 68),
            color: '#c4564a',
        },
        {
            id: 'hush',
            title: 'Hush',
            body: 'The car social. A white hatch is parked on this avenue. Walk up and press E to swap.',
            pos: new THREE.Vector3(36, 0, 96),
            color: '#1f6f8a',
        },
        {
            id: 'agentic',
            title: 'AgenticBiz',
            body: 'Stop thinking in tickets. Start thinking in outcomes.',
            pos: new THREE.Vector3(0, 0, 176),
            color: '#2f6b4f',
        },
        {
            id: 'ballito',
            title: 'Ballito',
            body: 'The coast. Rivers Church. The drive up from Tongaat.',
            pos: new THREE.Vector3(72, 0, 168),
            color: '#c4a15a',
        },
    ];
    pins.forEach((pin) => {
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6),
            new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.7 })
        );
        pole.position.set(pin.pos.x, 1.6, pin.pos.z);
        scene.add(pole);
        const board = sign(THREE, pin.title, pin.color);
        board.position.set(pin.pos.x, 3.1, pin.pos.z);
        scene.add(board);
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.6, 1.85, 28),
            new THREE.MeshBasicMaterial({ color: pin.color, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(pin.pos.x, 0.03, pin.pos.z);
        scene.add(ring);
        pin.ring = ring;
    });

    // Landmark tower at AgenticBiz so the north end reads from the driveway.
    block(18, 188, 8, 8, 34, glassMat);

    return {
        pins,
        civicSpot: new THREE.Vector3(42, 0, 96),
        boxes,
        blocked(x, z, r = 0.4) {
            if (x < -110 || x > 102 || z < -6 || z > 450) return true;
            for (const b of boxes) {
                if (x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) return true;
            }
            return false;
        },
        shorten(from, to) {
            const dir = to.clone().sub(from);
            const len = dir.length();
            if (len < 0.25) return to.clone();
            dir.multiplyScalar(1 / len);
            let safe = from.clone().addScaledVector(dir, 0.35);
            const steps = 14;
            for (let i = 1; i <= steps; i++) {
                const p = from.clone().addScaledVector(dir, (len * i) / steps);
                let hit = false;
                for (const b of boxes) {
                    if (p.y > b.h - 0.05) continue;
                    if (p.x > b.minX - 0.2 && p.x < b.maxX + 0.2 && p.z > b.minZ - 0.2 && p.z < b.maxZ + 0.2) {
                        hit = true;
                        break;
                    }
                }
                if (hit) break;
                safe = p;
            }
            return safe;
        },
    };
}

function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function canvasTex(THREE, w, h, paint) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function sign(THREE, text, color) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#161410';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 8, 128);
    ctx.fillStyle = '#f6f1e8';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 264, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 0.8),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
    return mesh;
}

function palm(THREE, scene, x, z) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 4.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.9 })
    );
    trunk.position.set(x, 2.1, z);
    scene.add(trunk);
    const frond = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x3e6b32, roughness: 0.8 })
    );
    frond.scale.set(1, 0.4, 1);
    frond.position.set(x, 4.2, z);
    scene.add(frond);
}
