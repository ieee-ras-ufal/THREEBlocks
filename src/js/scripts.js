import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import Stats from 'stats.js';
import * as math from 'mathjs'

class SpringCurve extends THREE.Curve {

	constructor( scale = 1, left, right) {
		super();
		this.scale = scale;
		this.left = left;
		this.right = right;
	}

	getPoint( t, optionalTarget = new THREE.Vector3() ) {
		const w = 10;

		let xl, xr;

		if (typeof(this.left) != 'number') {
			xl = this.left.position.x;
		} else {
			xl = this.left;
		}

		if (typeof(this.right) != 'number') {
			xr = this.right.position.x;
		} else {
			xr = this.right;
		}

		const tx = xl  + (xr - xl) * t ;
		const ty = 0.1 * Math.sin(2 * Math.PI * t * w);
		const tz = 0.1 * Math.cos(2 * Math.PI * t * w);

		return optionalTarget.set( tx, ty, tz ).multiplyScalar( this.scale );
	}

}

const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const orbit = new OrbitControls( camera, renderer.domElement );

const axesHelper = new THREE.AxesHelper( 10 );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );

const materials = [ new THREE.MeshBasicMaterial( { color: 0x00ff00 } ), new THREE.MeshBasicMaterial( { color: 0xff0000 } )];
const cubes = [];

for (let i = 0; i < materials.length; i += 1) {
	cubes.push( new THREE.Mesh( geometry, materials[i] ) );
}

const dragControls = new DragControls( cubes, camera, renderer.domElement );

var stats = new Stats();

let simulate = true;

let X0 = math.matrix([2., 5.]);

const m = 3.;
const b = 0.01;
const k = 1.1;

let clock = new THREE.Clock();
let delta = 0;
let dt = 1 / 60.;

function init() {
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor(new THREE.Color( 0xdddddd ));
	document.body.appendChild( renderer.domElement );
	
	camera.position.set( 5, 5, 5 );
	orbit.update();

	scene.add( axesHelper );

	for (let i = 0; i < cubes.length; i += 1) {
		scene.add( cubes[i] );
		cubes[i].position.x = X0._data[i];
	}

	dragControls.addEventListener( 'dragstart', function ( event ) {
		console.log('drag start');
		orbit.enabled = false;
		simulate = !simulate;
	});
	
	dragControls.addEventListener ( 'drag', function( event ){
		console.log('drag');
		event.object.position.z = 0; // This will prevent moving z axis, but will be on 0 line. change this to your object position of z axis.
		event.object.position.y = 0; // This will prevent moving z axis, but will be on 0 line. change this to your object position of z axis.
	});
	
	dragControls.addEventListener( 'dragend', function ( event ) {
		console.log('drag end');
		orbit.enabled = true;
		simulate = !simulate;
	});

	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );
}

let A = math.matrix([[0., 1., 0., 0.], [-2*k/m, -b/m, k/m, 0.], [0., 0., 0., 1.], [k/m, -k/m, 0, -b/m]]);

let Z = math.matrix([0., 0., 0., 0.]);

function f(Z) {
	return math.multiply(A, Z);
}

const path = new SpringCurve(1., 0., 2.); // Mola
const spring_geometry = new THREE.TubeGeometry( path, 100, 0.015, 3, false );

const spring_material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
const spring = new THREE.Mesh( spring_geometry, spring_material );

scene.add( spring );

function animate() {
	requestAnimationFrame( animate );
	
	stats.begin();

	delta += clock.getDelta();

	if (delta  > dt) {
		// The draw or time dependent code are here

		if ( simulate ) {
			/*k1 = f( Z );
			k2 = math.multiply(
				2., f( math.add( math.multiply(0.5*dt, k1), Z ) )
			);
			k3 = math.multiply(
				2., f( math.add( math.multiply(0.5*dt, k2), Z ) )
			);
			k4 = f( math.add( math.multiply(dt, k3), Z ) );

			Z = math.add( Z, math.multiply( dt/6., math.add(k1, k2, k3, k4) )  );*/

			Z = math.multiply(A, Z);
			
			cubes[0].position.x = X0._data[0] + Z._data[0];
			cubes[1].position.x = X0._data[1] + Z._data[2];

		} else {
			Z = math.matrix([cubes[0].position.x - X0._data[0], 0., cubes[1].position.x - X0._data[1], 0.]);
		}

		renderer.render( scene, camera );
 
		delta = delta % dt;
	}

	stats.end();
}

init();
animate();
