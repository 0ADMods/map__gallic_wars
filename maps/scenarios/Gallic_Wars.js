/**
 * Note: Enemy attacks are both triggered on RangeTrigger, e.g. in the forest when Gauls want to gather food.
 *  And when the storyline reaches a certain point.  
 */
var INTRUDER_PLAYER = 2;
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
Trigger.prototype.leaveConditions = {};

Trigger.prototype.leaveConditions["defend_village"] = false;
/*function()
{
	// count nearby enemy units: <-- now set in RangeAction. See next commit.
	var cmpRangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	if (
}*/

Trigger.prototype.enterConditions = {};
Trigger.prototype.enterConditions["counter_strike"] = function()
{
	var cmpPlayerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	cmpPlayerMan.GetPlayer();
	
	// Count own units. If there aren't enough units, then abort.
	

	// Count active enemy attacks. If there are any active attacks, then no counter attack can be ordered.
	if (this.activeEnemyAttacks > 0)
		return false;
    

	// 
	return true;
	
	
}
Trigger.prototype.enterConditions["subquest_rescue_le_druide"] = function()
{
//	// Never enter if a subquest is already achieved/solved:
//	if (this.isAlreadyAchieved[DEFENDER_PLAYER]["subquest_rescue_le_druide"])
//		return false;


	

}




//======================================================================================
// STORY FUNCTIONS/ TRIGGER ACTIONS 
//======================================================================================
Trigger.prototype.intro = function(data)
{
	warn('intro');
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








//======================================================================================
// INIT/MAIN
//======================================================================================
var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger); 

// STORY CONSTANTS
Trigger.prototype.UNIT_COUNT_REQUIRED_FOR_COUNTER_ATTACK = 100;

// STORY VARIABLES (to be saved in saved games xml)
cmpTrigger.state = "init";
cmpTrigger.isAlreadyAchieved = {};
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
	this.DoAfterDelay(2000, "storylineMachine", this.storyline[DEFENDER_PLAYER][this.state]);

}

// An option can be both a function or another state.
Trigger.prototype.storylineMachine = function(state_options)
{
	
	for each (var state_or_action in state_options)
	{
		// if (typeof state_or_action == 'string')
		if (this.storyline[DEFENDER_PLAYER][state_or_action] != undefined && this.storyline[DEFENDER_PLAYER][state_or_action].length)
		{
			// It's a state: 
			// Only enter the state when the conditions are met:
			// By default, i.e. if no condition function is specified, allow to enter the state!
			var leaveCondition = this.leaveConditions[this.state]; // of the current state.
			// Termination condition:
			if (leaveCondition != undefined 
					&& (leaveCondition == false  || typeof leaveCondition == 'object' && leaveCondition() == false))
			{
				warn(this.state + " can't be left at this point, because you can't jump in the storyline. First solve your current task. TODO subquests being the exception. Subquests should work fully trigger based, i.e. there should not be a state for it. Actions/functions bound to the subquests should be marked as achieved when the final trigger action fires (i.e. the solving of the subquest).");
				this.DoAfterDelay(2000, "storylineMachine", state_options); // check back in 1 second.
				return ;
			}
			// Common enter condition: Never enter if a state/quest is already achieved/solved: (Trigger set this as achieved.)
			if (this.isAlreadyAchieved[DEFENDER_PLAYER] && this.isAlreadyAchieved[DEFENDER_PLAYER][state_or_action])
			{
				warn(state_or_action + " won't be entered because it's already been achieved.");
				continue ;
			}
				
			var enterCondition = this.enterConditions[state_or_action]; 
			if (!enterCondition || typeof enterCondition != 'object' || enterCondition())
			{
				// enter the state:
				this.state = state_or_action;
				var message = this.messages[state_or_action];
				if (message)
					if (typeof message == 'string') 
						TriggerHelper.PushGUINotification(DEFENDER_PLAYER, message);
					else if (typeof message == 'object')
						message();
				warn('Entering state: ' + state_or_action);
			   	this.storylineMachine(this.storyline[DEFENDER_PLAYER][state_or_action]);
			}
		}
		// Is this a function (in this case more specific: a trigger action)?
		else if (this[state_or_action] && typeof this[state_or_action] == 'object')
		{
			warn('Action: ' + state_or_action);
			state_or_action();
			//this.DoAfterDelay(1000, state_or_action, {});
		}
		else
		{
			warn('Neither state nor action: ' + state_or_action);
		}
	}
	
}


