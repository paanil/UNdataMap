
// ------------------------------
// ---------- Controls ----------

function Controls(renderer, camera) {
    // --- Members ---
    this.mouseMode = -1;
    this.mouseStart = new THREE.Vector2();
    this.mouseEnd = new THREE.Vector2();
    this.sceneBoundingBox = new THREE.Box3();
    this.cameraControlPoint = new THREE.Vector3(0.0, 4.5, 0.0);
    this.renderer = renderer;
    this.camera = camera;
    
    // --- Initialization ---
    var _this = this;
    
    this.renderer.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);
    this.renderer.domElement.addEventListener('mousedown', function (event) { _this.mouseDown(event); }, false);
    this.renderer.domElement.addEventListener('mousemove', function (event) { _this.mouseMove(event); }, false);
    this.renderer.domElement.addEventListener('mouseup', function (event) { _this.mouseUp(event); }, false);
    
    // --- Methods ---
    this.update = function() {
        var mouseChange = new THREE.Vector2();
        mouseChange.copy(this.mouseEnd).sub(this.mouseStart);
        
        this.camera.rotation.x = -3.14 * 0.5;
        this.camera.rotation.y = 0.0;
        this.camera.rotation.z = 0.0;
        
        var speed = this.cameraControlPoint.y;
        
        switch (this.mouseMode) {
            case 0: // Left button - Drag
            this.cameraControlPoint.x -= mouseChange.x * speed;
            this.cameraControlPoint.z -= mouseChange.y * speed;
            break;
            
            case 1: // Middle button - Zoom
            this.cameraControlPoint.y += mouseChange.y * speed;
            break;
            
            case 2: // Right button - Rotate
            this.camera.rotation.x -= mouseChange.y * 3.14 * 0.75;
            this.camera.rotation.y = -mouseChange.x * 3.14 * 0.75;
            break;
        }
        
        this.sceneBoundingBox.clampPoint(this.cameraControlPoint, this.cameraControlPoint);
        this.camera.position.copy(this.cameraControlPoint)
        this.camera.position.y = 0.5;
        this.camera.position.add(this.camera.getWorldDirection().multiplyScalar(-this.cameraControlPoint.y));
        
        if (this.mouseMode != 2)
            this.mouseStart.copy(this.mouseEnd);
    }
    
    this.getMouseOnElement = function(elem, pageX, pageY) {
        var rect = elem.getBoundingClientRect();
        return new THREE.Vector2(
            (pageX - rect.left) / rect.width,
            (pageY - rect.top) / rect.height
        );
    }
    
    this.mouseDown = function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.mouseMode >= 0)
            return;
        
        this.mouseMode = event.button;
        
        this.mouseStart.copy(this.getMouseOnElement(this.renderer.domElement, event.pageX, event.pageY));
        this.mouseEnd.copy(this.mouseStart);
    }
    
    this.mouseMove = function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.mouseEnd.copy(this.getMouseOnElement(this.renderer.domElement, event.pageX, event.pageY));
    }

    this.mouseUp = function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (event.button != this.mouseMode)
            return;
        
        this.mouseMode = -1;
    }
}

// ------------------------------
// ---------- Map3D -------------

function Map3D(parentElement) {
    // --- Members ---
    this.container = parentElement;
    this.stats = new Stats();
    this.renderer = new THREE.WebGLRenderer({antialias: false});
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75.0, 800.0/600.0, 0.1, 100.0);
    this.controls = new Controls(this.renderer, this.camera);
    this.countries = {};
    
    // --- Methods ---
    this.onResize = function (event) {
        var rect = this.container.getBoundingClientRect();
        var screenW = rect.width;
        var screenH = rect.height;
        this.renderer.setSize(screenW, screenH);
        this.camera.aspect = screenW / screenH;
        this.camera.updateProjectionMatrix();
    }
    
    this.setMapData = function (mapData) {
        var sceneBoundingBox = this.controls.sceneBoundingBox;
        
        var loader = new THREE.JSONLoader;
        for (var index in mapData) {
            country = mapData[index];
            var name = country[0];
            var data = country[1];
            var geometry = loader.parse(data, "").geometry;
            geometry.computeBoundingBox();
            sceneBoundingBox.union(geometry.boundingBox);
            var rn = Math.random();
            //var c = 0xFFFFFF*rn;
            var rb = 0x33 * (1.0 - rn);
            var g = 0x33 + 0x99 * rn;
            var c = (rb << 16) | (g << 8) | rb;
            var material = new THREE.MeshLambertMaterial( { color: 0xFFFFFF } );
            material.setValues( { color: c } );
            var mesh = new THREE.Mesh(geometry, material);
            mesh.scale.y = 0.01;//rn;//Math.random();
            mesh.updateMatrix();
            this.scene.add(mesh);
            this.countries[name] = mesh;
        }
        sceneBoundingBox.min.y = 1.2;
        sceneBoundingBox.max.y = 3.5;
        
        this.render();
    }
    
    this.setCountryHeight = function (name, height) {
        if (this.countries.hasOwnProperty(name)) {
            var mesh = this.countries[name];
            mesh.scale.y = height;
            mesh.updateMatrix();
        }
    }
    
    this.render = function () {
        var _this = this;
        requestAnimationFrame(function () { _this.render(); });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.stats.update();
    };
    
    // --- Initialization ---
    this.stats.domElement.style.position = 'absolute';
    this.container.appendChild(this.stats.domElement);

    this.renderer.setClearColor(0x335577);
    this.renderer.setSize(800, 600);
    this.container.appendChild(this.renderer.domElement);

    var ambientLight = new THREE.AmbientLight(0x080C10);
    this.scene.add(ambientLight);

    var directionalLight1 = new THREE.DirectionalLight(0xFFD0D0, 1.0);
    directionalLight1.position.set(1.0, 1.0, -1.0);
    this.scene.add(directionalLight1);

    var directionalLight2 = new THREE.DirectionalLight(0xD0D0FF, 1.0);
    directionalLight2.position.set(-1.0, 1.0, 1.0);
    this.scene.add(directionalLight2);

    this.onResize();
    
    var _this = this;
    window.addEventListener('resize', function (event) { _this.onResize(event); }, false);
}
