/**
 * Note: Enemy attacks are both triggered on Trigger
 *  and when the storyline reaches a certain point. 
 *  The recursion approach in the storyline machine has the benefit that old states which have not been finished yet, are properly executed until all actions have been executed or a new state has been entered or the leave condition is true when all options have been cycled which makes the storyline dive up, i.e. reentering the previous state to finish that one too. Of course a return statement by the storyline machine has to bubble up and lead to an immediate stop. 
 */
var INTRUDER_PLAYER = 2;
var DEFENDER_PLAYER = 1;

Trigger.prototype.storyline = {};
Trigger.prototype.storyline[DEFENDER_PLAYER] = {

	"init": ["start"], // <-- "tutorial"
	"start": ["spawn_gauls", "spawn_neutral", "spawn_enemy", "intro", "construction_phase"], // <-- can be an action/function or a state. If it's a state, then the state's entry conditions are checked and the state entered if the conditions are met.
	"construction_phase": [/*"fortify_village", "defend_village_selector"*/, "defend_village_selector"],
	"defend_village_selector": ["defend_village_against_increasing_force", "defend_village_against_increasing_force_gallic_reinforcements_due_to_druide_ties", "defend_village_against_descreasing_force", "defend_village_against_decreasing_force_gallic_reinforcements_due_to_druide_ties"],// TODO move enable interval_trigger_ ... to the common defend_village_selector and add function call that increases enemy strength.
	"defend_village_against_increasing_force": ["enable_interval_trigger_that_launches_enemy_attacks", "random_make_call_to_rescue_the_druide", "druide_is_rescued", "druide_is_dead", "random_enemy_centurio_excursion", "counter_strike_recommendation", "random_phoenician_trader_visit", "turn_the_tide", "make_enemy_attacks_more_frequent"],
	"druide_is_rescued": ["grant_one_time_druide_reinforcements", "lessen_major_enemy_attack_probability", "defend_village_against_increasing_force_gallic_reinforcements_due_to_druide_ties"],
	"druide_is_dead": ["grant_one_time_druide_reinforcements", "increase_major_enemy_attack_probability", "defend_village_against_increasing_force"],
	"defend_village_against_increasing_force_gallic_reinforcements_due_to_druide_ties": [ "grant_gallic_neighbours_reinforcements", "random_enemy_centurio_excursion", "counter_strike_recommendation", "random_phoenician_trader_visit", "turn_the_tide", "druide_is_dead", "defend_village_selector"/*must be the last item to avoid the danger of an endless loop if no state can be reached before we over and over reenter defend_village_xy!*/],
	
	"turn_the_tide": ["disable_interval_trigger_that_launches_enemy_attacks", "destroy_enemy_encampment_within_time"],
	"destroy_enemy_encampment_within_time": ["turning_the_tide_failed", "tide_is_turned"],
	"tide_is_turned": ["wipe_out_enemy"],
	"turning_the_tide_failed": ["defend_village_selector"], // <-- extra state to easily allow to print a message once and switch back to the correct defend village state (depending on if the enemy centurio is still alive/ a new one already arrived and if the druide has already been rescued and is still alive)
	
 	// once the enemy centurio was killed or captured, we enter:
	"defend_village_against_decreasing_force": ["random_make_call_to_rescue_the_druide", "random_launch_major_enemy_assault", "enemy_centurio_excursion", "counter_strike_recommendation", "phoenician_trader_visit", "turn_the_tide"],
	"defend_village_against_decreasing_force_gallic_reinforcements_due_to_druide_ties": [ "grant_gallic_neighbours_reinforcements", "random_launch_major_enemy_assault", "counter_strike_recommendation", "random_phoenician_trader_visit", "turn_the_tide"],

	"hurry_back_to_defend_village": ["defend_village_against_increasing", "defend_village"],
	"wipe_out_enemy": ["less_than_x_population_count", "victory"],
	"less_than_x_population_count": ["enemy_turns_the_tide"],
	"enemy_turns_the_tide": ["spawn_new_enemy_centurio", "new_enemy_centurio_arrived"],
	"new_enemy_centurio_arrived": ["launch_major_enemy_assault", "defend_village_selector"]

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
	//TriggerHelper.PushGUINotification([DEFENDER_PLAYER, INTRUDER_PLAYER], "54 B.C. All of Gaul has been subdued by Julius Caesar's Roman legionaires, known as 'The conquest of Gaul'.");
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [DEFENDER_PLAYER, INTRUDER_PLAYER], 
		"message":
			markForTranslation("54 B.C. All of Gaul has been subdued by Julius Caesar's Roman legionaires, known as 'The conquest of Gaul'."),
		"translateMessage": true
		
	});
}
Trigger.prototype.messages["defend_village_selector"] = function() 
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"We are under siege. We must defend our village!"
	);
}


function PushGUINotification(players, message)
{

	if (!players || !message || message == "")
		return ;
	
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	// Refer to this wiki article for more information about translation support for messages: http://trac.wildfiregames.com/wiki/Internationalization
	var recipients =  players;
	if (!players.length)
		recipients = [players];
	cmpGUIInterface.PushNotification({
		"players": recipients, 
		"message": markForTranslation(message),
		translateMessage: true
	});
}



//======================================================================================
// STATE CYCLE LOCK
//======================================================================================
Trigger.prototype.lock = {};


//======================================================================================
// STATE CYCLE DELAYS (optional, define if other than the default 1s delay is desired)
//======================================================================================
Trigger.prototype.state_cycle_delays = {};
//Trigger.prototype.state_cycle_delays["defend_village_selector"] = 0;
//
// Note: Instead of state cycle delays, consider checking in the state enterCondition check function for the time elapsed. TODO


//======================================================================================
// CONDITIONS
//======================================================================================
Trigger.prototype.leaveConditions = {};
Trigger.prototype.enterConditions = {};

Trigger.prototype.leaveConditions["defend_village_selector"] = true; // a selector always allows to exit this state (it's the purpose of a selector!)
//Trigger.prototype.leaveConditions["defend_village_against_increasing_force"] = false; // rather keep control to enterCondition whereever possible. Especially if subsequent states are achievements, which have to to be entered once they are achieved (no matter the leaveCondition).

/*function()
{
	// count nearby enemy units: <-- now set in RangeAction. See next commit.
	var cmpRangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	if (
}*/
Trigger.prototype.leaveConditions["construction_phase"] = function(cmpTrigger)
{
	// TODO count buildings of DEFENDER_PLAYER:
	var buildings_built_count = 0;
	var cmpRangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	var buildings = cmpRangeMan.GetEntitiesByPlayer(DEFENDER_PLAYER).filter(function(e) { if (Engine.QueryInterface(e, IID_BuildingAI)) return true; return false; });
	cmpTrigger.initial_building_count = 30; // TODO refine the estimate or derive automatically.
	buildings_built_count = buildings.length - cmpTrigger.initial_building_count;	
	//if (cmpTrigger.vars["construction_phase"].building_count_to_build) 
	if (buildings_built_count > cmpTrigger.CONSTRUCTION_PHASE_BUILDING_COUNT_TO_CONSTRUCT) 
		cmpTrigger.isAlreadyAchieved["counter_phase"] = true;
	return cmpTrigger.isAlreadyAchieved["construction_phase"] === true; 
}

Trigger.prototype.enterConditions["druide_is_saved"] = function(cmpTrigger)
{
	return cmpTrigger.is_druide_saved;
}
Trigger.prototype.enterConditions["druide_is_dead"] = function(cmpTrigger)
{
	return !cmpTrigger.gallic_druide || !cmpTrigger.gallic_druide.TargetIsAlive(cmpTrigger.gallic_druide);
}

Trigger.prototype.enterConditions["turn_the_tide"] = function(cmpTrigger)
{
	var cmpPlayerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	cmpPlayerMan.GetPlayer();
	
	// Count own units. If there aren't enough units, then abort.
	

	// Count active enemy attacks. If there are any active attacks, then no counter attack can be ordered.
	if (cmpTrigger.activeEnemyAttacks > 0)
		return false;
    

	// 
	return true;
	
}

Trigger.prototype.enterConditions["defend_village_against_increasing_force"] = function(cmpTrigger)
{
	// Is enemy centurio (still) alive?
	if (!cmpTrigger.roman_centurio_in_command.TargetIsAlive(cmpTrigger.roman_centurio_in_command))
		return false;
	
	return true; 
	 
}

Trigger.prototype.enterConditions["rescue_le_druide"] = function(cmpTrigger)
{
//	// Never enter if a subquest is already achieved/solved:
//	if (cmpTrigger.isAlreadyAchieved[DEFENDER_PLAYER]["subquest_rescue_le_druide"])
//		return false;


	

}




//======================================================================================
// STORY FUNCTIONS/ TRIGGER ACTIONS 
//======================================================================================
Trigger.prototype.intro = function(data)
{
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"type": "dialog",
		"players": [DEFENDER_PLAYER],
		"dialogName": "yes-no",//Roman incursion!",
		"data": {
			"text": {
				"caption": {
					"message": markForTranslation("Are you up to the challenge to defend Gaul and you are older than 12?"),
					"translateMessage": true,
				},
			},
			"button1": {
				"caption": {
					"message": markForTranslation("I am."),
					"translateMessage": true,
				},
				"tooltip": {
					"message": markForTranslation("Accept the challenge to stop the Romans."),
					"translateMessage": true,
				},
//	TODO Use OnPlayerCommand registered action!			"action": {
//					"press": challengeAccepted()
//				}
				
			},
			"button2": {
				"caption": {
					"message": markForTranslation("Rather not"),
					"translateMessage": true,
				},
				"tooltip": {
					"message": markForTranslation("Decline the challenge and leave Gaul to the Romans."),
					"translateMessage": true,
				},
//				"action": {
//					"press": challengeDeclined()
//				}
				
			},

		},
	});

//	this.PushGUINotification([DEFENDER_PLAYER, INTRUDER_PLAYER],
	cmpGUIInterface.PushNotification({
		"players": [DEFENDER_PLAYER], 
		"parameters": {"animalKind": "Boars"},
		"message": markForTranslation("Gaul is a peaceful place for their inhabitants. %(animalKind)s being the exception!"),
		"translateMessage": true
	});


};


////////////////////////////
// TRIGGER/EVENT LISTENERS
////////////////////////////
Trigger.prototype.StructureBuiltAction = function(data)
{
	this.debug("The OnStructureBuilt event happened with the following data:");
	this.debug(uneval(data));
};

Trigger.prototype.ConstructionStartedAction = function(data)
{
	this.debug("The OnConstructionStarted event happened with the following data:");
	this.debug(uneval(data));
};

Trigger.prototype.TrainingFinishedAction = function(data)
{
	this.debug("The OnTrainingFinished event happened with the following data:");
	this.debug(uneval(data));
};

Trigger.prototype.TrainingQueuedAction = function(data)
{
	this.debug("The OnTrainingQueued event happened with the following data:");
	this.debug(uneval(data));
};

Trigger.prototype.ResearchFinishedAction = function(data)
{
	this.debug("The OnResearchFinished event happened with the following data:");
	this.debug(uneval(data));
};

Trigger.prototype.ResearchQueuedAction = function(data)
{
	this.debug("The OnResearchQueued event happened with the following data:");
	this.debug(uneval(data));
};

Trigger.prototype.OwnershipChangedAction = function(data)
{
	this.debug("The OnOwnershipChanged event happened with the following data:");
	this.debug(uneval(data));
};

Trigger.prototype.PlayerCommandAction = function(data)
{
	this.debug("The OnPlayerCommand event happened with the following data:");
	this.debug(uneval(data));
	if (data.player == DEFENDER_PLAYER) 
	{
	}
	if (data.cmd.type == 'dialog-answer')
	{
		if (data.cmd.answer == 'button2')
		{
			challengeDeclined();
			this.DoAfterDelay(100, "victory", INTRUDER_PLAYER); // DEFENDER_PLAYER lost.
		}
		else 
		{
			challengeAccepted();
			this.DoAfterDelay(100, "victory", DEFENDER_PLAYER); // TODO remove once further storyline is ready.
		}

	}
};

Trigger.prototype.RangeAction = function(data)
{
	// TODO Use ratio of own to enemy units as criterium.
	if (data.currentCollection.length < this.TRESHOLD_ENEMY_COUNT_NEARBY_TO_HAVE_SUCCESSFULLY_DEFENDED)
		this.leaveConditions["defend_village_against_increasing_force"] = true;
	
};

Trigger.prototype.TreasureCollected = function(data)
{
};

Trigger.prototype.IntervalAction = function(data)
{
	this.debug("The OnInterval event happened with the following data:");
	this.debug(uneval(data));
	this.numberOfTimerTrigger++;
	if (this.numberOfTimerTrigger >= this.maxNumberOfTimerTrigger)
		this.DisableTrigger("OnInterval", "IntervalAction");

}


///////////////////////////
// CUSTOM TRIGGER ACTIONS (non-event bound)
/////////////////////////// 
Trigger.prototype.BattleMessage = function()
{
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [DEFENDER_PLAYER, INTRUDER_PLAYER], 
		"message": markForTranslation("Defeat your enemy to win!"),
		"translateMessage": true
	});
}


Trigger.prototype.terminate_story = function()
{
	this.debug('Story has been terminated: DEFENDER_PLAYER ('+DEFENDER_PLAYER+') won? ' + this.is_victorious[DEFENDER_PLAYER] + ' INTRUDER_PLAYER ('+INTRUDER_PLAYER+') won? ' + this.is_victorious[INTRUDER_PLAYER]);
	if (this.is_victorious[DEFENDER_PLAYER] && this.is_victorious[INTRUDER_PLAYER])
	{
		PushGUINotification([DEFENDER_PLAYER, INTRUDER_PLAYER], 'Your actions have stalled in a patt situation.');
	}
	else if (this.is_victorious[INTRUDER_PLAYER])
	{
		PushGUINotification(DEFENDER_PLAYER, 'You have lost Gaul to the Romans.');
		PushGUINotification(INTRUDER_PLAYER, 'Congratulation. You have conquered Gaul!');
	}
	else
	{
		PushGUINotification(DEFENDER_PLAYER, 'Congratulation. You have defended Gaul against the Roman intruders.');
		PushGUINotification(INTRUDER_PLAYER, 'You had to retreat behind the Alps. Conquering Gaul turned out more difficult than expected.');
	}
}
Trigger.prototype.terminate_remi = function(playerIDs)
{
	for each (var playerID in playerIDs)
	{
		TriggerHelper.SetPlayerWon(playerID);
		this.is_victorious[playerID] = true;
	}
}
Trigger.prototype.victory = function(playerID)
{
	TriggerHelper.SetPlayerWon(playerID);
	this.is_victorious[playerID] = true;
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
cmpTrigger.numberOfTimerTrigger = 0;
cmpTrigger.maxNumberOfTimerTrigger = 3; // on interval execution limit. If  the action is triggered more often then the trigger is being deactivated.

// SET UP STORY EVENTS / TRIGGERS
var data = {"enabled": true};
cmpTrigger.RegisterTrigger("OnConstructionStarted", "ConstructionStartedAction", data);
cmpTrigger.RegisterTrigger("OnOwnershipChanged", "OwnershipChangedAction", data);
cmpTrigger.RegisterTrigger("OnPlayerCommand", "PlayerCommandAction", data);
cmpTrigger.RegisterTrigger("OnResearchFinished", "ResearchFinishedAction", data);
cmpTrigger.RegisterTrigger("OnResearchQueued", "ResearchQueuedAction", data);
cmpTrigger.RegisterTrigger("OnStructureBuilt", "StructureBuiltAction", data);
cmpTrigger.RegisterTrigger("OnTrainingFinished", "TrainingFinishedAction", data);
cmpTrigger.RegisterTrigger("OnTrainingQueued", "TrainingQueuedAction", data);
cmpTrigger.RegisterTrigger("OnTreasureCollected", "TreasureCollected", data);

data.delay = 5000; // after 5 seconds
data.interval = 10000; // every 10 seconds
cmpTrigger.numberOfTimerTrigger = 0;
cmpTrigger.maxNumberOfTimerTrigger = 3; // execute it 3 times maximum
cmpTrigger.RegisterTrigger("OnInterval", "IntervalAction", data);

// SpawnEnemyAndAttack steering data: (maybe changed during/by the storyline)
cmpTrigger.enemy_attack_interval = 60000; // every 1 minute
cmpTrigger.enemy_attack_unit_count = 10; 

var composition_very_weak = {"Classes": ["Infantry+Melee+Basic"], "frequency_or_weight": 10};
var composition_weak = {"Classes": ["Melee Ranged"], "frequency_or_weight": 15};
var composition_normal = {"Classes": ["Melee Ranged Healer"], "frequency_or_weight": 25};
var composition_strong = {"Classes": ["Elite Champion Healer"], "frequency_or_weight": 15};
var composition_very_strong = {"Classes": ["Elite Champion Healer Siege"], "frequency_or_weight": 10};

var composition_siege_only = {"Classes": ["Siege"], "frequency_or_weight": 24};
var composition_heroes_only = {"Classes": ["Hero"], "frequency_or_weight": 1};

cmpTrigger.enemy_attack_compositions = [
	composition_very_weak
	, composition_weak
	, composition_normal
	, composition_strong
	, composition_very_strong
	, composition_siege_only
//	, composition_heroes_only
];



var entities = cmpTrigger.GetTriggerPoints("A");
data = {
	"entities": entities, // central points to calculate the range circles
	"players": [1], // only count entities of player 1
	"maxRange": 40,
	"requiredComponent": IID_UnitAI, // only count units in range
	"enabled": true,
};
cmpTrigger.RegisterTrigger("OnRange", "RangeAction", data);


// Termination conditions:
cmpTrigger.is_victorious = [];
cmpTrigger.is_victorious[DEFENDER_PLAYER] = false;
cmpTrigger.is_victorious[INTRUDER_PLAYER] = false;

Trigger.prototype.SKIP_STATE_CYCLING_NOTIFICATION_AMOUNT = 10;
cmpTrigger.skipped_state_cycling_notification_count = 0;


cmpTrigger.is_debug = true;

// STORY START
cmpTrigger.DoAfterDelay(2000, "startStoryline", {});




Trigger.prototype.startStoryline = function(data)
{
	
	if (this.state != "init")
		return;

	// TODO How to determine which role the player has? PlayerID has to be figured out.
	this.DoAfterDelay(2000, "storylineMachine", this.state);//this.storyline[DEFENDER_PLAYER][this.state]);
	//this.storylineMachine(this.state);

}

// An option can be both a function or another state.
Trigger.prototype.storylineMachine = function(state)
{
	// to be secure (this should be checked prior to entering the state, but in the init this may have been forgotten, so notify of it):
	if (!this.storyline || !this.storyline[DEFENDER_PLAYER])
	{
		this.debug('Terminating with remi as this storyline not exists. Do not call the storyline if you do not want to use it or specify a storyline.');
		this.DoAfterDelay(0, "terminate_remi", [DEFENDER_PLAYER, INTRUDER_PLAYER]);
		return true; // full return, terminate in a remi because without storyline, no story. If you only want to use triggers and no storyline, then don't call this function!
	}
	
	if (!this.storyline[DEFENDER_PLAYER][state])
	{
		this.debug('Undefined state: ' + state);
		return false; // return but keep the option to continue a prior state that may exist (bubble up).
	}
		
	var state_options =	this.storyline[DEFENDER_PLAYER][state];
	this.state = state; // <-- used for saved games for proper serialization in the trigger component.
	this.debug('Examining state: ' + state);
	
	
	var did_enter_a_new_state = false;
	var is_this_recursion_depth_state_accomplished = false;
	var is_leave_condition_not_met = true;
	this.skipped_state_cycling_notification_count = 0;
	var leaveCondition = this.leaveConditions[state]; // of the current state. 
	// cycled all options once and still can't leave the state to continue the previous state?
	while (!is_this_recursion_depth_state_accomplished || is_leave_condition_not_met) 
	{
		// termination condition:
		if (this.is_victorious[DEFENDER_PLAYER] || this.is_victorious[INTRUDER_PLAYER])
		{
			this.terminate_story();
			this.debug('^^^^^^^ Leaving this state: ' + this.state + ' == ' + state);
			this.is_story_terminated = true;
			return true; // bubble up to terminate the story.
		}
		
		// Can this recursion depth's state be left?
		is_this_recursion_depth_state_accomplished = 
				this.isAlreadyAchieved[DEFENDER_PLAYER] && this.isAlreadyAchieved[DEFENDER_PLAYER][state];
		// Has to be within this loop as the function result may change dynamically depending on the current situation on the map.
		is_leave_condition_not_met = leaveCondition != undefined 
						&& (leaveCondition === false  || typeof leaveCondition == 'function' && leaveCondition(this) == false);
		
		// Can the next state be entered?
		var d = {"state": state, "state_options": state_options, "is_leave_condition_not_met": is_leave_condition_not_met}
		//var is_story_terminated = this.handle_state(d);
		var state_cycle_delay = 1000; // 1 second per default
		if (this.state_cycle_delays && this.state_cycle_delays[state]) // <-- alternatively use the enterCondition() function and check for ingame time elapsed and return false when a certain interval is not maintained.
			state_cycle_delay = +this.state_cycle_delays[state];
		if (this.lock == undefined || !this.lock["handle_state"])
		{
			this.lock["handle_state"] = true;
			this.DoAfterDelay(state_cycle_delay, "handle_state", d);
		}
		else 
		{
			// check  back in a few seconds
			this.DoAfterDelay(1000, "storylineMachine", state);
			return false;
		}
	}
	// Bubble back up to the next higher recursion level depth: (i.e. the normal return to a previous state, without termination, i.e. noone is victorious and no remi arranged.)
	return false;
}


Trigger.prototype.handle_state = function(data)
{
	this.lock["handle_state"] = false;	
	var state = data.state;
	var state_options = data.state_options;
	var is_leave_condition_not_met = data.is_leave_condition_not_met;
	
	// Can the next state be entered?  
	for each (var state_or_action in state_options)
	{
		// if (typeof state_or_action == 'string')
		if (this.storyline[DEFENDER_PLAYER][state_or_action] != undefined && this.storyline[DEFENDER_PLAYER][state_or_action].length)
		{
			// It's a state: 
			// Only enter the state when the conditions are met:
			// By default, i.e. if no condition function is specified, allow to enter the state!
			var enterCondition = this.enterConditions[state_or_action]; 
			// see further downwards.
			// Termination condition:
			if (is_leave_condition_not_met) 
			{
				this.debug(this.state + " can't be left at this point, because you can't jump in the storyline. First solve your current task. TODO subquests being the exception. Subquests should work fully trigger based, i.e. there should not be a state for it. Actions/functions bound to the subquests should be marked as achieved when the final trigger action fires (i.e. the solving of the subquest).");
				//this.DoAfterDelay(4000, "storylineMachine", state);//state_options); // check back in 1 second (automatic when using the recursion approach).
				//this.storylineMachine(state_options);
				//return ;
				continue; //<-- when using the recursion approach.  
			}
			// Common enter condition: Never enter if a state/quest is already achieved/solved: (Trigger set this as achieved.)
			else if (this.isAlreadyAchieved[DEFENDER_PLAYER] && this.isAlreadyAchieved[DEFENDER_PLAYER][state_or_action])
			{
				this.debug(state_or_action + " won't be entered because it's already been achieved.");
				continue ;
			}
				
			else if (enterCondition == undefined // <-- enter state if no condition specified.
					|| typeof enterCondition != 'function' && enterCondition || typeof enterCondition == 'function' && enterCondition(this))
			{
				// enter the state:
				var message = this.messages[state_or_action];
				if (message)
					if (typeof message == 'string') 
						TriggerHelper.PushGUINotification(DEFENDER_PLAYER, message);
					else if (typeof message == 'function')
						message();
				var state_options_next_state = this.storyline[DEFENDER_PLAYER][state_or_action];
				this.debug('Entering state: ' + state_or_action + ' state_options_next_state: ' + state_options_next_state);
				//this.state = state_or_action; // <-- done in this function at the beginning now to avoid timing issues as we use DoAfterDelay.
				//did_enter_a_new_state = true; // in this recursion depth we entered a state 
			   	//var is_story_terminated // <-- now using this.is_story_terminated to allow the use of a delay.
				//this.storylineMachine(state_or_action);//options_next_state);
				this.state_enter_delay = 1000; // TODO
				this.DoAfterDelay(this.state_enter_delay, "storylineMachine", state_or_action);//state_options_next_state); // check back in 1 second.
				if (this.is_story_terminated)
				{
					this.terminate_story();//finish_story();
					this.debug('^^^^^^^ Leaving this state: ' + this.state + ' == ' + state);
					this.is_story_terminated = true;
					return true;
				}
				//else
				//	return false; <-- commented to allow to continue this recursion depth's state option examination!
			}
			else {
				if (++this.skipped_state_cycling_notification_count > this.SKIP_STATE_CYCLING_NOTIFICATION_AMOUNT)
				{
					this.skipped_state_cycling_notification_count = 0;
					this.debug('Either LeaveCondition: '+ leaveCondition +' of current state ('+ this.state +') or next state option ('+ state_or_action +') EnterCondition: '+ enterCondition +' not met. \n=> continuing with next state option or beginning to execute the actions and of this state anew until the conditions change.');
				}
			}
			
		}
		// Is this a function (in this case more specific: a trigger action)?
		else if (this[state_or_action] && typeof this[state_or_action] == 'function')
		{
			this.debug('Action: ' + state_or_action + ' Typeof: ' + (typeof this[state_or_action]));
			this[state_or_action]();
			//this.DoAfterDelay(1000, state_or_action, {});
		}
		else
		{
			this.debug('Neither state nor action: ' + state_or_action + ' => skipping');
		}
	}
	return false;
}

Trigger.prototype.debug = function(message)
{
	if (this.is_debug == undefined || this.is_debug)
		warn(message);
}

function challengeAccepted()
{
	var message = 'There is no time to loose. The Gaul we know is endangered.';
	PushGUINotification(DEFENDER_PLAYER, message);
}
function challengeDeclined()
{
	var message = 'Caesar will be happy to hear, he has a new ally. Hopefully he does not have special plans with Gallic allies now that Gaul is lost.';
	PushGUINotification(DEFENDER_PLAYER, message);
}




function spawn_gauls()
{
	// TODO
}
function spawn_neutral()
{
	// TODO
}
function spawn_enemy()
{
	// TODO
}


function enable_trigger_that_launches_enemy_attacks()
{
	var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	
	// overwrite potentially already existing trigger (Reregister is required because the trigger interval may have been adapted by the storyline.)
	data.enabled = false;
	data.delay = 1000; // launch first wave in one second from now.
	data.interval = cmpTrigger.enemy_attack_interval;
	cmpTrigger.RegisterTrigger("OnInterval", "SpawnEnemyAndAttack", data);
	
	cmpTrigger.EnableTrigger("OnInterval", "SpawnEnemyAndAttack");
}

function disable_trigger_that_launches_enemy_attacks()
{
	var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.DisableTrigger("OnInterval", "SpawnEnemyAndAttack");
}

function more_frequent_enemy_attacks()
{
	var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (cmpTrigger.enemy_attack_interval > 1999)
		cmpTrigger.enemy_attack_interval -= 1000; // 1 second less waiting time
	
}

function random_make_call_to_rescue_the_druide()
{
	// abort chance 10 %
	if (random_abort(.1))
		return ;
	
	PushGUINotification([DEFENDER_PLAYER], "We have received a message from our Druide: 'My Gallic friends, please increase your efforts to rescue me! I don't know where they brought me, but I can sense it must be in the forrest ... and it smells like if they made a fire.'");
}



function random_enemy_centurio_excursion()
{
	// abort chance 10 %
	if (random_abort(.1))
		return ;
	
	cmpTrigger.all_roman_centurios_so_far_ids = []; // ids to be serializable.
	
	if (!cmpTrigger.roman_centurio_in_command)
		return ;
		
	PushGUINotification([DEFENDER_PLAYER], "Gallic spy: 'The Roman Centurio is underway to have a look at our village!'");
	var trigger_point_in_gallic_village = cmpTrigger.GetTriggerPoints("K")[0];
	cmpTrigger.roman_centurio_in_command.PushOrderFront(
		"WalkToTargetRange", { "target": trigger_point_in_gallic_village, "min": 0, "max": 300 }
	);

	cmpTrigger.EnableTrigger("OnRange", "if_roman_centurio_arrived_then_attack_closest_enemy");

}

Trigger.prototype.if_roman_centurio_arrived_then_attack_closest_enemy = function(data)
{
	if (data.triggerPoint != "K" /*&& triggerPointOwner != DEFENDER_PLAYER*/)
		return ;

	// No centurio that is alive and in active command?
	if (!this.roman_centurio_in_command)
		return ;
	
	// The centurio entered the range of the trigger point?
	if (data.entities.indexOf(this.roman_centurio_in_command) === -1)
		return ;

	var range = 128; // TODO: what's a sensible number?
	var nearby = getNearbyEnemies(this.roman_centurio_in_command, 0, range);

	var target = undefined;
	var target_cmpIdentity = undefined;
	for each (var ent in nearby)
	{
        var cmpIdentity = Engine.QueryInterface(ent, IID_Identity);
		// Only attack units!
		var cmpUnitAI = Engine.QueryInterface(ent, IID_UnitAI); 
		if (!cmpUnitAI) 
			continue;
		// Only attack leaders:
		if (cmpIdentity.GetClassesList().indexOf("Hero") === -1)
			continue;
		target = ent;
		target_cmpIdentity = cmpIdentity;
		break;
	}
	if (!target)
	{
		PushGUINotification([DEFENDER_PLAYER], "Secret forces: 'The enemy centurio tried to attack one of your heroes but couldn't make for one!'");
		return;
	}
	

    var cmpEnemyOfCenturioPosition = Engine.QueryInterface(target, IID_Position);
    var pos = cmpEnemyOfCenturioPosition.GetPosition();
	this.roman_centurio_in_command.PushOrderFront("WalkAndFight", { "x": pos.x, "z": pos.z, "target": target, "force": false });
	
	PushGUINotification([DEFENDER_PLAYER], "Royal guard: 'The Roman Centurio is attacking our hero: " + target_cmpIdentity.GetGenericName() + "!'");
}


function getNearbyEnemies(source, range_min, range_max)
{
	// Find units that are enemies of the source (here: Roman centurio):
	// 1) determine enemy players:
	var players = [];
	var cmpOwnership = Engine.QueryInterface(source, IID_Ownership);
	var playerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	var cmpPlayer = Engine.QueryInterface(playerMan.GetPlayerByID(cmpOwnership.GetOwner()), IID_Player);
	var numPlayers = playerMan.GetNumPlayers();
	for (var playerNum = 1; playerNum < numPlayers; ++playerNum)
	{
		// Is not gaia and not Roman unit and not ally of the Roman Centurio?
		if (/*playerNum != 0 &&*/ playerNum != cmpPlayer.GetPlayerID() && !cmpPlayer.IsAlly(playerNum))
			players.push(playerNum);
	}
	
	var rangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	var nearby = rangeMan.ExecuteQuery(source, 0, range, players, IID_Identity); //<-- only those with Identity. (Note: RangeManager seems to be C++ component/entity only.)
	return nearby;
}


function counter_strike_recommendation()
{
	// TODO analyze current situation on the battle fields:
	// count enemies nearby village:
	var enemies_nearby_village_count = 0;
	var gauls_nearby_village_count = 100;
	 
	// give recommendation.
	if (gauls_nearby_village_count > enemies_nearby_village_count)
		PushGUINotification([DEFENDER_PLAYER], "Spies: 'Chieftain, we should launch an excursion! We are of equal strength or stronger in numbers than the enemy we counted around our village.'");
	else if (gauls_nearby_village_count <= enemies_nearby_village_count)
		PushGUINotification([DEFENDER_PLAYER], "Spies: 'We should bolster our defences! The enemy is numerous near our village.");
	
}

function random_phoenician_trader_visit()
{
}

function grant_one_time_druide_reinforcements()
{
	// TODO Or rather use the druide for the spawn position?
	var druide_trigger_point = cmpTrigger.GetTriggerPoints("D")[0];

	var count = 10; 
	TriggerHelper.SpawnUnits(druide_trigger_point, "units/gaul_infantry_javelinist_a", count, DEFENDER_PLAYER); 
	// TODO more diversity! 
}	

cmpTrigger.major_enemy_attack_probability = .1;
function lessen_major_enemy_attack_probability()
{
	warn('decrease major enemy attack probability');
	if (cmpTrigger.major_enemy_attack_probability > .019)
	{
		var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
		cmpTrigger.major_enemy_attack_probability -= .01;
	}
	
}

function increase_major_enemy_attack_probability()
{
	warn('increase major enemy attack probability');
	if (cmpTrigger.major_enemy_attack_probability < .9999)
	{
		var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
		cmpTrigger.major_enemy_attack_probability += .01;
	}
	
}
		
		
function grant_gallic_neighbours_reinforcements()
{
	// TODO improve
	grant_one_time_druide_reinforcements();
}


cmpTrigger.major_enemy_attack_attacking_entities = []; 
cmpTrigger.major_enemy_attack_entities_on_the_way = []; 
function random_launch_major_enemy_assault()
{
	var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (random_abort(1 - cmpTrigger.major_enemy_attack_probability))
		return ;
	
	// launch a giant enemy assault.
	// TODO
	// 1) spawn strong enemy units for the attack.
	var entities = [];	

	// 2) choose random roads (from trigger points I)
	var road_trigger_points = cmpTrigger.GetTriggerPoints("I"); 
	if (!road_trigger_points)
	{
		warn("No trigger points (I) that define each road that can be taken towards the Gallic village.");
		return ;
	}
	var road_trigger_points_chosen_index = Math.round(Math.random() * road_trigger_points.length - 1, 0);
	
	for each (var ent in entities)
	{
		// treat only existing and alive units (TODO in world entities only? if garrisoned, then the position is -1).
		if (!ent)
			continue;
		
		var cmpUnitAi = Engine.QueryInterface(ent, IID_UnitAI);
		if (!ent.TargetIsAlive(ent))
			continue;
		
		ent.PushOrderFront(
			"WalkToTargetRange", { "target": road_trigger_points[road_trigger_points_chosen_index], "min": 0, "max": 20 }
		);
		if (cmpTrigger.major_enemy_attack_attacking_entities.indexOf(ent) === -1)
			cmpTrigger.major_enemy_attack_entities_on_the_way.append(ent); 

	}


	// Set up a trigger that further guides the entities towards the gallic village once the road waypoints has been reach:
	cmpTrigger.EnableTrigger("OnRange", "if_attacking_entities_arrived_at_road_waypoint_then_give_further_orders");

}

Trigger.prototype.if_attacking_entities_arrived_at_road_waypoint_then_give_further_orders = function(data)
{
	var siege_trigger_points = cmpTrigger.GetTriggerPoints("J");
	var siege_trigger_point_chosen_index = Math.round(Math.random() * siege_trigger_points.length - 1, 0);
	
	for each (var ent in this.major_enemy_attack_entities_on_the_way)
	{
		// treat only existing and alive units (TODO in world entities only? if garrisoned, then the position is -1).
		if (!ent)
			continue;
		
		var cmpUnitAi = Engine.QueryInterface(ent, IID_UnitAI);
		if (!ent.TargetIsAlive(ent))
			continue;
		
		ent.PushOrderFront(
			"WalkToTargetRange", { "target": siege_trigger_points[siege_trigger_point_chosen_index], "min": 0, "max": 20 }
		);
		if (cmpTrigger.major_enemy_attack_attacking_entities.indexOf(ent) === -1)
		{
			cmpTrigger.major_enemy_attack_attacking_entities.append(ent); 
			cmpTrigger.major_enemy_attack_entities_on_the_way[ent] = undefined;
		}

	}


	// Set up a trigger that further provides attack orders/plans for the entities:
	cmpTrigger.EnableTrigger("OnRange", "if_attacking_entities_arrived_at_siege_points_then_give_further_orders");

}


Trigger.prototype.if_attacking_entities_arrived_at_siege_point_then_give_further_orders = function(data)
{
	for each (var ent in this.major_enemy_attack_attacking_entities)
	{
		// treat only existing and alive units (TODO in world entities only? if garrisoned, then the position is -1).
		if (!ent)
			continue;
		
		var cmpUnitAi = Engine.QueryInterface(ent, IID_UnitAI);
		if (!ent.TargetIsAlive(ent))
			continue;
		
		var range = 128; // TODO: what's a sensible number?
		var nearby = getNearbyEnemies(this.roman_centurio_in_command, 0, range);

		var target = undefined;
		var target_cmpIdentity = undefined;
		for each (var ent in nearby)
		{
	        var cmpIdentity = Engine.QueryInterface(ent, IID_Identity);
			// Don't attack possibly captured Romans: (as you might want to re-convert or free them)
			if (cmpIdentity.GetCiv() == "roman")
				continue;
			target = ent;
			target_cmpIdentity = cmpIdentity;
			break;

		}

		if (!target)
			continue;

	    var cmpEnemyOfRomanPosition = Engine.QueryInterface(target, IID_Position);
    	var pos = cmpEnemyOfRomanPosition.GetPosition();
		ent.PushOrderFront("WalkAndFight", { "x": pos.x, "z": pos.z, "target": target, "force": false });
	}
}
	

function spawn_new_enemy_centurio()
{

	var fortress_trigger_point = cmpTrigger.GetTriggerPoints("F")[0]; 
	if (!fortress_trigger_point)
	{
		warn("No trigger point (F) that defines the location of the Roman fortress (construction place and Roman command base).");
		return ;
	}
	
	var western_most_road_trigger_point = cmpTrigger.GetTriggerPoints("C");
	var entities = [];
	entities =
	TriggerHelper.SpawnUnits(western_most_road_trigger_point, "units/rome_centurio_imperial", 1, INTRUDER_PLAYER); 
	
	for each (var ent in entities)
	{
		ent.PushOrderFront(
			"WalkToTargetRange", { "target": fortress_trigger_point, "min": 0, "max": 20 }
		);
	}

}
	
function random_abort(abort_chance_percent_float_or_int, abort_when_greater_than_this)
{
	var abort_chance_percent_integer = 0;
	if (Math.abs(Math.round(abort_chance_percent_float_or_int, 0)) === Math.abs(abort_chance_percent_float_or_int))
		// no comma => no float!
		abort_chance_percent_integer = abort_chance_percent_float_or_int;
	else
		abort_chance_percent_integer = abort_chance_percent_float_or_int * 100;
	
	// random decision: (99 because of 0 being included.)
	var chance = Math.round(Math.random() * 99, 0);
	
	// e.g. chance_percent = 70 
	if (chance < abort_chance_percent_integer)
		return false;
	return true;
}
