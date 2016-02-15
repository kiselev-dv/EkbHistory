APP = {
    articles: {
        'the_begining': {
            include: 'content/the_begining.html',
            arrow: '23px'
        },
        'l1750': {
            include: 'content/1750.html',
            arrow: '130px'
        },
        'l1924': {
            include: 'content/1924.html',
            arrow: '420px'
        }
    }
};

angular.module('CHistory', ['rzModule', 'mePathParser'])
    .config(['$locationProvider', function($locationProvider) {
	    $locationProvider.hashPrefix('!');
    }]).controller('MenuController', 
        ['$scope', '$location', 'pathParseService', 
        function($scope, $location, pathParser) {

    $scope.menu = {};
    
    pathParser.parameter("article");
    pathParser.parameter("feature");
    
    $scope.$on('$locationChangeSuccess', function(){
        var p = pathParser.getParameters();
        if (p.article && APP.articles[p.article]) {
            $scope.article = APP.articles[p.article];
        }
        else {
            $scope.article = null;
        }
        
        if(p.feature) {
            APP.zoomToEntry(p.feature);
        }
    });
    
    sa = [];
    for(var i = 2020; i >= 1720; i-=10) {
        sa.push(i);
    }
    sa[0] = 2016;
    sa[sa.length - 1] = 1723;
    
    $scope.slider = {
        value: 0,
        options: {
            vertical: true, stepsArray: sa,
            onChange: $scope.sliderUpdate
        }
    };
    
    $scope.menu.layers = [{
            name: 'l1750', label: '1750', active: true, opacity: '1'
        },{
            name: 'l1924', label: '1924', active: true, opacity: '1',
            note: 'Town renamed to Sverdlovsk (Свердловск)'
        }
    ];
    
    $scope.updateLayers = function() {
        for (var i = 0; i < $scope.menu.layers.length; i++) {
            if ($scope.menu.layers[i].active ) {
                APP.show && APP.show($scope.menu.layers[i].name);
            }
            else {
                APP.hide && APP.hide($scope.menu.layers[i].name);
            }
        }
    };
    
    $scope.updateOpacity = function(layer) {
        APP.setAlpha(layer.name, parseFloat(layer.opacity));
    };
    
    $scope.$watch('slider.value', function() {
        var v = $scope.slider.options.stepsArray[$scope.slider.value];
        if (v >= 1723 && v <= 1830) {
            $scope.menu.layers[0].active = true;
            $scope.menu.layers[1].active = false;
        }
        if (v > 1830 && v < 1980) {
            $scope.menu.layers[0].active = false;
            $scope.menu.layers[1].active = true;
        }
        if(v >= 1980) {
            $scope.menu.layers[0].active = false;
            $scope.menu.layers[1].active = false;
        }
        if (v >= 1920 && v <= 1990) {
            if('Sverdlovsk' !== APP.name) {
                APP.setName && APP.setName('Sverdlovsk');
                APP.name = 'Sverdlovsk';        
            }
        }
        else {
            if('Yekaterinburg' !== APP.name) {
                APP.setName && APP.setName('Yekaterinburg');
                APP.name = 'Yekaterinburg';        
            }
        }
        
        APP.filterEtityByY(v);
        
        $scope.updateLayers();
    });
    
}]);

(function(){
    
    var viewer = new Cesium.Viewer('cesiumContainer', {
        timeline:false,
        navigationInstructionsInitiallyVisible:false,
        animation: false
    });
    
    setupImagery();
    setupScene();
    loadData();
    
    function loadData() {
        var entityByName = {};
        var promise = Cesium.KmlDataSource.load('assets/foto.kml');
        promise.then(function(dataSource) {
            viewer.dataSources.add(dataSource);
            var entities = dataSource.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                var ed = entity.kml.extendedData;
                
                entityByName[entity.id] = {
                    'entity': entity,
                    since: parseInt(ed.since.value),
                    to: parseInt(ed.to.value)
                };
            }
        });
        
        APP.filterEtityByY = function(y) {
            for (var k in entityByName) {
                if(entityByName.hasOwnProperty(k)) {
                    var s = entityByName[k].since;
                    var t = entityByName[k].to;
                    entityByName[k].entity.show = (y >= s && y <= t);
                }
            }
        };
        
        var heading = Cesium.Math.toRadians(0);
        var pitch = Cesium.Math.toRadians(-30);
        var distanceMeters = 500;
        var enityHeading = new Cesium.HeadingPitchRange(heading, pitch, distanceMeters);
        
        APP.zoomToEntry = function(name) {
            if(name && entityByName[name]) {
                viewer.zoomTo(entityByName[name].entity, enityHeading);
            }
        };
    }

    function setupImagery() {
        var layers = viewer.scene.imageryLayers;
        
        var s = 56.8321929;
        var n = 56.8442609;
        var w = 60.5878970;
        var e = 60.6187892;
        
        var l1750 = layers.addImageryProvider(new Cesium.SingleTileImageryProvider({
            url: 'assets/1750.png',
            rectangle: Cesium.Rectangle.fromDegrees(w,s,e,n),
            credit: 'retromap.ru',
        }));
        
        l1750.alpha = 1;
        
        var l1924 = layers.addImageryProvider(new Cesium.TileMapServiceImageryProvider({
            url: 'assets/1924t',
            minimumLevel: 8,
            maximumLevel: 16,
            credit: 'retromap.ru'
        }));
        
        l1924.alpha = 1;

        var layersHash = {
            'l1750': l1750,
            'l1924': l1924
        }

        APP.setAlpha = function(layer, alpha) {
            if(layersHash[layer] && layersHash[layer].alpha !== undefined) {
                layersHash[layer].alpha = alpha;
            }            
        };
        
        APP.show = function(layer) {
            if(layersHash[layer] && layers.indexOf(layersHash[layer]) < 0) {
                layers.add(layersHash[layer]);
            }            
        };
        
        APP.hide = function(layer) {
            if(layersHash[layer] && layers.indexOf(layersHash[layer]) >= 0) {
                layers.remove(layersHash[layer], false);
            }            
        };
    }

    function setupScene() {
        
        // How to place camera around point
        var heading = Cesium.Math.toRadians(0);
        var pitch = Cesium.Math.toRadians(-30);
        var distanceMeters = 10000;
        
        // Zoom to
        var ekb = viewer.entities.add(ekbEntity());
        viewer.zoomTo(ekb, new Cesium.HeadingPitchRange(heading, pitch, distanceMeters));
        
        APP.setName = function(name) {
            ekb.label.text = name;
        }
    }
    
    function ekbEntity() {
        return {
            name : 'Yekaterinburg',
            // Lon, Lat coordinates
            position : Cesium.Cartesian3.fromDegrees(60.6054, 56.8389),
            // Styled geometry
            point : {
                pixelSize : 5,
                color : Cesium.Color.RED
            },
            // Labeling
            label : {
                text : 'Yekaterinburg',
                font : '16pt monospace',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth : 2,
                verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                pixelOffset : new Cesium.Cartesian2(0, -9)
            }
        };
    }
})();
