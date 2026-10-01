/**
 * A small night city north of the bay. Roads you can drive, blocks you can't.
 * Coordinates: garage sits at the origin, mouth opens toward +Z.
 */
export function buildCity(THREE, scene) {
    const boxes = [];
    const asphalt = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.92, metalness: 0.05 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xe6c84a });
    const curb = new THREE.MeshStandardMaterial({ color: 0x2a2c34, roughness: 0.8 });

    const pad = new THREE.Mesh(new THREE.PlaneGeometry(110, 100), new THREE.MeshStandardMaterial({
        color: 0x0c0d12, roughness: 1, metalness: 0,
    }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, -0.02, 36);
    pad.receiveShadow = true;
    scene.add(pad);

    function road(x, z, w, d) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), asphalt);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.015, z);
        mesh.receiveShadow = true;
        scene.add(mesh);
    }
    function dash(x, z, w, d) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.02, z);
        scene.add(mesh);
    }

    // Main strip out of the bay, plus two cross streets and a parallel.
    road(0, 40, 8, 68);
    road(0, 22, 28, 7);
    road(0, 48, 36, 7);
    road(-16, 40, 7, 40);
    road(16, 40, 7, 40);
    for (let z = 12; z < 70; z += 4) dash(0, z, 0.12, 1.4);
    for (let x = -12; x <= 12; x += 4) dash(x, 22, 1.4, 0.12);
    for (let x = -14; x <= 14; x += 4) dash(x, 48, 1.4, 0.12);

    const curbGeo = new THREE.BoxGeometry(0.18, 0.08, 1);
    [-4.1, 4.1].forEach((x) => {
        for (let z = 10; z < 70; z += 1.05) {
            if (Math.abs(z - 22) < 4 || Math.abs(z - 48) < 4) continue;
            const c = new THREE.Mesh(curbGeo, curb);
            c.position.set(x, 0.04, z);
            scene.add(c);
        }
    });

    const winCanvas = document.createElement('canvas');
    winCanvas.width = 256;
    winCanvas.height = 512;
    const wctx = winCanvas.getContext('2d');
    wctx.fillStyle = '#12141c';
    wctx.fillRect(0, 0, 256, 512);
    const warm = ['#ffd59a', '#9fd7ff', '#ff8fb8', '#1a1c28'];
    for (let row = 0; row < 14; row++) {
        for (let col = 0; col < 6; col++) {
            wctx.fillStyle = warm[(row * 3 + col) % 4];
            if ((row + col) % 5 === 0) wctx.fillStyle = '#1a1c28';
            wctx.fillRect(18 + col * 40, 16 + row * 34, 22, 16);
        }
    }
    const winTex = new THREE.CanvasTexture(winCanvas);
    winTex.colorSpace = THREE.SRGBColorSpace;
    winTex.wrapS = THREE.RepeatWrapping;
    winTex.wrapT = THREE.RepeatWrapping;

    function block(x, z, w, d, h, tint) {
        const mat = new THREE.MeshStandardMaterial({
            color: tint,
            roughness: 0.72,
            metalness: 0.18,
            map: winTex,
            emissive: tint,
            emissiveIntensity: 0.08,
            emissiveMap: winTex,
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        boxes.push({ x, z, hw: w / 2 + 0.8, hd: d / 2 + 0.8 });
        return mesh;
    }

    function sign(text, color, x, y, z, rotY) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 1024, 256);
        ctx.shadowColor = color;
        ctx.shadowBlur = 24;
        ctx.fillStyle = color;
        ctx.font = 'bold 110px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 512, 128);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(text.length * 0.42, 0.7),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
        );
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotY;
        scene.add(mesh);
    }

    // West blocks
    block(-10, 14, 6, 8, 7, 0x1a1c28);
    block(-10, 32, 6.5, 9, 11, 0x161822);
    block(-10, 58, 6, 8, 6, 0x1c1824);
    // East blocks
    block(10, 14, 6, 7, 5, 0x18141c);
    block(10, 34, 7, 10, 14, 0x12141e);
    block(10, 60, 6, 8, 8, 0x1a1820);
    // Outer
    block(-24, 22, 7, 8, 9, 0x14161e);
    block(-24, 48, 6, 9, 16, 0x101218);
    block(24, 30, 6, 8, 10, 0x16141c);
    block(24, 56, 7, 8, 7, 0x1a1620);

    sign('HUSH', '#ff4d9a', -10, 8.2, 14, 0);
    sign('AGENTIC BIZ', '#7af6ff', 10, 15.2, 34, Math.PI);
    sign('COMFORT', '#ffd59a', -24, 10.4, 48, Math.PI / 2);
    sign('BALLITO', '#ffffff', 0, 3.2, 68, 0);

    // Street lights along the strip — few, so the road reads without blowing the GPU.
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x22242c, metalness: 0.6, roughness: 0.4 });
    for (let i = 0; i < 8; i++) {
        const z = 12 + i * 7.5;
        const x = i % 2 === 0 ? -5.2 : 5.2;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 6), poleMat);
        pole.position.set(x, 2.1, z);
        scene.add(pole);
        const lamp = new THREE.PointLight(0xffe1b0, 2.2, 9, 2);
        lamp.position.set(x, 4.1, z);
        scene.add(lamp);
    }

    const pink = new THREE.PointLight(0xff4d9a, 6, 14, 2);
    pink.position.set(-10, 3, 16);
    scene.add(pink);
    const cyan = new THREE.PointLight(0x00ccff, 5, 16, 2);
    cyan.position.set(10, 6, 36);
    scene.add(cyan);

    return {
        blocked(x, z) {
            if (z < -3.35 && Math.abs(x) < 4.4) return true;
            if (Math.abs(x) > 3.75 && z < 5.6 && z > -3.6) return true;
            if (Math.abs(x) > 46 || z > 76 || z < -5) return true;
            for (const b of boxes) {
                if (Math.abs(x - b.x) < b.hw && Math.abs(z - b.z) < b.hd) return true;
            }
            return false;
        },
    };
}
