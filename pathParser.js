angular.module('mePathParser', []).factory(
    'pathParseService', ['$location', function($location) {  
	
	function meRouter() {
		this.parameters = [];
		this.byName = {};
	}
	
	meRouter.prototype.parameter = function(name, slashes, skipSave, escape) {
		var o = {
			'name': name,
			'type': 'parameter',
			'escape': escape || true,
			'slashes': slashes || 0,
			'skipSave': skipSave || false
		};
	
		if (!this.byName[name]) {
			this.parameters.push(o);
			this.byName[name] = o;
		}
	};
	
	meRouter.prototype.anonymous = function(name, slashes, skipSave, escape) {
		var o = {
			'name': name,
			'type': 'anonymous',
			'escape': escape || true,
			'skipSave': skipSave || false
		};
		
		if (!this.byName[name]) {
			this.parameters.push(o);
			this.byName[name] = o;
		}
	};
	
	meRouter.prototype.flag = function(name, skipSave) {
		var o = {
			'name': name,
			'type': 'flag',
			'skipSave': skipSave || false
		};
		
		if (!this.byName[name]) {
			this.parameters.push(o);
			this.byName[name] = o;
		}
	};
	
	meRouter.prototype.template = function() {
		var s = '/';
		angular.forEach(this.parameters, function(p){
			if(p.type == 'anonymous') {
				s += ":" + p.name + "/";
			}
			if(p.type == 'flag') {
				s += "?" + p.name + "/";
			}
			if(p.type == 'parameter') {
				s += p.name + "/" + ":" + p.name + "/";
				if(p.slashes) {
					for(var i = 0;i < p.slashes - 1; i++) {
						s +=  ":" + p.name + "/";
					}
				}
			}
		});
		return s;
	};
	
	meRouter.prototype.getParameters = function() {
		var path = [];
		
		angular.forEach($location.path().split('/'), function(e){
			if(e) {
				path.push(e);
			}
		});
		
		var lastArgI = 0;
		var result = {};
		for(var i = 0; i < path.length; i++) {
			for(var a = lastArgI; a < this.parameters.length; a++) {
				var p = this.parameters[a];
				var element = path[i];
				
				if(p.type == 'anonymous') {
					result[p.name] = element;
					lastArgI++;
					break;
				}
				else if(p.type == 'flag' && p.name == element) {
					result[p.name] = true;
					lastArgI++;
					break;
				}
				else if(p.type == 'parameter' && p.name == element) {
					if(p.slashes) {
						for(var t = i + 1; t < Math.min(path.length, i + 1 + p.slashes); t++) {
							if(result[p.name]) {
								result[p.name].push(path[t]);
							}
							else {
								result[p.name] = [];
								result[p.name].push(path[t]);
							}
						}
					}
					else {
						result[p.name] = path[i + 1];
					}
					
					i += (p.slashes || 1);
					lastArgI++;
					break;
				}
				lastArgI++;
			}
		}
		return result;
	};
	
	meRouter.prototype.createPath = function(params) {
		var s = '/';
		for(var pi = 0; pi < this.parameters.length; pi++) {
			var p = this.parameters[pi];
			if(p.type == 'anonymous' && params[p.name]) {
				s += params[p.name] + "/";
			}
			if(p.type == 'flag' && params[p.name]) {
				s += p.name + "/";
			}
			if(p.type == 'parameter' && params[p.name]) {
				s += p.name + "/";
				if(p.slashes) {
					for(var i = 0; i < p.slashes; i++) {
						s += params[p.name][i] +"/";
					}
				}
				else {
					s += params[p.name] +"/";
				}
			}
		}
		return s;
	};
	
	meRouter.prototype.update = function(key, val, forceSave) {
		var obj = {};
		
		if(val === undefined && forceSave === undefined) {
			obj = key;
		}
		else {
			obj[key] = val;
		}
		
		var p = angular.extend(this.getParameters(), obj);
		var pathS = this.createPath(p);
		var r = $location.path(pathS);
		
		if(this.byName[key] && this.byName[key].skipSave && !forceSave) {
			r.replace();
		}
		
		return r;
	};
	
	meRouter.prototype.mergeIntoPath = function(key, val) {
		var obj = {};
		
		if(val === undefined) {
			obj = key;
		}
		else {
			obj[key] = val;
		}
		
		var p = angular.extend(this.getParameters(), obj);
		return this.createPath(p);
	};
	
	meRouter.prototype.reload = function() {
		window.location.reload();
	};
	
	return new meRouter();
}]);
