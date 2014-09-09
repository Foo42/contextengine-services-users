	var binaryState = require('./binaryState');
	var stateQueryService = require('./stateQueryService');
	var stateInferenceEngine = require('./stateInferenceEngine');
	var finiteStateDirectQueryService = require('./finiteStateDirectQueryService');
	module.exports = {
		binaryState: binaryState,
		StateQueryService: stateQueryService,
		StateInferenceEngine: stateInferenceEngine,
		finiteStateDirectQueryService: finiteStateDirectQueryService
	}
