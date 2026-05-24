import { THREE } from './three-setup.js';

export function createEnvMap(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x08080c);

    // Warm ceiling strip (simulates overhead garage light)
    const ceilLight = new THREE.PointLight(0xfff5e6, 60, 30);
    ceilLight.position.set(0, 8, 0);
    envScene.add(ceilLight);

    // Side accent (warm, dim)
    const sideLight = new THREE.PointLight(0xffddaa, 30, 25);
    sideLight.position.set(4, 5, 2);
    envScene.add(sideLight);

    // Floor (dark)
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
    );
    floor.rotation.x = -Math.PI / 2;
    envScene.add(floor);

    // Back wall (slightly warm)
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 6),
        new THREE.MeshBasicMaterial({ color: 0x0c0c10 })
    );
    backWall.position.set(0, 3, -5);
    envScene.add(backWall);

    // Small bright spots for reflection highlights
    const h1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.02, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xfff8f0 })
    );
    h1.position.set(0, 4, -4.9);
    envScene.add(h1);

    const h2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xeeeeff })
    );
    h2.position.set(-2, 3, -4.9);
    envScene.add(h2);

    return pmrem.fromScene(envScene, 0.04).texture;
}

export function makeFlakeBlackPaint(envMap) {
    return new THREE.MeshPhysicalMaterial({
        color: 0x050505,
        metalness: 0.95,
        roughness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMap: envMap,
        envMapIntensity: 2.0,
        reflectivity: 1.0,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xffffff),
        sheen: 0.5,
        sheenRoughness: 0.15,
        sheenColor: new THREE.Color(0x666688),
    });
}

export function makeNeonMaterial(color, intensity = 2.5) {
    return new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: intensity,
        metalness: 0.1, roughness: 0.3
    });
}
