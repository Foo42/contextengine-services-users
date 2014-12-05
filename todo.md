#Refactoring

* Moving to distributed architechture
    * Peel out legacyContextEngine responsibilities into appropriate services
	   xxxxxxxxxxxxx Move fileAppendingEventListener into historicalEventService
	   * Investigate if we can move stateInferenceEngine out into a service yet
    * Move tests for peeled out behaviour into their respextive service directories
    * Distributed Expressions
