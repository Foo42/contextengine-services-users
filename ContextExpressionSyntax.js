// <either> ::= *<event>

// <eventExpression> ::= <eventMatching> | <timeout> | <either>

// <stateExpression>





//


//single event matching
{
	enter:{
		on:{
			eventMatching:{
				text:'hello'
			}
		}
	}
}


// one of several events
{
	enter:{
		onEither:[
			{
				eventMatching:{
					text:'hello'
				}
			},
			{
				cron:'* * * * 1-5'
			}
		]
	}
}

//depending on stateExpression
{
	enter:{
		whilst:{
			stateActive:'weekday'
		}
	}
}


//altnative states
{
	enter:{
		whilstEither:[
			{
				stateActive:'weekday'
			},
			{
				stateInactive:'lunch'
			}
		]
	}
}



// event with state condition

{
	enter:{
		on:{
			eventMatching:{
				text:'hello'
			}
		},
		whilst:{
			stateActive:'weekday
		}
	}
}