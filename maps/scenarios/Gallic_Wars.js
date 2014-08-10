/**
 * Note: Enemy attacks are both triggered on RangeTrigger, e.g. in the forest when Gauls want to gather food.
 *  And when the storyline reaches a certain point.  
 */
var INTRUDER_PlAYER = 2;
var DEFENDER_PLAYER = 1;

Trigger.prototype.storyline = {};
Trigger.prototype.storyline[DEFENDER_PLAYER] = {

	"init": ["start"], // <-- "tutorial"
	"start": ["intro", "defend_village"], // <-- can be an action/function or a state. If it's a state, then the state's entry conditions are checked and the state entered if the conditions are met.
	"defend_village": ["subquest_free_the_druide", "enemy_attack", "counter_strike"],
	"subquest_free_the_druide": ["hurry_back_to_defend_village", "counter_strike"],
	"hurry_back_to_defend_village": ["print_hurry_back_messages", "defend_village"],
	"counter_strike": ["hurry_back_to_defend_village", "victory"]

};
Trigger.prototype.storyline[INTRUDER_PLAYER] = {
	// TODO

};




//======================================================================================
// MESSAGES
//======================================================================================
// When ever we enter a new state, we may want to generate a message. 
Trigger.prototype.messages = {}; // story telling
Trigger.prototype.messages["start"] = function() 
{
	TriggerHelper.PushGUINotification([DEFENDER_PLAYER, INTRUDER_PLAYER], "54 B.C. All of Gaul has been subdued by Julius Caesar's Roman legionaires, known as 'The conquest of Gaul'.");
}
Trigger.prototype.messages["defend_village"] = function() 
{
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	// Refer to this wiki article for more information about translation support for messages: http://trac.wildfiregames.com/wiki/Internationalization
	cmpGUIInterface.PushNotification({
		"players": [DEFENDER_PLAYER], 
		"message": markForTranslation("Defend your village!"),
		translateMessage: true
	});
}







//======================================================================================
// CONDITIONS
//======================================================================================
Trigger.prototype.conditions = {};
Trigger.prototype.conditions["counter_strike"] = function()
{
	// Count own units. If there aren't enough units, then abort.
	 
	 
	// Count active enemy attacks. If there aren't enough 
    

	// 
	return true;
	var cmpPlayerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	cmpPlayerMan.GetPlayer();
	
	
}



var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger); 

// STORY CONSTANTS
Trigger.prototype.UNIT_COUNT_REQUIRED_FOR_COUNTER_ATTACK = 100;

// STORY VARIABLES
cmpTrigger.storyline = storyline;
cmpTrigger.state = "init";
cmpTrigger.activeEnemyAttacks = 0;

// STORY EVENTS / TRIGGERS
cmpTrigger.RegisterTrigger("OnTreasureCollected", "TreasureCollected", { "enabled": true });


// STORY START
cmpTrigger.DoAfterDelay(2000, "startStoryline", {});




Trigger.prototype.startStoryline = function(data)
{
	
	if (this.state != "init")
		return;

	// TODO How to determine which role the player has? PlayerID has to be figured out.
	this.DoAfterDelay(2000, "storylineMachine", storyline[DEFENDER_PLAYER]);

}

// An option can be both a function or another state.
Trigger.prototype.storylineMachine = function(state_options)
{
	
	for each state_or_action in state_options
	{
		// if (typeof state_or_action == 'string')
		if (state_options[state_or_action] != undefined && state_options[state_or_action].length)
		{
			// It's a state: 
			// Only enter the state when the conditions are met:
			// By default, i.e. if no condition function is specified, allow to enter the state!
			var condition = this.conditions[state_or_action]; 
			if (!condition || typeof condition != 'object' || !condition())
			{	
			}
			else 
			{
				// enter the state:
				this.state = state_or_action;
			   	storylineMachine(state_options[state_or_action]);
			}
		}
		else if (this[state_or_action] && typeof this[state_or_action] == 'object')
		{
			this.DoAfterDelay(1000, state_or_action, {});
		}
	}
	
}



Trigger.prototype.intro = function(data)
{
	TriggerHelper.PushGUINotification([DEFENDER_PLAYER, INTRUDER_PLAYER],
			"54 B.C. All of Gaul has been subdued by Julius Caesar's Roman legionaires, known as 'The conquest of Gaul'."
	);
	cmpGUIInterface.PushNotification({
		"players": [DEFENDER_PLAYER], 
		"parameters": {"animalKind": "Boars"},
		"message": markForTranslation("Gaul is a peaceful place for their inhabitants. %(animalKind)s being the exception!"),
		"translateMessage": true
	});


};



Trigger.prototype.TreasureCollected = function(data)
{
};

Trigger.prototype.BattleMessage = function()
{
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [1,2], 
		"message": markForTranslation("Defeat your enemy to win!"),
		"translateMessage": true
	});
}

Trigger.prototype.victory = function(playerID)
{
	TriggerHelper.SetPlayerWon(playerID);
}

