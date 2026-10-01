/**
 * Tongaat driveway, matched to the reference photos: open yard, house on one
 * side, low boundary wall on the other, street out the front. No enclosing
 * garage. Colliders are the buildings, and the camera is shortened against
 * them so it never sits inside a wall.
 */
export function createDayEnv(THREE, renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x8eb6dc);
    env.add(new THREE.HemisphereLight(0xb7d4ee, 0x8a735c, 1));
    const sun = new THREE.DirectionalLight(0xfff3e4, 2.4);
    sun.position.set(12, 18, 6);
    env.add(sun);
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.MeshBasicMaterial({ color: 0x9a846c })
    );
    ground.rotation.x = -Math.PI / 2;
    env.add(ground);
    const tex = pmrem.fromScene(env, 0.02).texture;
    pmrem.dispose();
    return tex;
}

export function buildYard(THREE, scene) {
    const boxes = [];

    function solid(x, z, w, d, h, mat, y0 = 0) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y0 + h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        boxes.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h: y0 + h });
        return mesh;
    }

    const asphalt = canvasTex(THREE, 512, 512, (ctx, w, h) => {
        ctx.fillStyle = '#6d6a66';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 1400; i++) {
            ctx.fillStyle = `rgba(40,38,34,${0.15 + Math.random() * 0.35})`;
            ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 8, 1);
        }
        ctx.strokeStyle = 'rgba(30,28,24,0.45)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 18; i++) {
            ctx.beginPath();
            let x = Math.random() * w;
            let y = Math.random() * h;
            ctx.moveTo(x, y);
            for (let s = 0; s < 6; s++) {
                x += (Math.random() - 0.5) * 80;
                y += (Math.random() - 0.5) * 40;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(70,110,60,0.35)';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.ellipse(Math.random() * w, Math.random() * h, 8, 4, Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }
    });
    const verge = canvasTex(THREE, 256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#7d8a62';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 600; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#6a784f' : '#8d9a70';
            ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
        }
    });
    const stucco = canvasTex(THREE, 256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#e7e0d4';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 2000; i++) {
            ctx.fillStyle = `rgba(120,110,96,${Math.random() * 0.18})`;
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
    });
    const tile = new THREE.MeshStandardMaterial({ color: 0x8d5a42, roughness: 0.85 });
    const stuccoMat = new THREE.MeshStandardMaterial({ map: stucco, roughness: 0.92, color: 0xffffff });
    const wallGrey = new THREE.MeshStandardMaterial({ color: 0xb7b2aa, roughness: 0.95 });
    const asphaltMat = new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.92, metalness: 0.02 });
    const vergeMat = new THREE.MeshStandardMaterial({ map: verge, roughness: 1 });

    const yard = new THREE.Mesh(new THREE.PlaneGeometry(80, 90), vergeMat);
    yard.rotation.x = -Math.PI / 2;
    yard.position.set(0, -0.02, 24);
    yard.receiveShadow = true;
    scene.add(yard);

    const drive = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 14), asphaltMat);
    drive.rotation.x = -Math.PI / 2;
    drive.position.set(0.2, 0, 4);
    drive.receiveShadow = true;
    scene.add(drive);

    const street = new THREE.Mesh(new THREE.PlaneGeometry(9, 48), asphaltMat);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0.005, 32);
    street.receiveShadow = true;
    scene.add(street);

    // House tight on the left of the driveway — barred windows, tiled roof. From the photos.
    solid(-5.1, 3.2, 5.4, 10, 3.15, stuccoMat);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.28, 10.4), tile);
    roof.position.set(-5.1, 3.35, 3.2);
    roof.rotation.z = 0.08;
    roof.castShadow = true;
    scene.add(roof);
    addWindows(THREE, scene, -2.35, 3.2, 0, 4);

    // Low boundary wall on the right. Camera at eye height clears it; the body does not.
    solid(2.85, 3.4, 0.22, 11, 1.35, wallGrey);

    // Facade behind the parked car, so the nose points at open street, tail at the house.
    solid(0.1, -1.6, 6.2, 0.28, 3.2, stuccoMat);
    addWindows(THREE, scene, 0.1, -1.42, 1, 2);

    // Street houses, set back so the road stays clear.
    const fronts = [
        [-9.2, 18, 6, 7, 3.4],
        [-9.4, 30, 5.5, 8, 4.2],
        [-8.8, 44, 6, 7, 3.1],
        [8.6, 20, 5.5, 8, 3.6],
        [9.1, 34, 6, 7, 5.1],
        [8.4, 48, 5.2, 8, 3.3],
    ];
    fronts.forEach((b, i) => {
        solid(b[0], b[1], b[2], b[3], b[4], i % 2 ? wallGrey : stuccoMat);
        const r = new THREE.Mesh(new THREE.BoxGeometry(b[2] + 0.4, 0.22, b[3] + 0.3), tile);
        r.position.set(b[0], b[4] + 0.12, b[1]);
        scene.add(r);
    });

    palm(THREE, scene, 4.2, -0.4);
    palm(THREE, scene, 4.6, 8.5);
    palm(THREE, scene, -8.2, 12);

    // Laptop table against the house, in the driveway, not inside a wall.
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.7 });
    const table = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.45), wood);
    top.position.y = 0.72;
    top.castShadow = true;
    table.add(top);
    scene.add(table);
    table.position.set(-1.55, 0, 5.4);

    return {
        laptopSpot: new THREE.Vector3(-1.55, 0, 5.4),
        blocked(x, z, r = 0.32) {
            if (x < -22 || x > 22 || z < -4.2 || z > 58) return true;
            for (const b of boxes) {
                if (x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) return true;
            }
            return false;
        },
        // Pull a camera back along from→to until it is clear of every solid.
        // Low walls are skipped once the camera is above them.
        shorten(from, to) {
            const dir = to.clone().sub(from);
            const len = dir.length();
            if (len < 0.25) return to.clone();
            dir.multiplyScalar(1 / len);
            let safe = from.clone().addScaledVector(dir, 0.35);
            const steps = 16;
            for (let i = 1; i <= steps; i++) {
                const p = from.clone().addScaledVector(dir, (len * i) / steps);
                let hit = false;
                for (const b of boxes) {
                    if (p.y > b.h - 0.05) continue;
                    if (p.x > b.minX - 0.15 && p.x < b.maxX + 0.15 && p.z > b.minZ - 0.15 && p.z < b.maxZ + 0.15) {
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

function addWindows(THREE, scene, x, z, face, count) {
    const frame = new THREE.MeshStandardMaterial({ color: 0x5c4636, roughness: 0.6 });
    const glass = new THREE.MeshStandardMaterial({
        color: 0x9bb7c9, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.55,
    });
    const bar = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4, metalness: 0.3 });
    for (let i = 0; i < count; i++) {
        const group = new THREE.Group();
        const g = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.85), glass);
        group.add(g);
        const fr = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.92, 0.04), frame);
        fr.position.z = -0.02;
        group.add(fr);
        for (let k = -1; k <= 1; k++) {
            const v = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.85, 0.03), bar);
            v.position.set(k * 0.22, 0, 0.03);
            group.add(v);
        }
        for (let k = -1; k <= 1; k++) {
            const h = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.03), bar);
            h.position.set(0, k * 0.22, 0.03);
            group.add(h);
        }
        if (face === 0) {
            group.position.set(x, 1.7, z - 3 + i * 2.2);
            group.rotation.y = Math.PI / 2;
        } else {
            group.position.set(x - 1.4 + i * 1.6, 1.7, z);
        }
        scene.add(group);
    }
}

function palm(THREE, scene, x, z) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 3.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.9 })
    );
    trunk.position.set(x, 1.6, z);
    trunk.castShadow = true;
    scene.add(trunk);
    const frond = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x3e6b32, roughness: 0.8 })
    );
    frond.scale.set(1, 0.45, 1);
    frond.position.set(x, 3.2, z);
    frond.castShadow = true;
    scene.add(frond);
}
