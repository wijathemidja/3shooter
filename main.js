import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Load GLB map
const loader = new GLTFLoader();
loader.load('path/to/your/map.glb', (gltf) => {
    scene.add(gltf.scene);
});

// Player variables
const player = {
    velocity: new THREE.Vector3(),
    position: new THREE.Vector3(0, 1.5, 5),
    canJump: true,
    jumps: 2,
};
camera.position.copy(player.position);

// Movement input
const keys = {};
window.addEventListener('keydown', (e) => (keys[e.key] = true));
window.addEventListener('keyup', (e) => (keys[e.key] = false));

// Look input (Arrow keys & Trackpad)
let lookX = 0, lookY = 0;
window.addEventListener('mousemove', (e) => {
    lookX += e.movementX * 0.002;
    lookY += e.movementY * 0.002;
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') lookX -= 0.05;
    if (e.key === 'ArrowRight') lookX += 0.05;
    if (e.key === 'ArrowUp') lookY -= 0.05;
    if (e.key === 'ArrowDown') lookY += 0.05;
});

// Shooting
window.addEventListener('click', () => shoot());
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') shoot();
});

function shoot() {
    const raycaster = new THREE.Raycaster(camera.position, camera.getWorldDirection(new THREE.Vector3()));
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        console.log('Hit:', intersects[0].object);
    }
}

// Update loop
function update() {
    const speed = 0.05;
    const direction = new THREE.Vector3();

    if (keys['w']) direction.z -= speed;
    if (keys['s']) direction.z += speed;
    if (keys['a']) direction.x -= speed;
    if (keys['d']) direction.x += speed;
    if (keys[' ']) jump();

    player.velocity.add(direction);
    player.velocity.y -= 0.01; // Gravity
    player.position.add(player.velocity);
    camera.position.copy(player.position);
    camera.rotation.set(lookY, lookX, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(update);
}

function jump() {
    if (player.jumps > 0) {
        player.velocity.y = 0.2;
        player.jumps--;
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

update();
