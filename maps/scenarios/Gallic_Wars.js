
var INTRUDER_PlAYER = 2;
var DEFENDER_PLAYER = 1;

var storyline = {};

// defender
storyline[DEFENDER_PLAYER] = {

	"init": ["start"], // <-- "tutorial"
	"start": ["intro", "defend_village"], // <-- can be an action/function or a state. If it's a state, then the state's entry conditions are checked and the state entered if the conditions are met.
	"defend_village": ["subquest_free_the_druide", "enemy_attack", "counter_strike"],
	"subquest_free_the_druide": ["hurry_back_to_defend_village", "counter_strike"],
	"hurry_back_to_defend_village": ["defend_village"],
	"counter_strike": ["enterStateIfConditionsMet" ""]
    "counter_strike_enterIfConditionsMet": function() {
	    Engine.QueryInterface(SYSTEM_ENTITY, IID_Player)
	}

};

// intruder
storyline[INTRUDER_PLAYER] = {


};



var conditions = {};
conditions["counter_strike"] = function()
{
	var cmpPlayerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	cmpPlayerMan.GetPlayer();
	
}


// non-mutable => define at prototype
Trigger.prototype.actions = actions;
Trigger.prototype.initActions = function()
{
    
	this.actions["intro"] = function()
	{
		this.DoAfterDelay(2000, "intro", {});
	}
	this.actions["intro"] = function()
	{
		this.DoAfterDelay(2000, "intro", {});
	}

}

var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger); 
	
cmpTrigger.storyline = storyline;
cmpTrigger.state = "init";

cmpTrigger.RegisterTrigger("OnTreasureCollected", "TreasureCollected", { "enabled": true });

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
	var actions = this.actions;
	var conditions = this.conditions;
	
	for each state_or_action in state_options
	{
		// if (typeof state_or_action == 'string')
		if (state_options[state_or_action] != undefined && state_options[state_or_action].length)
		{
			// it's a state: 
			// only enter the state when the conditions are met:
			var condition = conditions[state_or_action]; 
			if (condition && typeof condition == 'object')
			{	
				if (condition())
			    	storylineMachine(state_options[state_or_action]);
			}
		}
		else if (actions[state_or_action] && typeof actions[state_or_action] == 'object')
		{
			actions[state_or_action]();
		}
		else if (this[state_or_action])
		{
			this.DoAfterDelay(1000, state_or_action, {});
		}
	}
	
}

Trigger.prototype.intro = function(data)
{
	
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	// Refer to this wiki article for more information about translation support for messages: http://trac.wildfiregames.com/wiki/Internationalization
	cmpGUIInterface.PushNotification({
		"players": [1,2], 
		"message": markForTranslation("Gaul is a peaceful place for their inhabitants. Boars being the exception!"),
		translateMessage: true
	});


};

Trigger.prototype.TreasureCollected = function(data)
{
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);

	var count = ++this.treasureCount.players[data.player];
	var goalCount = this.treasureCount.maximum / 2 + 1
	var otherPlayer = (data.player == 1 ? 2 : 1);
	
	// Check if having more treasures than the enemy is still possible
	if ( (count == this.treasureCount.maximum / 2) && 
		(this.treasureCount.players[otherPlayer] == this.treasureCount.maximum / 2) )
	{
		cmpGUIInterface.PushNotification({"players": [1,2], "message": "No winner yet, prepare for battle!"});
		
		// keep notifying the player that the victory condition has changed.
		var timerData = {"enabled": true, "delay": 10000, "interval": 12000}
		this.RegisterTrigger("OnInterval", "BattleMessage", timerData);
	}
	else if (count >= goalCount) // Check for victory
	{
		cmpGUIInterface.PushNotification({
			"players": [otherPlayer], 
			"message": markForTranslation("Your enemy's treasury is filled to the brim, you loose!"),
			"translateMessage": true
		});
		cmpGUIInterface.PushNotification({
			"players": [data.player], 
			"message": markForTranslation("Your treasury is filled to the brim, you are victorious!"),
			"translateMessage": true
		});
		this.DoAfterDelay(5000, "Victory", data.player);
	}
	else
	{
		// Notify if the other player if a player is close to victory (3 more treasures to collect)
		if (count + 3 == goalCount)
		{
			cmpGUIInterface.PushNotification({
				"players": [otherPlayer], 
				"message": markForTranslation("Hurry up! Your enemy is close to victory!"),
				"translateMessage": true
			});
		}
		
		if (count + 3 >= goalCount)
		{
			var remainingTreasures = ( goalCount - count);
			cmpGUIInterface.PushNotification({
				"players": [data.player],
				"parameters": {"remainingTreasures": remainingTreasures},
				"message": markForTranslation("Treasures remaining to collect for victory:  %(remainingTreasures)s!"),
				"translateMessage": true
			});
		}
		else
		{
			cmpGUIInterface.PushNotification({
				"players": [data.player], 
				"message": markForTranslation("You have collected a treasure!"),
				"translateMessage": true
			});
		}
	}
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

Trigger.prototype.Victory = function(playerID)
{
	TriggerHelper.SetPlayerWon(playerID);
}

