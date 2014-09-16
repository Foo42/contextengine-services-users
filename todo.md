#Refactoring

* Moving to distributed architechture
	* ~~Break context subscribers/providers dependency on ContextEngine object, move them to event sinks and sources~~
		* ~~deal with stateInferenceEngine's use of ExpressionFactory which currently depends on ContextEngine~~
			* ~~Move expressionFactory to use event bus reader~~.
	* reimplement context event sinks and sources as RabbitMQ connections
	* figure out strategy for user config access. Service / separate stores per service
	* Move subscribers/providers into separate processes
	* Provide queriable (http?) interfaces for processes which the site can consume
