/**
 * One street, GTA IV fidelity. Brick walk-ups, curbs, a worn avenue.
 * The old grid of random boxes is gone. Pins sit on the road.
 */
export function buildCity(THREE, scene) {
    const boxes = [];
    const asphalt = canvasTex(THREE, 512, 512, (ctx, w, h) => {
        ctx.fillStyle = '#454542';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 1600; i++) {
            const g = 36 + Math.floor(Math.random() * 28);
            ctx.fillStyle = `rgba(${g},${g - 2},${g - 4},0.4)`;
            ctx.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 12, 1);
        }
        ctx.strokeStyle = 'rgba(214,210,196,0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([34, 26]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();
    });
    asphalt.repeat.set(1, 8);
    const roadMat = new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.95 });
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x8f8b84, roughness: 0.97 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xb4afa6, roughness: 0.9 });
    const lotMat = new THREE.MeshStandardMaterial({ color: 0x6a6660, roughness: 1 });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 460), lotMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.05, 200);
    ground.receiveShadow = true;
    scene.add(ground);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 210), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 112);
    road.receiveShadow = true;
    scene.add(road);
    const highway = new THREE.Mesh(new THREE.PlaneGeometry(11, 190), roadMat);
    highway.rotation.x = -Math.PI / 2;
    highway.position.set(0, 0.012, 312);
    highway.receiveShadow = true;
    scene.add(highway);

    [-1, 1].forEach((side) => {
        const walk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 200), walkMat);
        walk.position.set(side * 6.15, 0.06, 108);
        walk.receiveShadow = true;
        scene.add(walk);
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 200), curbMat);
        curb.position.set(side * 4.55, 0.07, 108);
        scene.add(curb);
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.65, 170),
            new THREE.MeshStandardMaterial({ color: 0x8a8782, roughness: 0.88 })
        );
        wall.position.set(side * 5.8, 0.32, 312);
        scene.add(wall);
    });

    // face: +1 facade looks toward +X (left side of the street). -1 looks toward -X.
    const left = [
        [40, 12, 4, 0x7a4e40],
        [56, 14, 5, 0x6e463c],
        [74, 12, 3, 0x645248],
        [92, 14, 4, 0x7c5644],
        [112, 16, 6, 0x564840],
        [132, 12, 4, 0x735044],
        [150, 14, 3, 0x624c44],
        [168, 12, 4, 0x6a5048],
    ];
    const right = [
        [38, 12, 3, 0x6a564e],
        [54, 12, 4, 0x745848],
        [104, 14, 5, 0x625048],
        [124, 14, 4, 0x705444],
        [144, 12, 3, 0x5e4e46],
        [162, 14, 4, 0x6e5248],
    ];
    left.forEach((b, i) => walkup(THREE, scene, boxes, -10.6, b[0], 9.2, b[1], b[2], b[3], 1, i));
    right.forEach((b, i) => walkup(THREE, scene, boxes, 10.6, b[0], 9.2, b[1], b[2], b[3], -1, i + 4));

    [-1, 1].forEach((side, i) => {
        [46, 78, 112, 148].forEach((z, k) => lamp(THREE, scene, side * 5.5, z + i * 6 + k));
    });

    const bin = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.05, 0.75),
        new THREE.MeshStandardMaterial({ color: 0x3c5840, roughness: 0.72 })
    );
    bin.position.set(5.7, 0.62, 88);
    bin.castShadow = true;
    scene.add(bin);

    const pins = [
        { id: 'comfort', title: 'Comfort', body: 'Lead web and app. The systems that have to stay up.', pos: new THREE.Vector3(0, 0, 46), color: '#c4564a' },
        { id: 'hush', title: 'Hush', body: 'The Civic is at the right-hand curb.', pos: new THREE.Vector3(0, 0, 78), color: '#1f6f8a' },
        { id: 'agentic', title: 'AgenticBiz', body: 'Stop thinking in tickets.', pos: new THREE.Vector3(0, 0, 112), color: '#2f6b4f' },
        { id: 'ballito', title: 'Ballito', body: 'The straight north of the block is where fifth gear lives.', pos: new THREE.Vector3(0, 0, 150), color: '#c4a15a' },
    ];
    pins.forEach((pin) => {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.35, 1.55, 24),
            new THREE.MeshBasicMaterial({ color: pin.color, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(pin.pos.x, 0.025, pin.pos.z);
        scene.add(ring);
        pin.ring = ring;
    });

    return {
        pins,
        civicSpot: new THREE.Vector3(2.9, 0, 70),
        boxes,
        blocked(x, z, r = 0.35) {
            if (x < -24 || x > 24 || z < -6 || z > 420) return true;
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
            let safe = from.clone().addScaledVector(dir, 0.3);
            for (let i = 1; i <= 12; i++) {
                const p = from.clone().addScaledVector(dir, (len * i) / 12);
                let hit = false;
                for (const b of boxes) {
                    if (p.y > b.h - 0.05) continue;
                    if (p.x > b.minX - 0.12 && p.x < b.maxX + 0.12 && p.z > b.minZ - 0.12 && p.z < b.maxZ + 0.12) {
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

function walkup(THREE, scene, boxes, x, z, depth, span, floors, brick, face, seed) {
    const h = 1.05 + floors * 2.55;
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(depth, h, span),
        new THREE.MeshStandardMaterial({ color: brick, roughness: 0.93 })
    );
    body.position.set(x, h / 2, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    boxes.push({
        minX: x - depth / 2, maxX: x + depth / 2,
        minZ: z - span / 2, maxZ: z + span / 2,
        h,
    });

    const faceMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(span * 0.98, h * 0.98),
        new THREE.MeshStandardMaterial({ map: facade(THREE, floors, brick, seed), roughness: 0.88, side: THREE.DoubleSide })
    );
    faceMesh.position.set(x + face * (depth / 2 + 0.02), h / 2, z);
    faceMesh.rotation.y = face > 0 ? -Math.PI / 2 : Math.PI / 2;
    scene.add(faceMesh);

    if (seed % 2 === 0) {
        for (let f = 1; f < floors; f++) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(0.45, 0.04, span * 0.62),
                new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: 0.55, metalness: 0.35 })
            );
            rail.position.set(x + face * (depth / 2 + 0.26), 1.15 + f * 2.55, z);
            scene.add(rail);
        }
    }
    const lip = new THREE.Mesh(
        new THREE.BoxGeometry(depth + 0.25, 0.16, span + 0.2),
        new THREE.MeshStandardMaterial({ color: 0x3a3532, roughness: 0.82 })
    );
    lip.position.set(x, h + 0.06, z);
    scene.add(lip);
}

function facade(THREE, floors, brick, seed) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext('2d');
    const hex = '#' + brick.toString(16).padStart(6, '0');
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, 256, 512);
    for (let row = 0; row < 80; row++) {
        const y = row * 6;
        const off = row % 2 ? 9 : 0;
        ctx.strokeStyle = 'rgba(40,22,16,0.45)';
        ctx.strokeRect(0, y, 256, 6);
        for (let x = off; x < 256; x += 18) {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(x, y + 1, 16, 4);
        }
    }
    ctx.fillStyle = '#2e2a28';
    ctx.fillRect(0, 408, 256, 104);
    ctx.fillStyle = '#141c24';
    ctx.fillRect(18, 432, 78, 48);
    ctx.fillRect(156, 432, 78, 48);
    ctx.fillStyle = '#5c4e40';
    ctx.fillRect(112, 438, 26, 58);
    for (let f = 0; f < Math.min(floors, 6); f++) {
        const y = 348 - f * 62;
        for (let col = 0; col < 3; col++) {
            const x = 22 + col * 78;
            ctx.fillStyle = '#ddd6cc';
            ctx.fillRect(x - 3, y - 3, 48, 38);
            const on = (seed + f * 2 + col) % 4 !== 0;
            ctx.fillStyle = on ? '#1a2730' : '#f3e6bf';
            ctx.fillRect(x, y, 42, 30);
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(x + 20, y, 1, 30);
        }
    }
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
}

function lamp(THREE, scene, x, z) {
    const metal = new THREE.MeshStandardMaterial({ color: 0x2c2e32, roughness: 0.5, metalness: 0.5 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4.6, 6), metal);
    pole.position.set(x, 2.3, z);
    scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.06), metal);
    arm.position.set(x + (x < 0 ? 0.3 : -0.3), 4.5, z);
    scene.add(arm);
    const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.08, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xfff3cc, emissive: 0xffe6a4, emissiveIntensity: 0.55 })
    );
    bulb.position.set(x + (x < 0 ? 0.55 : -0.55), 4.42, z);
    scene.add(bulb);
}

function canvasTex(THREE, w, h, paint) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}
