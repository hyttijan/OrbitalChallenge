$(document).ready(function () {
    
  
    var scene, camera, renderer, loader;
    var earthGeometry, earth, earthMaterial;
    var spaceGeometry, space, spaceMaterial;
    var satelitesGeometry, satellites, satellitesMaterial,startMaterial,endMaterial;
    var labels;
    var lines;
    var controls;
    init();
    animate();

    function init() {

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500000);
            camera.position.z = 12000;
	        camera.minDistance = 4000;
	        camera.maxDistance = 19000;

            spaceGeometry = new THREE.SphereGeometry(400000, 64, 64);
            spaceMaterial = new THREE.MeshBasicMaterial({map:THREE.ImageUtils.loadTexture('textures/spaceTexture.png')});
            space = new THREE.Mesh(spaceGeometry, spaceMaterial);
            space.material.side = THREE.DoubleSide;
            space.position.x = 0;
            space.position.y = 0;
            space.position.z = 0;
          
            earthGeometry = new THREE.SphereGeometry(6371, 128,128);
            earthMaterial = new THREE.MeshBasicMaterial({map:THREE.ImageUtils.loadTexture('textures/earthTexture.jpeg')});
            earth = new THREE.Mesh(earthGeometry, earthMaterial);
            earth.position.x = 0;
            earth.position.y = 0;
            earth.position.z = 0;

            initializeSatellites();
            var button =  $("<button>randomize satellites</button>").addClass("btn btn-primary");
            button.onclick = initializeSatellites;
            $("#form").append(button);
            scene.add(space);
            scene.add(earth);
            renderer = new THREE.WebGLRenderer();
            renderer.setSize(window.innerWidth / 1.008, window.innerHeight / 1.008);
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.minDistance = 7000;
	        controls.maxDistance = 19000;
            $("#screen").append(renderer.domElement);        
    }

    function animate() {
        requestAnimationFrame(animate);
	    controls.rotateLeft(0.0005);
        controls.update();
        renderer.render(scene, camera);
    }
  
    function clearObjects(objects){
        for(var i=0;i<objects.length;i++){
                 scene.remove(objects[i]);
        }
    }
 
    function handleSuccess(response){
        $("#loading").text("Done")
        strToSatellites(response.split("\n"));
    }
    function handleError(error){
        $("#loading").text(error);
    }

    function initializeSatellites(){
        $("#loading").text("Loading...");
        var xhr = new XMLHttpRequest();
        var index = Math.round(Math.random()*4)+1;
        xhr.open("GET","satellitefiles/satellites"+index+".csv",true);
        xhr.send(null);
        xhr.onreadystatechange = function(){
            if(xhr.readyState===XMLHttpRequest.DONE){
                if(xhr.status===200){
                    handleSuccess(xhr.responseText);
                }
                else{
                    handleError(xhr.status);
                }
             
            }
            else if(xhr.readyState === XMLHttpRequest.timeout){
                handleError("Request timeout");
            }
        }; 
    }

    function strToSatellites(satellitesStr){
        if(satellites!==undefined){
            clearObjects(satellites);
        }
        if(lines!==undefined){
            clearObjects(lines);
         }
        satellites = [];
        for(var i=0;i<satellitesStr.length-3;i++){
            var coordinates = satellitesStr[i+1].split(",");
            coordinates = convertToCartesianCoordinates(coordinates.slice(1));
            var x = coordinates[0];
            var y = coordinates[1];
            var z = coordinates[2];
            satellites[i] = createSatellite(x,y,z);
            scene.add(satellites[i]);
        }
       
        
        var coordinates = satellitesStr[satellitesStr.length-2].split(",");
        var coordinates1 = convertToCartesianCoordinates(coordinates.slice(1,3));
        var x = coordinates1[0];
        var y = coordinates1[1];
        var z = coordinates1[2];
        satellites[0] = createSatellite(x,y,z);
        satellites[0].material.color.setHex(0x00ff00);
        scene.add(satellites[0]);
        var coordinates2 = convertToCartesianCoordinates(coordinates.slice(3,5));
        x = coordinates2[0];
        y = coordinates2[1];
        z = coordinates2[2];
        satellites[satellites.length-1] = createSatellite(x,y,z);
        satellites[satellites.length-1].material.color.setHex(0xff00ff);
        scene.add(satellites[satellites.length-1]);
        vertexes = initializeVertexes();
        dijkstraAlgorithm(vertexes);
    
        
        
    }
    function createSatellite(x,y,z){
        var satelliteMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});
        var satelliteGeometry = new THREE.SphereGeometry(100, 32, 32);
        var satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
        satellite.position.x = x;
        satellite.position.y = y;
        satellite.position.z = z;
        return satellite;
    }
    function lineCollideWithEarth(startPoint,endPoint,earthPoint){
        var line = new THREE.Line3(new THREE.Vector3(startPoint.position.x,startPoint.position.y,startPoint.position.z),
                                   new THREE.Vector3(endPoint.position.x,endPoint.position.y,endPoint.position.z));
        var closestPoint = line.closestPointToPoint(earthPoint);
        return closestPoint.distanceTo(earthPoint)>6371;
    }
    function convertToCartesianCoordinates(coordinates){
        var latitude = coordinates[0]*Math.PI/180.00;
        var longitude= coordinates[1]*Math.PI/180.00;
        var altitude = coordinates.length>2 ? coordinates[2]:100;
        var r = 6371+parseInt(altitude);
        var cartesian = []
        cartesian[0] = r*Math.cos(latitude)*Math.cos(longitude);
        cartesian[1] =  r * Math.cos(latitude)*Math.sin(longitude);
        cartesian[2]= r * Math.sin(latitude);
        return cartesian;
    }
    function drawRoute(path){
          
            lines = [];
            var lineMaterial = new THREE.LineBasicMaterial(0xffffff);
            var geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(satellites[satellites.length-1].position.x, satellites[satellites.length-1].position.y, satellites[satellites.length-1].position.z));
            geometry.vertices.push(new THREE.Vector3(satellites[path[satellites.length-1]].position.x, satellites[path[satellites.length-1]].position.y, satellites[path[satellites.length-1]].position.z));
            var index = lines.push(new THREE.Line(geometry, lineMaterial))-1;
            scene.add(lines[index]);
            var i = path[satellites.length-1];
            while (i != 0) {
                geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3(satellites[i].position.x, satellites[i].position.y, satellites[i].position.z));
                geometry.vertices.push(new THREE.Vector3(satellites[path[i]].position.x, satellites[path[i]].position.y, satellites[path[i]].position.z));
                index = lines.push(new THREE.Line(geometry, lineMaterial))-1;
                scene.add(lines[index]);
                i = path[i];
            }   
    }
    function dijkstraAlgorithm(vertexes) {
        
        var pq = new PriorityQueue();
        var processed = [];
        var distance = [];
        var path = [];
        for (var i = 0; i < satellites.length; i++) {
            processed[i] = false;
            distance[i] = Number.MAX_VALUE;
        }
        distance[0] = 0;
        pq.enqueue(0,{to: 0});
        while (!pq.isEmpty()) {
            var u = pq.dequeue();
            if (processed[u.to])
                continue;
            processed[u.to] = true;
            for (var i = 0; i < vertexes[u.to].length; i++) {       
                if (distance[vertexes[u.to][i].to] > distance[u.to] + vertexes[u.to][i].distance) {
                    distance[vertexes[u.to][i].to] = distance[u.to] + vertexes[u.to][i].distance;
                    path[vertexes[u.to][i].to] = u.to;
                    pq.enqueue(distance[vertexes[u.to].to], {to: vertexes[u.to][i].to});
                  
                }
            }
        }
        if (path[satellites.length-1]!==undefined) {
            drawRoute(path);
        }
        else{
            $("#loading").text("No routes available for current set of satellites");
        }
        
       
    }
    function initializeVertexes() {
        vertexes = [];
        for (var i = 0; i < satellites.length; i++) {
            vertexes[i] = [];
        }
        var earthPoint = new THREE.Vector3(earth.position.x,earth.position.y,earth.position.z);
        for (var i = 0; i < satellites.length; i++) {
            for (var j = 0; j < satellites.length; j++) {
                if (i != j) {
                    if (lineCollideWithEarth(satellites[i],satellites[j],earthPoint)){          
                        var x = satellites[i].position.x - satellites[j].position.x;
                        var y = satellites[i].position.y - satellites[j].position.y;
                        var z = satellites[i].position.z - satellites[j].position.z;
                        var distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
                        vertexes[i].push({to: j, distance: distance});
                    }
                }
            }
        }
        return vertexes;
    }

});



