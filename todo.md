#Refactoring

* Moving to distributed architechture
    xxxxxxx Peel out legacyContextEngine responsibilities into appropriate services
	   xxxxxxxxxxxxx Move fileAppendingEventListener into historicalEventService
	   xxxxxxxxxxxxx Investigate if we can move stateInferenceEngine out into a service yet
    * Move all code and tests for peeled out behaviour into their respextive service directories
    * Distributed Expressions
