#Refactoring

* Moving to distributed architechture
    * Peel out legacyContextEngine responsibilities into appropriate services
	   * Move fileAppendingEventListener into historicalEventService
    * Move tests for peeled out behaviour into their respextive service directories
    * Distributed Expressions
