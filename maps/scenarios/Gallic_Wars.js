/**
 * Note: Enemy attacks are both triggered on RangeTrigger, e.g. in the forest when Gauls want to gather food.
 *  And when the storyline reaches a certain point.  
 */
var INTRUDER_PLAYER = 2;
var DEFENDER_PLAYER = 1;

Trigger.prototype.storyline = {};
Trigger.prototype.storyline[DEFENDER_PLAYER] = {

	"init": ["start"], // <-- "tutorial"
	"start": ["spawn_gauls", "spawn_neutral", "spawn_enemy", "intro", "construction_phase"], // <-- can be an action/function or a state. If it's a state, then the state's entry conditions are checked and the state entered if the conditions are met.
	"construction_phase": [/*"fortify_village", "defend_village_selector"*/, "defend_village_against_increasing_force"],
	"defend_village_selector": ["defend_village_against_increasing_force", "defend_village_against_increasing_force_gallic_reinforcements_due_to_druide_ties", "defend_village_against_descreasing_force", "defend_village_against_decreasing_force_gallic_reinforcements_due_to_druide_ties"],// TODO move enable interval_trigger_ ... to the common defend_village_selector and add function call that increases enemy strength.
	"defend_village_against_increasing_force": ["enable_interval_trigger_that_launches_enemy_attacks", "random_make_call_to_rescue_the_druide", "druide_is_rescued", "druide_is_dead", "random_enemy_centurio_excursion", "counter_strike_recommendation", "random_phoenician_trader_visit", "turn_the_tide", "decrease_trigger_that_launches_enemy_attacks_interval"],
	"druide_is_rescued": ["grant_one_time_druide_reinforcements", "lessen_major_enemy_attack_probability", "defend_village_against_increasing_force_gallic_reinforcements_due_to_druide_ties"],
	"druide_is_dead": ["grant_one_time_druide_reinforcements", "increase_major_enemy_attack_probability", "defend_village_against_increasing_force"],
	"defend_village_against_increasing_force_gallic_reinforcements_due_to_druide_ties": [ "gallic_neighbours_reinforcements", "random_enemy_centurio_excursion", "counter_strike_recommendation", "random_phoenician_trader_visit", "turn_the_tide", "druide_is_dead", "defend_village_selector"/*must be the last item to avoid the danger of an endless loop if no state can be reached before we over and over reenter defend_village_xy!*/],
	
	"turn_the_tide": ["deactivate_interval_trigger_that_launches_enemy_attacks", "destroy_enemy_encampment_within_time"],
	"destroy_enemy_encampment_within_time": ["turning_the_tide_failed", "tide_is_turned"],
	"tide_is_turned": ["wipe_out_enemy"],
	"turning_the_tide_failed": ["defend_village_selector"], // <-- extra state to easily allow to print a message once and switch back to the correct defend village state (depending on if the enemy centurio is still alive/ a new one already arrived and if the druide has already been rescued and is still alive)
	
 	// once the enemy centurio was killed or captured, we enter:
	"defend_village_against_decreasing_force": ["random_make_call_to_rescue_the_druide", "random_launch_major_enemy_assault", "enemy_centurio_excursion", "counter_strike_recommendation", "phoenician_trader_visit", "turn_the_tide"],
	"defend_village_against_decreasing_force_gallic_reinforcements_due_to_druide_ties": [ "gallic_neighbours_reinforcements", "random_launch_major_enemy_assault", "counter_strike_recommendation", "random_phoenician_trader_visit", "turn_the_tide"],

	"hurry_back_to_defend_village": ["defend_village_against_increasing", "defend_village"],
	"wipe_out_enemy": ["less_than_x_population_count", "victory"],
	"less_than_x_population_count": ["enemy_turns_the_tide"],
	"enemy_turns_the_tide": ["new_enemy_centurio_arrived"],
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
Trigger.prototype.messages["defend_village"] = function() 
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"Defend your village!"
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
	warn("The OnStructureBuilt event happened with the following data:");
	warn(uneval(data));
};

Trigger.prototype.ConstructionStartedAction = function(data)
{
	warn("The OnConstructionStarted event happened with the following data:");
	warn(uneval(data));
};

Trigger.prototype.TrainingFinishedAction = function(data)
{
	warn("The OnTrainingFinished event happened with the following data:");
	warn(uneval(data));
};

Trigger.prototype.TrainingQueuedAction = function(data)
{
	warn("The OnTrainingQueued event happened with the following data:");
	warn(uneval(data));
};

Trigger.prototype.ResearchFinishedAction = function(data)
{
	warn("The OnResearchFinished event happened with the following data:");
	warn(uneval(data));
};

Trigger.prototype.ResearchQueuedAction = function(data)
{
	warn("The OnResearchQueued event happened with the following data:");
	warn(uneval(data));
};

Trigger.prototype.OwnershipChangedAction = function(data)
{
	warn("The OnOwnershipChanged event happened with the following data:");
	warn(uneval(data));
};

Trigger.prototype.PlayerCommandAction = function(data)
{
	warn("The OnPlayerCommand event happened with the following data:");
	warn(uneval(data));
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
		this.leaveConditions["defend_village"] = true;
	
};

Trigger.prototype.TreasureCollected = function(data)
{
};

Trigger.prototype.IntervalAction = function(data)
{
	warn("The OnInterval event happened with the following data:");
	warn(uneval(data));
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
cmpTrigger.enemy_attack_strength = 

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
					&& (leaveCondition == false  || typeof leaveCondition == 'function' && leaveCondition() == false))
			{
				warn(this.state + " can't be left at this point, because you can't jump in the storyline. First solve your current task. TODO subquests being the exception. Subquests should work fully trigger based, i.e. there should not be a state for it. Actions/functions bound to the subquests should be marked as achieved when the final trigger action fires (i.e. the solving of the subquest).");
				this.DoAfterDelay(4000, "storylineMachine", state_options); // check back in 1 second.
				return ;
			}
			// Common enter condition: Never enter if a state/quest is already achieved/solved: (Trigger set this as achieved.)
			if (this.isAlreadyAchieved[DEFENDER_PLAYER] && this.isAlreadyAchieved[DEFENDER_PLAYER][state_or_action])
			{
				warn(state_or_action + " won't be entered because it's already been achieved.");
				continue ;
			}
				
			var enterCondition = this.enterConditions[state_or_action]; 
			if (!enterCondition || typeof enterCondition != 'function' && enterCondition || enterCondition())
			{
				// enter the state:
				this.state = state_or_action;
				var message = this.messages[state_or_action];
				if (message)
					if (typeof message == 'string') 
						TriggerHelper.PushGUINotification(DEFENDER_PLAYER, message);
					else if (typeof message == 'function')
						message();
				warn('Entering state: ' + state_or_action);
			   	this.storylineMachine(this.storyline[DEFENDER_PLAYER][state_or_action]);
			}
		}
		// Is this a function (in this case more specific: a trigger action)?
		else if (this[state_or_action] && typeof this[state_or_action] == 'function')
		{
			warn('Action: ' + state_or_action + ' Typeof: ' + (typeof this[state_or_action]));
			this[state_or_action]();
			//this.DoAfterDelay(1000, state_or_action, {});
		}
		else
		{
			warn('Neither state nor action: ' + state_or_action);
		}
	}
	
}

function challengeAccepted()
{
	warn('There is no time to loose. The Gaul we know is endangered.');
}
function challengeDeclined()
{
	warn('Caesar will be happy to hear, he has a new ally. Hopefully he does not have special plans with Gallic allies now that Gaul is lost.');
}




function spawn_gauls()
{
}
function spawn_neutral()
{
}
function spawn_enemy()
{
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

Trigger.prototype.if_roman_centurio_arrived_then_attack_closest_enemy(data)
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
	// Find units that are enemies of the Roman centurio:
	// 1) determine enemy players:
	var enemy_players = [];
	var cmpOwnership = Engine.QueryInterface(this.roman_centurio_in_command, IID_Ownership);
	var playerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	var cmpPlayer = Engine.QueryInterface(playerMan.GetPlayerByID(cmpOwnership.GetOwner()), IID_Player);
	var numPlayers = playerMan.GetNumPlayers();
	for (var playerNum = 1; playerNum < numPlayers; ++playerNum)
	{
		// Is not gaia and not Roman unit and not ally of the Roman Centurio?
		if (/*playerNum != 0 &&*/ playerNum != cmpPlayer.GetPlayerID() && !cmpPlayer.IsAlly(playerNum))
			players.push(i);
	}
	
	var rangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	var nearby = rangeMan.ExecuteQuery(this.roman_centurio_in_command, 0, range, players, IID_Identity); //<-- only those with Identity. (Note: RangeManager seems to be C++ component/entity only.)
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
		PushGUINotification([DEFENDER_PLAYER], "Secret forces: 'The enemy centurio tried to attack one of your heroes!'");

    var cmpEnemyOfCenturioPosition = Engine.QueryInterface(target, IID_Position);
    var pos = cmpEnemyOfCenturioPosition.GetPosition();
	this.roman_centurio_in_command.PushOrderFront("WalkAndFight", { "x": pos.x, "z": pos.z, "target": target, "force": false });
	
	PushGUINotification([DEFENDER_PLAYER], "Royal guard: 'The Roman Centurio is attacking our hero: " + target_cmpIdentity.GetGenericName() + "!'");
}

	", "counter_strike_recommendation", "random_phoenician_trader_visit", "turn_the_tide", "decrease_trigger_that_launches_enemy_attacks_interval"],
		
	
	
	"druide_is_rescued": ["grant_one_time_druide_reinforcements", "lessen_major_enemy_attack_probability", "defend_village_against_increasing_force_gallic_reinforcements_due_to_druide_ties"],
	"druide_is_dead": ["grant_one_time_druide_reinforcements", "increase_major_enemy_attack_probability", "defend_village_against_increasing_force"],
	"defend_village_against_increasing_force_gallic_reinforcements_due_to_druide_ties": [ "gallic_neighbours_reinforcements", "random_enemy_centurio_excursion", "counter_strike_recommendation", "random_phoenician_trader_visit", "turn_the_tide", "druide_is_dead", "defend_village_selector"/*must be the last item to avoid the danger of an endless loop if no state can be reached before we over and over reenter defend_village_xy!*/],
	
	"turn_the_tide": ["deactivate_interval_trigger_that_launches_enemy_attacks", "destroy_enemy_encampment_within_time"],
	"destroy_enemy_encampment_within_time": ["turning_the_tide_failed", "tide_is_turned"],
	"tide_is_turned": ["wipe_out_enemy"],
	"turning_the_tide_failed": ["defend_village_selector"], // <-- extra state to easily allow to print a message once and switch back to the correct defend village state (depending on if the enemy centurio is still alive/ a new one already arrived and if the druide has already been rescued and is still alive)
	
 	// once the enemy centurio was killed or captured, we enter:
	"defend_village_against_decreasing_force": ["random_make_call_to_rescue_the_druide", "random_launch_major_enemy_assault", "enemy_centurio_excursion", "counter_strike_recommendation", "phoenician_trader_visit", "turn_the_tide"],
	"defend_village_against_decreasing_force_gallic_reinforcements_due_to_druide_ties": [ "gallic_neighbours_reinforcements", "random_launch_major_enemy_assault", "counter_strike_recommendation", "random_phoenician_trader_visit", "turn_the_tide"],

	"hurry_back_to_defend_village": ["defend_village_against_increasing", "defend_village"],
	"wipe_out_enemy": ["less_than_x_population_count", "victory"],
	"less_than_x_population_count": ["enemy_turns_the_tide"],
	"enemy_turns_the_tide": ["new_enemy_centurio_arrived"],
	"new_enemy_centurio_arrived": ["launch_major_enemy_assault", "defend_village_selector"]
	
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
