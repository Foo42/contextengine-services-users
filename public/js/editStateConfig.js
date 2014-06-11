var tryParseJson = function tryParseJson(s){
	if(!s || !s.length){
		return;
	}

	try{
		return JSON.parse(s);	
	} catch(e) {
		return;
	}
}

var createEventExpressionVM = function createEventExpressionVM(config){				
	var vm = {};
	vm.json = ko.dependentObservable({
		read:function(){
			return JSON.stringify((config || {}).on);
		},
		write:function(val){
			var parsedVal = tryParseJson(val);
			if(parsedVal){
				config = config || {};
				config.on = parsedVal; 	
			} else {
				config = undefined;
			}
		}
	},vm);

	vm.getModel = function getModel(){
		return config;
	};

	return vm;
};

var createStateExpressionVM = function createStateExpressionVM(config){
	var vm = {};
	vm.getModel = function getModel(){
		return config;
	}
	return vm;
};

var createStateConditionsVM = function createStateConditionsVM(stateConfig){
	var vm = {};
	vm.enter = ko.observable();
	if(stateConfig.enter){
		vm.enter(createEventExpressionVM(stateConfig.enter));
	}

	vm.exit = ko.observable();
	if(stateConfig.exit){
		vm.exit(createEventExpressionVM(stateConfig.exit));
	}

	vm.isActive = ko.observable();
	if(stateConfig.isActive){
		vm.isActive(createStateExpressionVM(stateConfig.isActive));
	}

	vm.eventDriven = ko.dependentObservable(function(){return vm.exit() || vm.enter();},vm);
	vm.stateDriven = ko.dependentObservable(function(){return vm.isActive();},vm);
	vm.hasConditions = ko.dependentObservable(function(){return this.eventDriven() || this.stateDriven()},vm);

	vm.conditionsMode = ko.dependentObservable({
		read:function(){
			if(! this.hasConditions()){
				return "none";
			}
			if(this.isActive()){
				return "state";
			}
			return "events";
		},
		write:function(val){
			if(val !== 'events'){
				vm.enter(undefined);
				vm.exit(undefined);
			} else{
				vm.enter(createEventExpressionVM({on:{}}));
				vm.exit(createEventExpressionVM({on:{}}))
			}

			if(val !== 'state'){
				vm.isActive(undefined);
			} else {
				vm.isActive(createStateExpressionVM({whilst:{}}));
			}
		}
	},vm);

	vm.eventDrivenConditionsVM = ko.observable();	

	vm.writeToModel = function writeToModel(model){
		if(vm.enter()){
			model.enter = vm.enter().getModel();	
		}
		if(vm.exit()){
			model.exit = vm.exit().getModel();
		}
		if(vm.isActive()){
			model.isActive = vm.isActive().getModel();
		}
	}
	return vm;
}

var createStateVM = function createStateVM(stateConfig){
	var stateVM = JSON.parse(JSON.stringify(stateConfig));
	delete stateVM.sha;
	var baselineJSON = JSON.stringify(stateVM);
	stateVM.name = ko.observable(stateConfig.name);
	stateVM.isEditing = ko.observable(false);

	stateVM.edit = function edit(){stateVM.isEditing(true)};
	stateVM.stopEditing = function stopEditing(){stateVM.isEditing(false)};		

	stateVM.conditions = ko.observable(createStateConditionsVM(stateConfig));

	stateVM.getModel = function getModel(){
		var model = {
			name:stateVM.name()
		};
		stateVM.conditions().writeToModel(model);
		return model;
	};

	stateVM.isDirty = ko.dependentObservable(function(){
		return JSON.stringify(this.getModel()) !== baselineJSON;
	},stateVM);

	return stateVM;
};

var rootVM = {
	states: ko.observableArray(originalConfig.states.map(createStateVM))
};

rootVM.getModel = function getModel(){
	var model = {};
	model.states = rootVM.states().map(function(state){return state.getModel()});
	return model;
}

rootVM.currentConfigJSON = ko.computed(function(){
	return JSON.stringify(this.getModel(),null,4);
},rootVM);

rootVM.hasUnsavedChanges = ko.dependentObservable(function(){
	return this.states().filter(function(state){return state.isDirty()}).length > 0;
},rootVM);

rootVM.saveConfig = function saveConfig(){
	var configToUpload = rootVM.currentConfigJSON();
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(request.readyState === 4 && request.status >= 200 && request.status < 300){
			rootVM.lastSaved(configToUpload)
		}
	};
	request.open('POST', '/config/states');
	request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	request.send(encodeURIComponent('configJSON') + '=' + encodeURIComponent(configToUpload));
}

rootVM.newStateName = ko.observable();
rootVM.addNewState = function addNewState(){
	var newStateVm = createStateVM({name:rootVM.newStateName()});
	newStateVm.isEditing(true);
	rootVM.states.push(newStateVm);
	rootVM.newStateName("");
};

ko.applyBindings(rootVM);