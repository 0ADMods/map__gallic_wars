/**
 * Note: Enemy attacks are both triggered on Trigger
 *  and when the storyline reaches a certain point. 
 *  The recursion approach in the storyline machine has the benefit that old states which have not been finished yet, are properly executed until all actions have been executed or a new state has been entered or the leave condition is true when all options have been cycled which makes the storyline dive up, i.e. reentering the previous state to finish that one too. Of course a return statement by the storyline machine has to bubble up and lead to an immediate stop. 
 */


var cmpPlayerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);

var GAIA_PLAYER = 0;
var DEFENDER_PLAYER = 1;
var INTRUDER_PLAYER = 2;
var TRADER_PLAYER = 3;
Trigger.prototype.addPlayer = function(num)
{
	// Add player entity to engine
	// TODO: Get player template name from civ data
	var entID = Engine.AddEntity("special/player");
	var cmpPlayer = Engine.QueryInterface(entID, IID_Player);
	if (!cmpPlayer)
		throw("Player.js: Error creating player entity "+num);

	cmpPlayer.SetPlayerID(num);

	// Add player to player manager
	cmpPlayerManager.AddPlayer(entID);

	// Properly autoresearch techs on init.
	var cmpTechManager = Engine.QueryInterface(entID, IID_TechnologyManager);
	if (cmpTechManager !== undefined)
		cmpTechManager.UpdateAutoResearch();

}

var SECOND = 1000;


Trigger.prototype.storyline = {};
Trigger.prototype.storyline[DEFENDER_PLAYER] = {
	"global": ["random_phoenician_trader_visit", "random_launch_major_enemy_assault", "village_is_fallen"], // <-- executed in every state.
		
	"init": ["start"], // <-- "tutorial"
	"start": ["spawn_initial_gauls", "spawn_initial_neutral", "spawn_initial_enemy", "intro", "construction_phase"], // <-- can be an action/function or a state. If it's a state, then the state's entry conditions are checked and the state entered if the conditions are met.
	"construction_phase": ["set_construction_phase_timeout_starttime_if_undefined", "random_amass_enemy", "defend_village_selector"],
	"defend_village_selector": ["defend_village_against_increasing_force", "defend_village_against_increasing_force_gallic_reinforcements_due_to_druid_ties", "defend_village_against_decreasing_force", "defend_village_against_decreasing_force_gallic_reinforcements_due_to_druid_ties", "village_is_fallen", "react_if_enemy_leader_is_gone"],// TODO move enable interval_trigger_ ... to the common defend_village_selector and add function call that increases enemy strength.
	"village_is_fallen": ["terminate_doom_of_gaul"],
	"defend_village_against_increasing_force": ["enable_interval_trigger_that_launches_enemy_attacks", "random_make_call_to_rescue_the_druid", "druid_is_rescued", "druid_is_dead", "random_enemy_centurio_excursion",  "give_counter_strike_recommendation", "turn_the_tide", "make_enemy_attacks_more_frequent", "make_enemy_attacks_stronger", "defend_village_selector"],
	"druid_is_rescued": ["grant_one_time_druid_reinforcements", "lessen_major_enemy_attack_probability", "make_enemy_attacks_weaker", "defend_village_selector"],
	"druid_is_dead": ["grant_one_time_druid_reinforcements", "increase_major_enemy_attack_probability", "make_enemy_attacks_stronger", "defend_village_selector"],
	"defend_village_against_increasing_force_gallic_reinforcements_due_to_druid_ties": ["enable_interval_trigger_that_launches_enemy_attacks", "grant_gallic_neighbours_reinforcements", "random_enemy_centurio_excursion", "give_counter_strike_recommendation", "turn_the_tide", "make_enemy_attacks_more_frequent", "make_enemy_attacks_stronger", "druid_is_dead", "defend_village_selector"/*must be the last item to avoid the danger of an endless loop if no state can be reached before we over and over reenter defend_village_xy!*/],
	
	"turn_the_tide": ["disable_interval_trigger_that_launches_enemy_attacks", "destroy_enemy_encampment_within_time"],
	"destroy_enemy_encampment_within_time": ["turning_the_tide_failed", "tide_is_turned"],
	"tide_is_turned": ["wipe_out_enemy"],
	"turning_the_tide_failed": ["defend_village_selector"], // <-- extra state to easily allow to print a message once and switch back to the correct defend village state (depending on if the enemy centurio is still alive/ a new one already arrived and if the druid has already been rescued and is still alive)
	
 	// once the enemy centurio was killed or captured, we enter:
	"defend_village_against_decreasing_force": ["enable_interval_trigger_that_launches_enemy_attacks", "random_make_call_to_rescue_the_druid", "random_enemy_centurio_excursion", "give_counter_strike_recommendation", "turn_the_tide", "make_enemy_attacks_less_frequent", "make_enemy_attacks_weaker", "defend_village_selector"],
	"defend_village_against_decreasing_force_gallic_reinforcements_due_to_druid_ties": [ "enable_interval_trigger_that_launches_enemy_attacks", "grant_gallic_neighbours_reinforcements", "give_counter_strike_recommendation", "lessen_major_enemy_attack_probability", "make_enemy_attacks_less_frequent", "make_enemy_attacks_weaker", "turn_the_tide", "defend_village_selector"],

	"hurry_back_to_defend_village": ["defend_village_against_increasing", "defend_village"],
	"wipe_out_enemy": ["random_romans_last_effort", "victory_defender"],
	"random_romans_last_effort": ["enemy_turns_the_tide"],
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
	PushGUINotification(
			[DEFENDER_PLAYER, INTRUDER_PLAYER],
			"54 B.C. All of Gaul has been subdued by Julius Caesar's Roman legionaires, known as 'The conquest of Gaul'."
	);
}

Trigger.prototype.messages["construction_phase"] = function() 
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"Hurry up! Fortify your village!"
	);
	
}

Trigger.prototype.messages["druid_is_rescued"] = function() 
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"Our troops could rescue our druid. Hope is back! Our Gallic friends sent reinforcements as they heard of this brave action."
	);
}

Trigger.prototype.messages["defend_village_selector"] = function() 
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"We are under siege. We must defend our village or Gaul is lost!"
	);
}

Trigger.prototype.messages["village_is_fallen"] = function() 
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"Our village has been sacked. We are doomed!"
	);
	
}

Trigger.prototype.messages["turning_the_tide"] = function()
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"We have a chance now! We must try to turn the tide! Take the necessary measures to storm the enemy fortress! Quick!"
	);
	
}
Trigger.prototype.messages["turning_the_tide_failed"] = function()
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"Our effort to turn the tide seems hopeless. We failed to take advantage of the weak enemy positions!"
	);
	
}
Trigger.prototype.messages["tide_is_turned"] = function()
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"Teutates! We turned the tide! Let's finish it."
	);
	
}
Trigger.prototype.messages["wipe_out_enemy"] = function()
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"We have to deal with all nearby enemy fortifications and start throwing the Romans out of Gaul."
	);
	
}


Trigger.prototype.messages["enemy_turns_the_tide"] = function()
{
	PushGUINotification(
		[DEFENDER_PLAYER], 
		"Belenus! Julius Caesar has sent a new Centurio. That's a setback."
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
Trigger.prototype.enterConditionsPrevious = {};

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
	var cmpRangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	var entities = cmpRangeMan.GetEntitiesByPlayer(DEFENDER_PLAYER);
	var buildings = entities.filter(function(e) { if (Engine.QueryInterface(e, IID_BuildingAI)) return true; return false; }); 
	var units = entities.filter(function(e) { if (Engine.QueryInterface(e, IID_UnitAI)) return true; return false; }); 
	
	var buildings_built_count = buildings.length - cmpTrigger.playerData[DEFENDER_PLAYER].initial_buildings.length;
	cmpTrigger.debug('buildings_built_count: ' + buildings_built_count + ' buildings_total_count: ' + buildings.length);
	//if (cmpTrigger.vars["construction_phase"].building_count_to_build) 
	if (buildings_built_count > cmpTrigger.CONSTRUCTION_PHASE_BUILDING_COUNT_TO_CONSTRUCT) 
		cmpTrigger.isAlreadyAchieved["construction_phase"] = true;
	
	var enemy_entities = cmpRangeMan.GetEntitiesByPlayer(INTRUDER_PLAYER);
	var enemy_units = enemy_entities.filter(function(e) { if (Engine.QueryInterface(e, IID_UnitAI)) return true; return false; }); 

	if (cmpTrigger.isAlreadyAchieved["construction_phase"] && cmpTrigger.isAlreadyAchieved["construction_phase"] === true)
		return true;
	if (enemy_units.length > 1.25 * units.length /*cmpTrigger.CONSTRUCTION_PHASE_TRESHOLD_ENEMY_NUMEROUS*/)
	{
		PushGUINotification([DEFENDER_PLAYER], "Spy: 'The enemy is numerous. They are amassing near the village. We must finish our fortifications.'");
		return true;
	}
	if (now() > cmpTrigger.construction_phase_timeout_starttime + cmpTrigger.CONSTRUCTION_PHASE_TIMEOUT)
	{
		PushGUINotification([DEFENDER_PLAYER], "Spy: 'Our time is running out. Are our fortifications in good shape?'");
		return true;
	}
	return false;
}
Trigger.prototype.set_construction_phase_timeout_starttime_if_undefined = function()
{
	if (this.construction_phase_timeout_starttime == undefined)
		this.construction_phase_timeout_starttime = now();
}

Trigger.prototype.enterConditions["village_is_fallen"] = function(cmpTrigger)
{
	var cmpRangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	
	// If all Gallic buildings are wiped out, the village is lost.
	var entities = cmpRangeMan.GetEntitiesByPlayer(DEFENDER_PLAYER);
	var buildings = entities.filter(function(e) { if (Engine.QueryInterface(e, IID_BuildingAI)) return true; return false; });
	if (buildings.length > 0)
		return false;

	// A hero is still alive? 
	// TODO to be determined if adding this condition makes sense.

	return true;
	
}

Trigger.prototype.enterConditions["random_romans_last_effort"] = function(cmpTrigger)
{

	var cmpRangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	var entities = cmpRangeMan.GetEntitiesByPlayer(DEFENDER_PLAYER);
	var enemies = cmpRangeMan.GetEntitiesByPlayer(INTRUDER_PLAYER);
	if (entities.length < 40 || enemies.length > 30)
		return true;
			
	if (random_abort(33))
		return false;

	return true;

}

// DEFEND VILLAGE SELECTOR CONDITIONS (interacting and dependent on each other. Note: only one at a time must be reachable!)
Trigger.prototype.enterConditions["defend_village_against_increasing_force"] = function(cmpTrigger)
{
	cmpTrigger.debug('are_criteria_for_increasing_force_met: ' + are_criteria_for_reinforcements_met(cmpTrigger) + ' are_criteria_for_reinforcements_met: ' + are_criteria_for_reinforcements_met(cmpTrigger));
	return are_criteria_for_increasing_force_met(cmpTrigger) && !are_criteria_for_reinforcements_met(cmpTrigger);
}

function are_criteria_for_reinforcements_met(cmpTrigger)
{
	// Is druid (still) alive?
	var is_druid_alive = !cmpTrigger.enterConditions["druid_is_dead"](cmpTrigger);
	cmpTrigger.debug("is_druid_alive: " + is_druid_alive);
	if (!is_druid_alive)
		return false;
	
	// Has the druid been rescued?
	var has_druid_been_rescued = cmpTrigger.enterConditions["druid_is_rescued"](cmpTrigger);
	cmpTrigger.debug("druid_is_rescued: " + has_druid_been_rescued);
	if (!has_druid_been_rescued)
		return false;

	return true;
	
}

Trigger.prototype.enterConditions["defend_village_against_increasing_force_gallic_reinforcements_due_to_druid_ties"] = function(cmpTrigger)
{
	return are_criteria_for_increasing_force_met(cmpTrigger) && are_criteria_for_reinforcements_met(cmpTrigger);
}

function are_criteria_for_increasing_force_met(cmpTrigger)
{
	cmpTrigger.debug('leader: ' + cmpTrigger.playerData[INTRUDER_PLAYER].leader);
	// Is enemy centurio gone?
	if (cmpTrigger.playerData[INTRUDER_PLAYER].leader == undefined)
		return false;
	var cmpHealth = Engine.QueryInterface(cmpTrigger.playerData[INTRUDER_PLAYER].leader, IID_Health);
	if (!cmpHealth || cmpHealth.GetHitpoints() < 1)
		return false;
	
	var cmpUnitAI = Engine.QueryInterface(cmpTrigger.playerData[INTRUDER_PLAYER].leader, IID_UnitAI);
	if (!cmpUnitAI || !cmpUnitAI.TargetIsAlive(cmpTrigger.playerData[INTRUDER_PLAYER].leader))
		return false;

	return true;
}

Trigger.prototype.enterConditions["defend_village_against_decreasing_force"] = function(cmpTrigger)
{
	// If the druid lives and is rescued, then this state must not be entered.
	return !are_criteria_for_increasing_force_met(cmpTrigger) && !are_criteria_for_reinforcements_met(cmpTrigger);
}

Trigger.prototype.enterConditions["defend_village_against_decreasing_force_gallic_reinforcements_due_to_druid_ties"] = function(cmpTrigger)
{
	return 
//		!cmpTrigger.isAlreadyAchieved["defend_village_against_increasing_force_gallic_reinforcements_due_to_druid_ties"]
//			&&
			 !are_criteria_for_increasing_force_met(cmpTrigger) && are_criteria_for_reinforcements_met(cmpTrigger); 
	 
}

Trigger.prototype.enterConditions["druid_is_dead"] = function(cmpTrigger)
{	
	if (!cmpTrigger.playerData[DEFENDER_PLAYER] || !cmpTrigger.playerData[DEFENDER_PLAYER].druid)
		return false;
	
	var cmpUnitAi = Engine.QueryInterface(cmpTrigger.playerData[DEFENDER_PLAYER].druid, IID_UnitAI);
	return !cmpUnitAi.TargetIsAlive(cmpTrigger.playerData[DEFENDER_PLAYER].druid);
}

Trigger.prototype.enterConditions["druid_is_rescued"] = function(cmpTrigger)
{
	// Has the druid been rescued?
	if (!cmpTrigger.playerData[DEFENDER_PLAYER] || !cmpTrigger.playerData[DEFENDER_PLAYER].druid)
		return false;
	
	var cmpOwnershipDruid = Engine.QueryInterface(cmpTrigger.playerData[DEFENDER_PLAYER].druid, IID_Ownership);
	if (!cmpOwnershipDruid || cmpOwnershipDruid.GetOwner() != DEFENDER_PLAYER)
		return false;
	cmpTrigger.isAlreadyAchieved["druid_is_rescued"] = true;
	return true;
}

Trigger.prototype.enterConditions["turn_the_tide"] = function(cmpTrigger)
{
	//if (cmpTrigger.playerData[INTRUDER_PLAYER] && cmpTrigger.playerData[INTRUDER_PLAYER].leader && Engine.QueryInterface(cmpTrigger.playerData[INTRUDER_PLAYER].leader, IID_UnitAI).TargetIsAlive(cmpTrigger.playerData[INTRUDER_PLAYER].leader))
	//{
		//cmpTrigger.debug('leader: ' + cmpTrigger.playerData[INTRUDER_PLAYER].leader + ' isAlive: ' + Engine.QueryInterface(cmpTrigger.playerData[INTRUDER_PLAYER].leader, IID_UnitAI).TargetIsAlive(cmpTrigger.playerData[INTRUDER_PLAYER].leader));
	//	return false;
	//}

	var cmpRangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	
	// Count own units. If there aren't enough units, then abort.
	var entities = cmpRangeMan.GetEntitiesByPlayer(DEFENDER_PLAYER);
	var units = entities.filter(function(e) { if (Engine.QueryInterface(e, IID_UnitAI)) return true; return false; });
		
	var enemy_entities = cmpRangeMan.GetEntitiesByPlayer(INTRUDER_PLAYER);
	var enemy_units = enemy_entities.filter(function(e) { if (Engine.QueryInterface(e, IID_UnitAI)) return true; return false; });
	cmpTrigger.debug('Not turn the tide? own: '+ units.length + ' < 2 * enemy_units.length: ' + enemy_units.length);
	if (cmpTrigger.playerData[INTRUDER_PLAYER].leader && units.length < 2 * enemy_units.length)
		return false;
	else if (!cmpTrigger.playerData[INTRUDER_PLAYER].leader && units.length < enemy_units.length)
		return false;

	// Count active enemy attacks. If there are any active attacks, then no counter attack can be ordered.
	//if (cmpTrigger.activeEnemyAttacks > 0)
	//	return false;
		
		
    cmpTrigger.setup_fortress_countdown(cmpTrigger);

	// 
	return true;
	
}


Trigger.prototype.setup_fortress_countdown = function(cmpTrigger)
{
	var min = Math.round(this.turning_the_tide_timeout_timeleft / 60 / SECOND, 0);
	var sec = this.turning_the_tide_timeout_timeleft - min * 60 * SECOND; 
	PushGUINotification([DEFENDER_PLAYER], "You have " + min + "min " + sec + " sec to take the enemy fortress.");
	
	var data = {};
	data.enabled = true;
	data.delay = 1 * SECOND; // launch cycle immediately.
	data.interval = 1 * SECOND;
	
	this.RegisterTrigger("OnInterval", "countdown", data);

}


Trigger.prototype.countdown = function(data)
{
	if (this.turning_the_tide_timeout_timeleft > 0)
	{
		--this.turning_the_tide_timeout_timeleft;
		// TODO update countdown GUI top right corner?
		 
	}
	else 
	{
		this.DisableTrigger("OnInterval", "countdown");
	}

}

Trigger.prototype.enterConditions["turning_the_tide_failed"] = function(cmpTrigger)
{
	if (cmpTrigger.turning_the_tide_timeout_timeleft > 0)
	{
		//PushGUINotification([DEFENDER_PLAYER], "You have still time to take down the enemy fortress.");
		return false;
	}
	//else time has run out: we might have failed.
	// Note: This only works because the Romans never construct buildings. Examine all entities and filter out the buildings instead to get a general solution.
	var count = 0; 
	if (cmpTrigger.playerData[INTRUDER_PLAYER].initial_buildings)
		for each (var b in cmpTrigger.playerData[INTRUDER_PLAYER].initial_buildings)
			if (b)
			{
				var cmpHealth = Engine.QueryInterface(b, IID_Health);
				var cmpPosition = Engine.QueryInterface(b, IID_Position);
				if (cmpPosition && cmpPosition.GetPosition().x !== -1
					&& cmpHealth && cmpHealth.GetHitpoints() > 0)
				{
					++count;
					if (count > cmpTrigger.ENEMY_STRUCTURES_UNDESTROYABLE_COUNT - 1)
						return true; // not yet destroyed all
				}
			}
	// okay, we have destroyed all enemy buildings => we have not failed. => don't enter this state
	if (count < cmpTrigger.ENEMY_STRUCTURES_UNDESTROYABLE_COUNT) 
		return false;
	else 
		return true;
}


Trigger.prototype.enterConditions["tide_is_turned"] = function(cmpTrigger)
{
	// Note: This only works because the Romans never construct buildings. Examine all entities and filter out the buildings instead to get a general solution.
	var count = 0; 
	if (cmpTrigger.playerData[INTRUDER_PLAYER].initial_buildings
		&& cmpTrigger.playerData[INTRUDER_PLAYER].initial_buildings.length)
		for each (var b in cmpTrigger.playerData[INTRUDER_PLAYER].initial_buildings)
			if (b)
			{
				var cmpHealth = Engine.QueryInterface(b, IID_Health);
				var cmpPosition = Engine.QueryInterface(b, IID_Position);
				if (cmpPosition && cmpPosition.GetPosition().x !== -1
						&& cmpHealth && cmpHealth.GetHitpoints() > 0)
				{
					++count;
					if (count > cmpTrigger.ENEMY_STRUCTURES_UNDESTROYABLE_COUNT - 1)
						return false; // not yet destroyed all
				}
			}
	// okay, we have destroyed all enemy buildings => we have not failed. => don't enter this state
	if (count < cmpTrigger.ENEMY_STRUCTURES_UNDESTROYABLE_COUNT) 
		return true;
	else 
		return false;
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
	/*
	cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [DEFENDER_PLAYER], 
		"parameters": {"animalKind": "Boars"},
		"message": markForTranslation("Gaul is a peaceful place for their inhabitants. %(animalKind)s being the exception!"),
		"translateMessage": true
	});
	*/


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
			this.DisableTrigger("OnInterval", "storylineMachine");
		}
		else 
		{
			challengeAccepted();
			//this.DoAfterDelay(100, "victory", DEFENDER_PLAYER); // TODO remove once further storyline is ready.
		}

	}
};

Trigger.prototype.TRESHOLD_OWN_TO_NEARBY_ENEMY_MIN_RATIO_TO_HAVE_SUCCESSFULLY_DEFENDED = 10; // ten times as many units
Trigger.prototype.RangeAction = function(data)
{
	//data.added 
	//data.removed
	// Use ratio of own to enemy units as criterium:
	var entities = data.currentCollection; 
	var enemies = [];
	var neutral = [];
	var own = [];
	var allied = [];
	for each (var ent in entities)
	{
		var cmpUnitAI = Engine.QueryInterface(ent, IID_Ownership);
		if (!cmpUnitAI)
			continue;
		
		var cmpOwnership = Engine.QueryInterface(ent, IID_Ownership);
		if (!cmpOwnership)
			continue;
		var playerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
		var cmpPlayer = Engine.QueryInterface(playerMan.GetPlayerByID(cmpOwnership.GetOwner()), IID_Player);
		
		if (cmpOwnership.GetOwner() == DEFENDER_PLAYER)
			own.push(ent);
		else if (cmpPlayer.IsAlly(DEFENDER_PLAYER))
			allied.push(ent);
		else if (cmpPlayer.IsNeutral(DEFENDER_PLAYER))
			neutral.push(ent);
		else 
			enemies.push(ent);
	}
	
	if ((allied.length + own.length) / enemies.length > this.TRESHOLD_OWN_TO_NEARBY_ENEMY_MIN_RATIO_TO_HAVE_SUCCESSFULLY_DEFENDED)
	{
		this.enterConditionsPrevious["turn_the_tide"] = this.enterConditions["turn_the_tide"];
		//TODO not working properly and rather intering (use enterCondition function only. it's enough) this.enterConditions["turn_the_tide"] = true;
		//this.leaveConditions["defend_village_against_increasing_force"] = true;
		//this.leaveConditions["defend_village_against_decreasing_force_gallic_reinforcements_due_to_druid_ties"] = true;
		//this.leaveConditions["defend_village_against_increasing_force"] = true;
		//this.leaveConditions["defend_village_against_decreasing_force_gallic_reinforcements_due_to_druid_ties"] = true;
	}
	else
	{
		// restore old enterCondition examination.
		this.enterConditions["turn_the_tide"] = this.enterConditionsPrevious["turn_the_tide"];
	}

	
};

Trigger.prototype.TreasureCollected = function(data)
{
};


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
Trigger.prototype.doom_defender = function()
{
	this.doom(DEFENDER_PLAYER);
}
Trigger.prototype.victory_defender = function()
{
	this.victory(DEFENDER_PLAYER);
}
Trigger.prototype.victory = function(playerID)
{
	TriggerHelper.SetPlayerWon(playerID);
	this.is_victorious[playerID] = true;
}
Trigger.prototype.terminate_doom_of_gaul = function()
{
	this.doom(DEFENDER_PLAYER);
	this.is_victorious[INTRUDER_PLAYER] = true;
}
Trigger.prototype.doom = function(playerID_doomed)
{
	var cmpPlayerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	var cmpPlayer_doomed = Engine.QueryInterface(cmpPlayerMan.GetPlayerByID(playerID_doomed), IID_Player);
	var numPlayers = cmpPlayerMan.GetNumPlayers();
	//for each (var player in cmpPlayerMan.GetPlayers())
	for (var playerNum = 1; playerNum < numPlayers; ++playerNum)
	{
		if (playerNum != playerID_doomed && !cmpPlayer_doomed.IsAlly(playerNum))
			TriggerHelper.SetPlayerWon(playerNum);
	}
}




//======================================================================================
// INIT/MAIN
//======================================================================================
var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger); 

// STORY CONSTANTS
Trigger.prototype.UNIT_COUNT_REQUIRED_FOR_COUNTER_ATTACK = 100;

// STORY VARIABLES (to be saved in saved games xml)
cmpTrigger.state = "init";
cmpTrigger.playerData = {};
var cmpPlayerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
for (var playerNum = 0; playerNum < cmpPlayerMan.GetNumPlayers(); ++playerNum)
{
	cmpTrigger.playerData[playerNum] = {};
	cmpTrigger.playerData[playerNum].initial_units = [];
	cmpTrigger.playerData[playerNum].initial_buildings = [];
}
cmpTrigger.isAlreadyAchieved = {};
cmpTrigger.activeEnemyAttacks = 0;
cmpTrigger.turning_the_tide_timeout_timeleft = 10 * 60 * SECOND; 

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

data = {};
data.enabled = true;
data.delay = 1 * SECOND; // launch cycle immediately.
data.interval = 60 * SECOND;
cmpTrigger.RegisterTrigger("OnInterval", "renew_stalled_attacks", data);

Trigger.prototype.renew_stalled_attacks = function()
{
	var siege_points = this.GetTriggerPoints("J");
	for each (var source in siege_points)
	{
		if (!source)
			continue;

		var rangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
		var range_min = 0;
		var range_max = 50//100;
		var players = [INTRUDER_PLAYER];
		var entities_nearby = rangeMan.ExecuteQuery(source, range_min, range_max, players, IID_UnitAI); //<-- only those with Identity. (Note: RangeManager seems to be C++ component/entity only.)
		for each (var e in entities_nearby)
		{
			var cmpUnitAi = Engine.QueryInterface(e, IID_UnitAI);
			if (!cmpUnitAi)
				continue;
			if (!cmpUnitAi.GetCurrentState().toLowerCase() == "individual.idle")
				continue;
			attackNearbyEnemy(e, 0, 250);
		}
	}
}


// SpawnEnemyAndAttack steering data: (maybe changed during/by the storyline)
cmpTrigger.enemy_attack_interval = 45 * SECOND;
cmpTrigger.ENEMY_ATTACK_INTERVAL_MIN = 10 * SECOND;
cmpTrigger.ENEMY_ATTACK_INTERVAL_MAX = 2 * 60 * SECOND;
cmpTrigger.ENEMY_ATTACK_INTERVAL_STEP = 1 * SECOND; // increase or decrease by 2 seconds
cmpTrigger.enemy_attack_unit_count = 2;
cmpTrigger.ENEMY_ATTACK_UNIT_COUNT_MIN = 1;
cmpTrigger.ENEMY_ATTACK_UNIT_COUNT_MAX = 50; 
cmpTrigger.ENEMY_ATTACK_UNIT_COUNT_STEP = 1;

cmpTrigger.major_enemy_attack_probability = .05;
cmpTrigger.MAJOR_ENEMY_ATTACK_PROBABILITY_MIN = .01;
cmpTrigger.MAJOR_ENEMY_ATTACK_PROBABILITY_MAX = .15;
cmpTrigger.MAJOR_ENEMY_ATTACK_PROBABILITY_STEP = .0001;

cmpTrigger.ENEMY_STRUCTURES_UNDESTROYABLE_COUNT = 15;

cmpTrigger.is_roman_centurio_currently_near_the_gallic_village_ = false;
cmpTrigger.all_roman_centurios_so_far_ids = []; // ids to be serializable.

cmpTrigger.construction_phase_timeout_starttime = now();

var composition_very_weak = {"Classes": ["Infantry+Melee+Basic"], "frequency_or_weight": 10};
var composition_weak = {"Classes": ["Melee Ranged"], "frequency_or_weight": 15};
var composition_normal = {"Classes": ["Melee Ranged Healer"], "frequency_or_weight": 25};
var composition_strong = {"Classes": ["Elite Champion Healer"], "frequency_or_weight": 15};
var composition_very_strong = {"Classes": ["Elite Champion Healer Cavalry Siege"], "frequency_or_weight": 10};

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

Trigger.prototype.getRandomUnitCount = function(max)
{
	if (!max)
		max = 7;
	return Math.min(max, Math.round(Math.random() * this.enemy_attack_unit_count, 0));//this.ENEMY_ATTACK_UNIT_COUNT_MAX, 0);
}
// TODO generate the below composition pool automatically from the above composition strengths.
cmpTrigger.compositions = [
	[
		{"template": "units/{Civ}_infantry_spearman_b", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_swordsman_b", "count": cmpTrigger.getRandomUnitCount()}, 
	],
	[
		{"template": "units/{Civ}_cavalry_spearman_b", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_cavalry_javelinist_b", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_spearman_a", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_swordsman_a", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_javelinist_a", "count": cmpTrigger.getRandomUnitCount()}, 
	],
	[
		{"template": "units/{Civ}_cavalry_spearman_b", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_swordsman_a", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_javelinist_a", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_spearman_a", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_support_healer_a", "count": Math.round(cmpTrigger.getRandomUnitCount() / 10, 0)}, 
	],
	[
		{"template": "units/{Civ}_cavalry_spearman_e", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_cavalry_javelinist_e", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_spearman_e", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_swordsman_e", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_infantry_javelinist_e", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_champion_infantry", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_champion_cavalry", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_support_healer_e", "count": cmpTrigger.getRandomUnitCount()}, 
	],
	[
		{"template": "units/{Civ}_mechanical_siege_ram", "count": Math.round(cmpTrigger.getRandomUnitCount() / 3, 0)}, 
		{"template": "units/{Civ}_mechanical_siege_ballista_unpacked", "count": Math.round(cmpTrigger.getRandomUnitCount() / 2, 0)}, 
		{"template": "units/{Civ}_mechanical_siege_scorpio_unpacked", "count": Math.round(cmpTrigger.getRandomUnitCount() / 2, 0)}, 
		{"template": "units/rome_legionnaire_imperial", "count": cmpTrigger.getRandomUnitCount() * 2}, 
		{"template": "units/{Civ}_champion_infantry", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_champion_cavalry", "count": cmpTrigger.getRandomUnitCount()}, 
		{"template": "units/{Civ}_support_healer_e", "count": Math.round(cmpTrigger.getRandomUnitCount() / 10, 0)}, 
	]
	
];



var entities = cmpTrigger.GetTriggerPoints("K");//"A");
data = {
	"entities": entities, // central points to calculate the range circles
	"players": [INTRUDER_PLAYER, DEFENDER_PLAYER],
	"maxRange": 1500,
	"requiredComponent": IID_UnitAI, // only count units in range
	"enabled": true
};
//cmpTrigger.RegisterTrigger("OnRange", "RangeAction", data);

var druid_trigger_point = cmpTrigger.GetTriggerPoints("D")[0];
data = {
	"entities": [druid_trigger_point],
	"players": [DEFENDER_PLAYER],
	"maxRange": 15,
	"requiredComponent": IID_UnitAI,
	"enabled": true
}
cmpTrigger.RegisterTrigger("OnRange", "spawnDruid", data);




// Termination conditions:
cmpTrigger.is_victorious = [];
cmpTrigger.is_victorious[DEFENDER_PLAYER] = false;
cmpTrigger.is_victorious[INTRUDER_PLAYER] = false;

cmpTrigger.traders_on_their_way = [];
cmpTrigger.disappearOrderQueue = [];

Trigger.prototype.SKIP_STATE_CYCLING_NOTIFICATION_AMOUNT = 10;
cmpTrigger.skipped_state_cycling_notification_count = 0;
Trigger.prototype.CONSTRUCTION_PHASE_BUILDING_COUNT_TO_CONSTRUCT = 10;
Trigger.prototype.CONSTRUCTION_PHASE_TRESHOLD_ENEMY_NUMEROUS = 50;
Trigger.prototype.CONSTRUCTION_PHASE_TIMEOUT = 3 * 60 * SECOND;



cmpTrigger.is_debug = false;
//cmpTrigger.is_debug = true;

// Prevent Player 3 from being defeated immediately:
cmpTrigger.DoAfterDelay(10, "spawn_initial_trader_entities", {}); 

// STORY START
cmpTrigger.state = "init";
Trigger.prototype.STATE_CYCLE_DELAY = 7 * SECOND;
cmpTrigger.DoAfterDelay(1 * SECOND, "startStoryline", {});




Trigger.prototype.startStoryline = function(data)
{
	
	if (this.state != "init")
		return;

	// TODO How to determine which role the player has? PlayerID has to be figured out.
	//this.DoAfterDelay(2000, "storylineMachine", this.state);//this.storyline[DEFENDER_PLAYER][this.state]);
	//this.storylineMachine(this.state);
	if (!data)
		data = {};
	if (data.enabled == undefined)
		data.enabled = false;
	if (data.delay == undefined)
		data.delay = 0; // launch cycle immediately.
	if (data.interval == undefined)
		data.interval = this.STATE_CYCLE_DELAY;
	
	this.RegisterTrigger("OnInterval", "storylineMachine", data);
	
	this.EnableTrigger("OnInterval", "storylineMachine");

}

// An option can be both a function or another state.
Trigger.prototype.storylineMachine = function()
{
	var state = this.state;
	
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
	this.debug('Examining state: ' + state);
	
	
	var is_this_recursion_depth_state_accomplished = false;
	var is_leave_condition_not_met = true;
	this.skipped_state_cycling_notification_count = 0;
	var leaveCondition = this.leaveConditions[state]; // of the current state. 
	// cycled all options once and still can't leave the state to continue the previous state?
	//while (!is_this_recursion_depth_state_accomplished || is_leave_condition_not_met) 
	
	//{
		// termination condition:
		if (this.is_victorious[DEFENDER_PLAYER] || this.is_victorious[INTRUDER_PLAYER])
		{
			this.terminate_story();
			this.debug('^^^^^^^ Leaving this state: ' + this.state);
			this.is_story_terminated = true;
			// cancel the interval timer:
			this.DisableTrigger("OnInterval", "storylineMachine");
			return true; // bubble up to terminate the story.
		}
		
		// Can this recursion depth's state be left?
		is_this_recursion_depth_state_accomplished = 
				this.isAlreadyAchieved[DEFENDER_PLAYER] && this.isAlreadyAchieved[DEFENDER_PLAYER][state];
		// Has to be within this loop as the function result may change dynamically depending on the current situation on the map.
		is_leave_condition_not_met = leaveCondition != undefined 
						&& (typeof leaveCondition != 'function' && leaveCondition === false  || typeof leaveCondition == 'function' && leaveCondition(this) == false);
		
		// treat both global events and specific potential state changes and actions:
		var d = {"state": "global", "is_leave_condition_not_met": is_leave_condition_not_met, "playerId": DEFENDER_PLAYER};
		var is_story_terminated = this.handle_state(d);
		// Can the next state be entered?
		d = {"state": state, "state_options": state_options, "is_leave_condition_not_met": is_leave_condition_not_met, "playerId": DEFENDER_PLAYER};
		is_story_terminated = this.handle_state(d);
		//this.DoAfterDelay(state_cycle_delay, "handle_state", d);
	//}
	// Bubble back up to the next higher recursion level depth: (i.e. the normal return to a previous state, without termination, i.e. noone is victorious and no remi arranged.)
	return false;
}


/**
 * Executes state actions and checks for possible state changes (Note: first possible state change is entered => a frequent error results, when enter and leave conditions are not correct!).
 * Three options: 1) Give state_options. 2) Give state + playerId. 3) Give both.
 */
Trigger.prototype.handle_state = function(data)
{
	var playerId = DEFENDER_PLAYER; // default
	if (data.playerId)
		playerId = data.playerId;
	else if (data.player)
		playerId = player; // TODO is requiring playerId instead of player useful?
	
	var state = data.state;
	
	var state_options = data.state_options;
	if (!state_options)
	{
		if (!state || playerId === undefined)
			return false;
		state_options = this.storyline[playerId][state];
	}
	var is_leave_condition_not_met = data.is_leave_condition_not_met;
	if (is_leave_condition_not_met === undefined)
		is_leave_condition_not_met = false;
	// treat both global events and specific potential state changes and actions:
	//var state_options_pool = [this.storyline[playerId]["global"], state_options];
	//for each (state_options in state_options_pool)
	// Can the next state be entered?  
	for each (var state_or_action in state_options)
	{
		// if (typeof state_or_action == 'string')
		if (this.storyline[playerId][state_or_action] != undefined && this.storyline[playerId][state_or_action].length)
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
			else if (this.isAlreadyAchieved[playerId] && this.isAlreadyAchieved[playerId][state_or_action])
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
						TriggerHelper.PushGUINotification(playerId, message);
					else if (typeof message == 'function')
						message();
				var state_options_next_state = this.storyline[playerId][state_or_action];
				this.debug('Entering state: ' + state_or_action + ' state_options_next_state: ' + state_options_next_state);
				this.state = state_or_action;
				var d = {};
				if (this.state_cycle_delays && this.state_cycle_delays[state]) // <-- alternatively use the enterCondition() function and check for ingame time elapsed and return false when a certain interval is not maintained.
					d.interval = +this.state_cycle_delays[state_or_action]; // if undefined then the default grips.
				return this.startStoryline(d);
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
		else if (state_or_action && typeof state_or_action == 'function') // not recommended and non-functional without eval(). TODO check for global function names if possible?
		{
			this.debug('Function: ' + state_or_action);
			state_or_action();
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



Trigger.prototype.spawnDruid = function(data)
{
	var have_allied_ents_come_to_rescue = false;
	if (data.currentCollection)
		for each (var ent in data.currentCollection)
		{
			var cmpOwnership = Engine.QueryInterface(ent, IID_Ownership);
			if (cmpOwnership.GetOwner() == DEFENDER_PLAYER)
			{
				have_allied_ents_come_to_rescue = true;
				break;
			}
		}
	if (!have_allied_ents_come_to_rescue)
		return false;
	
	var chosen_spawn_entity = this.GetTriggerPoints("D")[0];
	if (!chosen_spawn_entity)
		this.debug("No trigger point D: " + chosen_spawn_entity);
	var druid = {"template": "units/gaul_hero_miraculous", "count": 1};
	this.playerData[DEFENDER_PLAYER].druid = TriggerHelper.SpawnUnits(chosen_spawn_entity, druid.template, druid.count, DEFENDER_PLAYER)[0];
	//this.isAlreadyAchieved["druide_is_rescued"] = true;
	this.DisableTrigger("OnRange", "spawnDruid");

	var cmpUnitAi = Engine.QueryInterface(this.playerData[DEFENDER_PLAYER].druid, IID_UnitAI);
	
	var harbour = this.GetTriggerPoints("B")[0];
	var cmpPosition = Engine.QueryInterface(harbour, IID_Position);
	var pos = cmpPosition.GetPosition();
	
	var cmpUnitAi = Engine.QueryInterface(this.playerData[DEFENDER_PLAYER].druid, IID_UnitAI);
	if(cmpUnitAi)
		cmpUnitAi.WalkToPointRange(pos.x, pos.z, 0, 10, true);
		

	var d = {};
	d = {
		"entities": [harbour],
		"players": [DEFENDER_PLAYER],
		"maxRange": 15, // when the centurio comes in sight of the building. TODO Derive from the target entity's template?
		"requiredComponent": IID_UnitAI,
		"enabled": true
	}
	this.RegisterTrigger("OnRange", "give_druid_further_instructions_on_harbour_arrival", d);

	return true;
}
	

Trigger.prototype.give_druid_further_instructions_on_harbour_arrival = function()
{
	var trigger_point_in_gallic_village = this.GetTriggerPoints("K")[0];
	var cmpPosition = Engine.QueryInterface(trigger_point_in_gallic_village, IID_Position);
	var pos = cmpPosition.GetPosition();
	
	var cmpUnitAi = Engine.QueryInterface(this.playerData[DEFENDER_PLAYER].druid, IID_UnitAI);
	if(cmpUnitAi)
		cmpUnitAi.WalkToPointRange(pos.x, pos.z, 0, 1, true);
	
	//var cmpUnitMotion = Engine.QueryInterface(this.playerData[DEFENDER_PLAYER].druid, IID_UnitMotion);
	//cmpUnitMotion.MoveToTargetRange(trigger_point_in_gallic_village, 0, 20);
	
	this.DisableTrigger("OnRange", "give_druid_further_instructions_on_harbour_arrival");
	return true;
}

var g_traders = ["units/cart_ship_merchant", "units/sele_ship_merchant", "units/maur_ship_merchant", "units/iber_ship_merchant"];
Trigger.prototype.units_to_spawn = [
	g_traders[0] 
]; 
Trigger.prototype.spawn_initial_trader_entities = function(data)
{
	// Trial & Error: Does this prevent player 3 from being defeated?
	var units_spawned = this.spawn(this.GetTriggerPoints("C"), [this.units_to_spawn[INTRUDER_PLAYER][0]], TRADER_PLAYER);
	for each (var unit_spawned in units_spawned)
	{
		var cmpPosition = Engine.QueryInterface(unit_spawned, IID_Position);
		cmpPosition.MoveOutOfWorld();
	}
	
}
	// Spawn buildings and units and add to the default count.
Trigger.prototype.units_to_spawn[DEFENDER_PLAYER] = [
			{"template": "units/gaul_infantry_javelinist_a", "count": 7}
			, {"template": "units/gaul_infantry_slinger_a", "count": 5}
			, {"template": "units/gaul_infantry_spearman_a", "count": 7}

			// champions
			, {"template": "units/gaul_champion_infantry", "count": 7}
			, {"template": "units/gaul_champion_cavalry", "count": 5}


			, {"template": "units/gaul_idefisk", "count": 1}
			, {"template": "units/gaul_hero_obelisk", "count": 1}
]; 
Trigger.prototype.spawn_initial_gauls = function(data)
{
	// Spawn buildings and units and add to the default count.
	var trigger_points_in_gallic_village = this.GetTriggerPoints("A");
	
	this.spawn_initial(this.units_to_spawn[DEFENDER_PLAYER], DEFENDER_PLAYER, trigger_points_in_gallic_village, true, true, undefined, undefined, {"avoid": ["Palisade"]});
	

	// Special units to keep track of individually:
	// The druid: (spawned onRangeEnter => rescued)
	//var trigger_point_druid = ; 
	//this.playerData[DEFENDER_PLAYER].druid = TriggerHelper.SpawnUnits(chosen_spawn_entity, druid.template, druid.count, DEFENDER_PLAYER)[0];

	// both common units for now.
	var units_to_spawn = [
			// heroes
			{"template": "units/gaul_idefisk", "count": 1}
			, {"template": "units/gaul_fat", "count": 7}
	];
	var trigger_points_outside_gallic_village = this.GetTriggerPoints("B");
	
	this.spawn_initial(units_to_spawn, DEFENDER_PLAYER, trigger_points_outside_gallic_village);
	 
	// asterisk 
	units_to_spawn = [
			// heroes
			{"template": "units/gaul_hero_asterisk", "count": 1}
	];
	
	this.spawn_initial(units_to_spawn, DEFENDER_PLAYER, [trigger_points_outside_gallic_village[0]], false);


	// shieldbearers:
	var ent =  {"template": "units/gaul_shieldbearers", "count": 1};
	var chosen_spawn_entity = this.GetTriggerPoints("K")[0];
	var e = TriggerHelper.SpawnUnits(chosen_spawn_entity, ent.template, ent.count, DEFENDER_PLAYER)[0];
	this.playerData[DEFENDER_PLAYER].shieldbearers = e;
	this.playerData[DEFENDER_PLAYER].initial_units.push(e);

	// chieftain:
	var chieftain =  {"template": "units/gaul_hero_vercingetorix", "count": 1};
	chosen_spawn_entity = this.GetTriggerPoints("K")[0];
	this.playerData[DEFENDER_PLAYER].chieftain = TriggerHelper.SpawnUnits(chosen_spawn_entity, chieftain.template, chieftain.count, DEFENDER_PLAYER)[0];
	this.playerData[DEFENDER_PLAYER].initial_units.push(chieftain);

	// Garrison the chieftain on top the shieldbearers:
	if (this.playerData[DEFENDER_PLAYER].shieldbearers)
	{
		var cmpChieftainUnitAI = Engine.QueryInterface(this.playerData[DEFENDER_PLAYER].chieftain, IID_UnitAI);
		cmpChieftainUnitAI.PushOrderFront(
			"Garrison", { "target": this.playerData[DEFENDER_PLAYER].shieldbearers, "force": false }
		);
	}

	// TODO Spawn buildings.
	
}

Trigger.prototype.spawn_initial = function(entities_to_spawn, playerId, spawn_location_entities, allowSpawningFromBuildings = true, alternateTriggerPointAndBuildingSpawning = true, valueModificationsToApplyToExistingBuildingsCache = undefined, civ = undefined, entityClasses = undefined)
{
	this.playerData[playerId].initial_buildings = [];
	this.playerData[playerId].initial_units = [];

	// Find already existing entities on the map:
	var cmpRangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager); 
	var entities = cmpRangeMan.GetEntitiesByPlayer(playerId);
	for each (var ent in entities)
	{
		var cmpUnitAI = Engine.QueryInterface(ent, IID_UnitAI);
		if (cmpUnitAI)
			this.playerData[playerId].initial_units.push(ent);
		var cmpBuildingAI = Engine.QueryInterface(ent, IID_BuildingAI);
		if (cmpBuildingAI)
		{
			this.playerData[playerId].initial_buildings.push(ent);
			if (valueModificationsToApplyToExistingBuildingsCache)
				var cmpTechManager = QueryOwnerInterface(ent, IID_TechnologyManager);
				for /*each*/ (var key in valueModificationsToApplyToExistingBuildingsCache)
				{
					//var valueName = "TerritoryDecay/HealthDecayRate";
					//cmpTechManager.modifications[valueName] = {"tech_key_all_but_affects_and_value": "value of technology key-value pair"};
					if (!cmpTechManager.modificationCache[key])
						cmpTechManager.modificationCache[key] = [];
					if (!cmpTechManager.modificationCache[key][ent])
						cmpTechManager.modificationCache[key][ent] = {"origValue": -1, "newValue": -1};
					cmpTechManager.modificationCache[key][ent]["newValue"] = valueModificationsToApplyToExistingBuildingsCache[key];
				}
		}
	}


	var chosen_spawn_entity;
	var chooseSpawnPointFromBuildings = true;  // start with allowing it.
	for each (var unit_to_spawn in entities_to_spawn)
	{
		// choose random spawn point within village or any gallic building:
		var chosen_spawn_point = pickRandomly(spawn_location_entities);
		var chosen_spawn_building = pickRandomly(this.playerData[playerId].initial_buildings);
		if (entityClasses && entityClasses.avoid)
		{
			var trial_count = 10;
			var buildingIdentity = Engine.QueryInterface(chosen_spawn_building, IID_Identity);
			while (--trial_count > 0 && MatchesClassList(buildingIdentity.GetClassesList(), entityClasses.avoid))
			{
				chosen_spawn_building = pickRandomly(this.playerData[playerId].initial_buildings);
				buildingIdentity = Engine.QueryInterface(chosen_spawn_building, IID_Identity);
			}
		}
		
		var buildingIdentity = Engine.QueryInterface(chosen_spawn_building, IID_Identity);
		if ( (allowSpawningFromBuildings && chooseSpawnPointFromBuildings || !chosen_spawn_point && chosen_spawn_building)
				&& (entityClasses == undefined || !MatchesClassList(buildingIdentity.GetClassesList(), entityClasses.avoid)) )
		{	
			if (alternateTriggerPointAndBuildingSpawning)
				chooseSpawnPointFromBuildings = false;
			chosen_spawn_entity = chosen_spawn_building;
		}
		else if (chosen_spawn_point)
		{
			if (allowSpawningFromBuildings && alternateTriggerPointAndBuildingSpawning)
				chooseSpawnPointFromBuildings = true;
			chosen_spawn_entity = chosen_spawn_point;
		}
		else 
		{
			this.debug("Neither building to be spawned at was defined nor any trigger point " + uneval(spawn_location_entities) + " could be found within the Gallic village. => Skipping: " + uneval(unit_to_spawn));
			continue ;
		}
		
		var template =  unit_to_spawn.template;
		if (civ)
			template = template.replace("{Civ}", civ);
		var spawned_units = TriggerHelper.SpawnUnits(chosen_spawn_entity, template, unit_to_spawn.count, playerId);
		for each (var spawned_unit in spawned_units)
			this.playerData[playerId].initial_units.push(spawned_unit);

	}
}

Trigger.prototype.spawn_initial_neutral = function(data)
{
	// TODO
}

// Spawn buildings and units and add to the default count.

Trigger.prototype.units_to_spawn[INTRUDER_PLAYER] = [
		{"template": "units/rome_infantry_javelinist_b", "count": 5}
		, {"template": "units/rome_infantry_swordsman_b", "count": 5}
		, {"template": "units/rome_infantry_spearman_b", "count": 5}

		// champions
		, {"template": "units/rome_champion_infantry", "count": 10}
		, {"template": "units/rome_champion_cavalry", "count": 10}

];

Trigger.prototype.spawn_initial_enemy = function()
{
	// Those involve in major attacks and fortress defence:
	var trigger_points_in_roman_camp = this.GetTriggerPoints("F");
	var modificationsToApplyToExistingBuildings = {"TerritoryDecay/HealthDecayRate": 0};
	this.spawn_initial(this.units_to_spawn[INTRUDER_PLAYER], INTRUDER_PLAYER, trigger_points_in_roman_camp, true, true, modificationsToApplyToExistingBuildings);
	
	// Defending the spot where the druid is kept:
	var druid_spot = this.GetTriggerPoints("D")[0];
	this.spawn_initial(this.compositions[4], INTRUDER_PLAYER, [druid_spot], false, false, undefined, "rome");
	
	// Special units to keep track of individually:
	// centurio:
	var ent = this.spawn_new_enemy_centurio(); 
	this.playerData[INTRUDER_PLAYER].initial_units.push(ent);
	this.debug("Spawning centurio: " + this.playerData[INTRUDER_PLAYER].leader);

	var cmpUnitAI = Engine.QueryInterface(this.playerData[INTRUDER_PLAYER].leader, IID_UnitAI);
//	cmpUnitAI.PushOrderFront(
//		"Garrison", { "target": this.playerData[INTRUDER_PLAYER].initial_buildings[0], "force": false }
//	);

	// TODO Spawn buildings.
	
}

Trigger.prototype.random_amass_enemy = function(spawn_points)
{	
	if (random_abort(66))
		return ;
	var trigger_points_in_roman_camp = this.GetTriggerPoints("F");
	var druid_spot = this.GetTriggerPoints("D");
	var chosen_points = pickRandomly([trigger_points_in_roman_camp, druid_spot, druid_spot]); //<-- defend the druid well
	this.spawn(chosen_points, this.units_to_spawn[INTRUDER_PLAYER], INTRUDER_PLAYER);
}

Trigger.prototype.spawn = function(spawn_points, units_to_spawn, playerId)
{
	if (!spawn_points || !spawn_points.length)
	{
		this.debug("Amass Enemy: No spawn points given.");
		return undefined;
	}
	var units_spawned = [];
	for each (var unit_to_spawn in units_to_spawn)
	{
		var chosen_spawn_point = pickRandomly(spawn_points);	
		var ents = TriggerHelper.SpawnUnits(chosen_spawn_point, unit_to_spawn.template, +Math.max(1, Math.round(unit_to_spawn.count * Math.random(), 0)), playerId);
		if (!ents || !ents.length)
			continue;
		for each (var e in ents)
			units_spawned.push(e);
	}
	return units_spawned;
}


Trigger.prototype.spawn_new_enemy_centurio = function()
{

	var ent_data =  {"template": "units/rome_centurio_imperial", "count": 1};
	var western_most_road_trigger_point = cmpTrigger.GetTriggerPoints("G")[0];
	var entities = TriggerHelper.SpawnUnits(western_most_road_trigger_point, ent_data.template, ent_data.count, INTRUDER_PLAYER);
	if (!entities || !entities.length)
		return undefined;
	this.all_roman_centurios_so_far_ids.push(entities[0]);
	this.playerData[INTRUDER_PLAYER].leader = entities[0];
	var cmpIdentity = Engine.QueryInterface(entities[0], IID_Identity);
	this.playerData[INTRUDER_PLAYER].leader_identity = cmpIdentity;
	this.debug("A new centurio arrived: " + this.playerData[INTRUDER_PLAYER].leader);
	PushGUINotification([DEFENDER_PLAYER], "Spy: 'Julius Caesar has sent a Centurio to conquer our village.'");
	var fortress_trigger_point = cmpTrigger.GetTriggerPoints("F")[0]; 
	if (!fortress_trigger_point)
	{
		this.debug("No trigger point (F) that defines the location of the Roman fortress (construction place and Roman command base).");
		return entities[0];
	}
	for each (var ent in entities)
	{
		var cmpUnitAI = Engine.QueryInterface(ent, IID_UnitAI);
		//cmpUnitAI.PushOrderFront(
		//	"WalkToTargetRange", { "target": fortress_trigger_point, "min": 0, "max": 20 }
		//);
		var cmpPosition = Engine.QueryInterface(fortress_trigger_point, IID_Position);
		var pos = cmpPosition.GetPosition2D();
		if (cmpUnitAI)
			cmpUnitAI.WalkToPointRange(pos.x, pos.y/*z*/, 0, 20, true);
		//var cmpUnitMotion = Engine.QueryInterface(this.playerData[INTRUDER_PLAYER].leader, IID_UnitMotion);
		//cmpUnitMotion.MoveToTargetRange(fortress_trigger_point, 0, 20);
	}
	// reactivate this achievement:
	this.isAlreadyAchieved["react_if_enemy_leader_is_gone"] = false;
	return entities[0];
}

// Also useful in conjunction with the OnRange trigger event. (next to the OnInterval event)
Trigger.prototype.SpawnEnemyAndAttack = function(data)
{

	// spawn armies.
	var spawned_units_count = 0; 
	var spawned_units = [];
	var spawn_points = [this.GetTriggerPoints("G"), this.GetTriggerPoints("D"), this.GetTriggerPoints("I")];
	this.debug('Spawning ' + this.enemy_attack_unit_count + ' units.');
	while (spawned_units_count < this.enemy_attack_unit_count)
	{
		var where = pickRandomly(spawn_points);
		where = pickRandomly(where);
			
		// compose armies.
		var composition_variant = pickRandomly(this.compositions);
		var unit_to_spawn = pickRandomly(composition_variant);//.units);
		var spawned_units_of_same_type = TriggerHelper.SpawnUnits(where, unit_to_spawn.template.replace("{Civ}", "rome"), Math.max(1, unit_to_spawn.count), INTRUDER_PLAYER);
		
		for each (var spawned_unit in spawned_units_of_same_type)
		{
			spawned_units.push(spawned_unit);
			++spawned_units_count;
		}
		
	}

	 
	// Send them to attack random nearby targets.
	for each (var ent in spawned_units) 
	{
		var cmpUnitAi = Engine.QueryInterface(ent, IID_UnitAI);
		if (!cmpUnitAi)
			continue;
		var range_min = 0; 
		var range_max = 1500;
		var entities_nearby = getNearbyEnemies(ent, range_min, range_max, IID_Position);
		
		var enemy_entities = [];
		for each (var enemy in entities_nearby)
		{
	        var cmpIdentity = Engine.QueryInterface(enemy, IID_Identity);
			var cmpOwnership = Engine.QueryInterface(enemy, IID_Ownership);
			var playerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
			var cmpPlayer = Engine.QueryInterface(playerMan.GetPlayerByID(cmpOwnership.GetOwner()), IID_Player);
			// skip own and ally units: 
			if (cmpOwnership.GetOwner() == INTRUDER_PLAYER || cmpPlayer.IsAlly(INTRUDER_PLAYER))
				continue;
			// it's an enemy:
			enemy_entities.push(enemy);
		}
		var cmpUnitMotion = Engine.QueryInterface(ent, IID_UnitMotion);
		if (!cmpUnitMotion)
			continue;
		if (enemy_entities.length && enemy_entities.length > 0)
		{
			var target = pickRandomly(enemy_entities);
			for each (var enemy in enemy_entities)
				if (cmpUnitAi.CanAttack(target))
				{
					target = enemy;
					break;
				}
			
			//cmpUnitAi.PushOrderFront("Attack", {"target": target, "force": false});
			var cmpPosition = Engine.QueryInterface(target, IID_Position);
			var pos = cmpPosition.GetPosition2D();
	        var cmpIdentity = Engine.QueryInterface(ent, IID_Identity);
			if (!cmpIdentity.HasClass("Siege"))
				cmpUnitAi.WalkToPointRange(pos.x, pos.y/*z*/, 0, 20, true);
			else
				cmpUnitMotion.MoveToTargetRange(target, 0, 20);
			continue;
		}
		//else 
		var trigger_points_in_gallic_village = this.GetTriggerPoints("K");
		var chosen_target = pickRandomly(trigger_points_in_gallic_village);
		var cmpPosition = Engine.QueryInterface(chosen_target, IID_Position);
		var pos = cmpPosition.GetPosition();
		if (!cmpIdentity.HasClass("Siege"))
			cmpUnitAi.WalkToPointRange(pos.x, pos.z, 0, 20, true);
		else
			cmpUnitMotion.MoveToTargetRange(chosen_target, 0, 20);
	}
}

Trigger.prototype.enable_interval_trigger_that_launches_enemy_attacks = function(data)
{
	this.EnableTrigger("OnInterval", "SpawnEnemyAndAttack");
	
	// overwrite potentially already existing trigger (Reregister is required because the trigger interval may have been adapted by the storyline.) TODO Overwriting is not working!
	data = {};
	data.enabled = false;
	data.delay = 1000; // launch first wave in one second from now.
	data.interval = this.enemy_attack_interval;
	data.overwrite_existing = true;
	this.debug('Enemy attack interval: ' + this.enemy_attack_interval);
	this.RegisterTrigger("OnInterval", "SpawnEnemyAndAttack", data);
	
	this.EnableTrigger("OnInterval", "SpawnEnemyAndAttack");
}

Trigger.prototype.disable_interval_trigger_that_launches_enemy_attacks = function()
{
	this.DisableTrigger("OnInterval", "SpawnEnemyAndAttack");
}

Trigger.prototype.make_enemy_attacks_more_frequent = function()
{
	var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (cmpTrigger.enemy_attack_interval > cmpTrigger.ENEMY_ATTACK_INTERVAL_MIN + cmpTrigger.ENEMY_ATTACK_INTERVAL_STEP) // > 2 min ?
		cmpTrigger.enemy_attack_interval -= cmpTrigger.ENEMY_ATTACK_INTERVAL_STEP; // x second less waiting time

}

Trigger.prototype.make_enemy_attacks_less_frequent = function()
{
	var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (cmpTrigger.enemy_attack_interval < cmpTrigger.ENEMY_ATTACK_INTERVAL_MAX - cmpTrigger.ENEMY_ATTACK_INTERVAL_STEP) // > 2 min ?
		cmpTrigger.enemy_attack_interval += cmpTrigger.ENEMY_ATTACK_INTERVAL_STEP; // x second more waiting time
}


Trigger.prototype.make_enemy_attacks_stronger = function()
{
	var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (cmpTrigger.enemy_attack_unit_count < cmpTrigger.ENEMY_ATTACK_UNIT_COUNT_MAX - cmpTrigger.ENEMY_ATTACK_UNIT_COUNT_STEP)
		cmpTrigger.enemy_attack_unit_count += cmpTrigger.ENEMY_ATTACK_UNIT_COUNT_STEP;
	
}

Trigger.prototype.make_enemy_attacks_weaker = function()
{
	var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (cmpTrigger.enemy_attack_unit_count > cmpTrigger.ENEMY_ATTACK_UNIT_COUNT_MIN + cmpTrigger.ENEMY_ATTACK_UNIT_COUNT_STEP)
		cmpTrigger.enemy_attack_unit_count -= cmpTrigger.ENEMY_ATTACK_UNIT_COUNT_STEP;

}



Trigger.prototype.random_make_call_to_rescue_the_druid = function()
{
	if (random_abort(75))
		return ;
	
	PushGUINotification([DEFENDER_PLAYER], "We have received a message from our druid: 'My Gallic friends, please increase your efforts to rescue me! I don't know where they brought me, but I can sense it must be in the forrest ... and it smells like if they made a fire.'");
}

Trigger.prototype.react_if_enemy_leader_is_gone = function()
{
	if (!this.isAlreadyAchieved["react_if_enemy_leader_is_gone"])
	{
		var leader = this.playerData[INTRUDER_PLAYER].leader;
		if (leader)
			var cmpHealth = Engine.QueryInterface(leader, IID_Health);
			if (!cmpHealth || cmpHealth.GetHitpoints() < 1)
			{
				var cmpIdentity = Engine.QueryInterface(leader, IID_Identity);
				PushGUINotification([DEFENDER_PLAYER], "The Enemy leader " + this.playerData[INTRUDER_PLAYER].leader_identity.GetGenericName() + " has been captured or killed.");
				this.is_roman_centurio_currently_near_the_gallic_village = false;
				this.isAlreadyAchieved["react_if_enemy_leader_is_gone"] = true;
			}
	}
	
}

Trigger.prototype.random_enemy_centurio_excursion = function()
{
	if (this.is_roman_centurio_currently_near_the_gallic_village)
		return ;

	// abort chance 90 %
	if (random_abort(.90))
		return ;
	
	
	if (!this.playerData[INTRUDER_PLAYER].leader)
		return ;
		
	PushGUINotification([DEFENDER_PLAYER], "Gallic spy: 'The Roman Centurio is underway to have a look at our village!'");

	this.launch_major_enemy_assault(); // a centurio won't go unprotected.
	
	var trigger_points_in_gallic_village = this.GetTriggerPoints("K");
	var chosen_target = pickRandomly(trigger_points_in_gallic_village);
	var cmpUnitAI = Engine.QueryInterface(this.playerData[INTRUDER_PLAYER].leader, IID_UnitAI);
	//cmpUnitAI.PushOrderFront(
	//	"WalkToTargetRange", { "target": chosen_target, "min": 0, "max": 150 }
	//);
	var cmpPosition = Engine.QueryInterface(chosen_target, IID_Position);
	var pos = cmpPosition.GetPosition();
	cmpUnitAI.WalkToPointRange(pos.x, pos.z, 0, 170, true);
	//var cmpUnitMotion = Engine.QueryInterface(this.playerData[INTRUDER_PLAYER].leader, IID_UnitMotion); <-- doesn't set proper unit ai state and hence no correct animation is chosen.
	//cmpUnitMotion.MoveToTargetRange(chosen_target, 0, 150);

	// Setup trigger for further orders when the entity reached the target position:
	var d = {};
	d = {
		"entities": trigger_points_in_gallic_village, //<-- this is still suboptimal if the DisappearOnArrival is registered with the same event again but with different entities (overwriting the ones we registered/set here). TODO Maybe use one trigger point type of owner gaia as fixed disappear point, where units disappear if they enter its set range?
		"players": [INTRUDER_PLAYER],
		"maxRange": 175, // when the centurio comes in sight of the building. TODO Derive from the target entity's template?
		"requiredComponent": IID_UnitAI,
		"enabled": true
	}
	this.RegisterTrigger("OnRange", "if_roman_centurio_arrived_then_attack_closest_enemy", d);
	//cmpTrigger.EnableTrigger("OnRange", "if_roman_centurio_arrived_then_attack_closest_enemy");

}

Trigger.prototype.if_roman_centurio_arrived_then_attack_closest_enemy = function(data)
{
	// No centurio that is alive and in active command?
	if (this.playerData[INTRUDER_PLAYER].leader === undefined)
		return ;

	if (data.removed.indexOf(this.playerData[INTRUDER_PLAYER].leader) !== -1)
		this.is_roman_centurio_currently_near_the_gallic_village = false;
		
	//if (data.triggerPoint != "K" /*&& triggerPointOwner != DEFENDER_PLAYER*/)
	// The centurio entered the range of the trigger point?
	if (data.added.indexOf(this.playerData[INTRUDER_PLAYER].leader) === -1)
		if (data.currentCollection.indexOf(this.playerData[INTRUDER_PLAYER].leader) === -1)
			return ;

	// the centurio arrived:
	this.is_roman_centurio_currently_near_the_gallic_village = true;


	var range = 100;
	var nearby = getNearbyEnemies(this.playerData[INTRUDER_PLAYER].leader, 0, range);

	var target = undefined;
	var target_cmpIdentity = undefined;
	for each (var ent in nearby)
	{
        var cmpIdentity = Engine.QueryInterface(ent, IID_Identity);
		// Only attack units!
		var cmpUnitAI = Engine.QueryInterface(ent, IID_UnitAI); 
		if (!cmpUnitAI) 
			continue;
		// Only attack champions and leaders:
		if (cmpIdentity.GetClassesList().indexOf("Hero") === -1)
			continue;
		target = ent;
		target_cmpIdentity = cmpIdentity;
		break;
	}
	if (!target)
	{
		PushGUINotification([DEFENDER_PLAYER], "Secret forces: 'The enemy centurio tried to attack one of your leaders but couldn't make for one!'");
		
		var cmpUnitAi = Engine.QueryInterface(this.playerData[INTRUDER_PLAYER].leader, IID_UnitAI); 
		//warn(cmpUnitAi.GetCurrentState());
		if (cmpUnitAi && cmpUnitAi.GetCurrentState() != "INDIVIDUAL.WALKING") 
		{
			var target_points = [this.GetTriggerPoints("F"), this.GetTriggerPoints("H"), this.GetTriggerPoints("F"), this.GetTriggerPoints("I")];
			target_points = pickRandomly(target_points);
			var target_point = pickRandomly(target_points);
			var cmpPosition = Engine.QueryInterface(target_point, IID_Position);
			var pos = cmpPosition.GetPosition();
			cmpUnitAi.WalkToPointRange(pos.x, pos.z, 0, 5, true);
			//cmpUnitAi.PushOrderFront("WalkToPointRange", { "x": pos.x, "z": pos.z, "range_minx": 0, "range_max": 10, "force": true });
		}
		return;
	}
	

    var cmpEnemyOfCenturioPosition = Engine.QueryInterface(target, IID_Position);
    var pos = cmpEnemyOfCenturioPosition.GetPosition();
	var cmpUnitAI = Engine.QueryInterface(this.playerData[INTRUDER_PLAYER].leader, IID_UnitAI);
	cmpUnitAI.PushOrderFront("WalkAndFight", { "x": pos.x, "z": pos.z, "targetClasses": {"attack": ["Hero", "Champion"]}, "force": false });
	
	PushGUINotification([DEFENDER_PLAYER], "Royal guard: 'The Roman Centurio is attacking our hero: " + target_cmpIdentity.GetGenericName() + "!'");
	
}


function getNearbyEnemies(source, range_min, range_max)
{
	return getNearbyEnemiesWithComponent(source, range_min, range_max, IID_Identity);
}

	
function getNearbyEnemiesWithComponent(source, range_min, range_max, component)
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
	var nearby = rangeMan.ExecuteQuery(source, range_min, range_max, players, component); //<-- only those with Identity. (Note: RangeManager seems to be C++ component/entity only.)
	return nearby;
}


Trigger.prototype.give_counter_strike_recommendation = function()
{
	if (random_abort(80))
		return ;
			
	// analyze current situation on the battle fields:
	// count enemies nearby village:
	var enemies_nearby_village_count = 0;
	var gauls_nearby_village_count = 0;
	
	var range_min = 0; 
	var range_max = 1000;
	
	var source = this.GetTriggerPoints("K")[0];
	var component = IID_UnitAI;
	var rangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	var players = [DEFENDER_PLAYER, INTRUDER_PLAYER];
	var entities_nearby = rangeMan.ExecuteQuery(source, range_min, range_max, players, component); //<-- only those with Identity. (Note: RangeManager seems to be C++ component/entity only.)
	
	var enemy_entities = [];
	for each (var ent in entities_nearby)
	{
		var cmpUnitAI = Engine.QueryInterface(ent, IID_UnitAI); 
		if (!cmpUnitAI) 
			continue;
		var cmpOwnership = Engine.QueryInterface(ent, IID_Ownership);
		var playerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
		var cmpPlayer = Engine.QueryInterface(playerMan.GetPlayerByID(cmpOwnership.GetOwner()), IID_Player);
		// skip inhabitants of the gallic village as well as allies: 
		if (cmpOwnership.GetOwner() == DEFENDER_PLAYER || cmpPlayer.IsAlly(DEFENDER_PLAYER))
			++gauls_nearby_village_count;
		else
		{
			++enemies_nearby_village_count;	
			// it's an enemy:
			enemy_entities.push(ent);
		}
	}

	

	 
	// give recommendation.
	if (gauls_nearby_village_count > enemies_nearby_village_count)
		PushGUINotification([DEFENDER_PLAYER], "Spies: 'Chieftain, we should launch an excursion! We are of equal strength or stronger in numbers than the enemy we counted around our village.'");
	else if (gauls_nearby_village_count <= enemies_nearby_village_count)
		PushGUINotification([DEFENDER_PLAYER], "Spies: 'We should bolster our defences! The enemy is numerous near our village.'");
	
}

Trigger.prototype.random_phoenician_trader_visit = function()
{
	// A trader passes by seldomly:
	var probability_of_trader_passing_by_closely = .05;
	if (random_abort(1 - probability_of_trader_passing_by_closely))
		return false;
	
	// The trader doesn't want to enter the harbour if fighting is close. (give the player a motivation to keep the harbour area clear of fighting to increase the probability that the trader will come by.)
	var range_min = 0; 
	var range_max = 80; // keep the harbour free from fighting.
	var entities_nearby = getNearbyEnemies(this.GetTriggerPoints("B")[0], range_min, range_max);
	
	var enemy_entities = [];
	for each (var ent in entities_nearby)
	{
        var cmpIdentity = Engine.QueryInterface(ent, IID_Identity);
		// Don't count buildings as they won't repell the trader if there are no mobile units that could capture the ship.
		var cmpUnitAI = Engine.QueryInterface(ent, IID_UnitAI); 
		if (!cmpUnitAI) 
			continue;
		var cmpOwnership = Engine.QueryInterface(ent, IID_Ownership);
		var playerMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
		var cmpPlayer = Engine.QueryInterface(playerMan.GetPlayerByID(cmpOwnership.GetOwner()), IID_Player);
		// skip inhabitants of the gallic village as well as allies: 
		if (cmpOwnership.GetOwner() == DEFENDER_PLAYER || cmpPlayer.IsAlly(DEFENDER_PLAYER))
			continue;
		// it's an enemy:
		enemy_entities.push(ent);
	}
	
	var probability_of_trader_entering_harbour = .80;
	if (enemy_entities.length > 0)
	{
		probability_of_trader_entering_harbour = .01; // => in total it initally was: .01 * .01 = 1/10000 => very seldom
		PushGUINotification([DEFENDER_PLAYER], "Lighthouse: 'The trader complains about enemy units near the harbour and will very likely not stop at our dock.'");
		//return false;
	}
	

	// The Phoenician trader enters the harbour with a probability of 1%.
	if (random_abort(1 - probability_of_trader_entering_harbour))
		return false;

	var possible_spawn_points = this.GetTriggerPoints("C");
	if (!possible_spawn_points)
	{
		this.debug('No trigger points C for spawning the phoenician trader.');
		return false;
	}
	
	var chosen_spawn_entity = pickRandomly(possible_spawn_points);
	var trader = TriggerHelper.SpawnUnits(chosen_spawn_entity, pickRandomly(g_traders), 1, TRADER_PLAYER)[0];

	//if (cmpPlayerManager.GetNumPlayers() < TRADER_PLAYER)
	//	this.addPlayer(TRADER_PLAYER); // as this one is not pre-placed in the map. TODO somewhat strange result: conflict and things.

	// forge alliance:
	var cmpTraderPlayer = Engine.QueryInterface(cmpPlayerManager.GetPlayerByID(TRADER_PLAYER), IID_Player);
	cmpTraderPlayer.SetAlly(DEFENDER_PLAYER);
	var cmpDefenderPlayer = Engine.QueryInterface(cmpPlayerManager.GetPlayerByID(DEFENDER_PLAYER), IID_Player);
	cmpDefenderPlayer.SetAlly(TRADER_PLAYER);


	var cmpUnitAI = Engine.QueryInterface(trader, IID_UnitAI);
	var harbour = this.GetTriggerPoints("B")[0];
	var cmpPosition = Engine.QueryInterface(harbour, IID_Position);
	var pos = cmpPosition.GetPosition2D();
	cmpUnitAI.WalkToPointRange(pos.x, pos.y/*z*/, 0, 10, true);
	//var cmpUnitMotion = Engine.QueryInterface(trader, IID_UnitMotion);
	//cmpUnitMotion.MoveToTargetRange(harbour, 0, 10);
	if (this.traders_on_their_way.indexOf(trader) == -1)
		this.traders_on_their_way.push(trader);
	
	
	var d = {};
	d = {
		"entities": [harbour], //<-- this is suboptimal and not general enough! TODO use one trigger point type of owner gaia as fixed disappear point, where units disappear if they enter its set range?
		"players": [TRADER_PLAYER],
		"maxRange": 50,
		"requiredComponent": IID_UnitAI,
		"enabled": true
	}
	cmpTrigger.RegisterTrigger("OnRange", "HarbourArrival", d);


	return true;
}

	
Trigger.prototype.HarbourArrival = function(data)
{
	var ents = data.added;
	if (!data.added)
		ents = data.currentCollection;
	if (!ents)	
		return false;
	
	var ship_spawn_entities = this.GetTriggerPoints("C"); 

	for each (var ent in ents)
	{
		var ent_key = this.traders_on_their_way.indexOf(ent);
		if (ent_key === -1)
			continue;
		
		var cmpRangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
		var entities = cmpRangeMan.GetEntitiesByPlayer(DEFENDER_PLAYER);
		// TODO choose nearby entity if performance permits and it should as trading is seldom but should help a lot.
		// Note: As side-effect this also increases the chance to persuade a trader to trade despite the Gallic Wars by positioning Gaul heroes or champions close to the dock.
		var trading_entity = pickRandomly(entities);
		this.PerformTrade(trading_entity);
	
		// move the ship back to where it came from or to a random trigger point on the sea:
		var target_point = pickRandomly(ship_spawn_entities);
		var cmpPosition = Engine.QueryInterface(target_point, IID_Position);
		var pos = cmpPosition.GetPosition();
		var cmpUnitAi = Engine.QueryInterface(ent, IID_UnitAI);
		if (cmpUnitAi)
			cmpUnitAi.WalkToPointRange(pos.x, pos.z, 0, 15, true);
		else 
		{
			var cmpUnitMotion = Engine.QueryInterface(ent, IID_UnitMotion);
			cmpUnitMotion.MoveToTargetRange(target_point, 0, 15);
		}
		
		// mark for disappearance:
		if (this.disappearOrderQueue.indexOf(ent) === -1)
			this.disappearOrderQueue.push(ent);
		
		this.traders_on_their_way[ent_key] = undefined; // <-- delete/unset
		
	}
	
//TODO make triggers reregisterable?	
//	if (this.traders_on_their_way.length < 1)
//		cmpTrigger.DisableTrigger("OnRange", "HarbourArrival");
		
	var d = {};
	d = {
		"entities": ship_spawn_entities, //<-- this is still suboptimal if the DisappearOnArrival is registered with the same event again but with different entities (overwriting the ones we registered/set here). TODO Maybe use one trigger point type of owner gaia as fixed disappear point, where units disappear if they enter its set range?
		"players": [TRADER_PLAYER],
		"maxRange": 50,
		"requiredComponent": IID_UnitAI,
		"enabled": true
	}
	cmpTrigger.RegisterTrigger("OnRange", "DisappearOnArrival", d);


	return true;
}

Trigger.prototype.DisappearOnArrival = function(data)
{
	var entities = data.added;
	if (!entities)
		entities = data.currentCollection;
	if (!entities)
		return false;

	for each (var ent in entities)
	{
		var index = this.disappearOrderQueue.indexOf(ent);
		if (index !== -1)
		{
			var cmpPosition = Engine.QueryInterface(ent, IID_Position);
			cmpPosition.MoveOutOfWorld();
			this.disappearOrderQueue[index] = undefined;
		}
	}

//TODO make triggers reregisterable?	
//	if (this.disappearOrderQueue.length < 1)
//		cmpTrigger.DisableTrigger("OnRange", "DisappearOnArrival");
	return true;
}

// Use this trading function instead of the one that cmpTrader provides:
Trigger.prototype.PerformTrade = function(currentHarbour) // <-- every gaul can trade (UNUSED)
{
	if (!currentHarbour)
		return false;
	var tradable_goods = ["metal", "wood", "food", "stone"];
	var goods = {};
	// get player good preference:
	var nextGoods; 
	var cmpPlayer = QueryOwnerInterface(currentHarbour, IID_Player);
	if (cmpPlayer)
		nextGoods = cmpPlayer.GetNextTradingGoods();

	if (!nextGoods)
		nextGoods = pickRandomly(tradable_goods);

	goods.type = nextGoods;
	var TRADER_GOOD_AMOUNT_MAX = 10000;
	goods.amount = {"traderGain": Math.round(Math.random() * TRADER_GOOD_AMOUNT_MAX, 0), "is_willing_to_trade": (Math.random() * 100 > 33)};
	goods.origin = currentHarbour;
	if (goods.amount && goods.amount.traderGain)
	{
		if (!goods.amount.is_willing_to_trade)
		{
			// a hero or champion or building can still trade.
			var cmpBuildingAI = Engine.QueryInterface(currentHarbour, IID_BuildingAI); 
			var cmpIdentity = Engine.QueryInterface(currentHarbour, IID_Identity);
			if (!cmpIdentity)
				return false;
			var succeedingEntityClass;
			var classes_able_to_persuade_the_trader = ["Champion", "Hero", "Dock"];
			for each (var persuading_class in classes_able_to_persuade_the_trader)
				if (cmpIdentity.GetClassesList().indexOf(persuading_class) !== -1)
				{
					succeedingEntityClass = persuading_class;
					PushGUINotification([DEFENDER_PLAYER], "Trader: 'I did not want to trade with folks like you as the Roman power reaches far, but as you sent a "+ succeedingEntityClass +" as envy I'll make an exception.'");
					break;
				}
			if (!succeedingEntityClass)
			{
				PushGUINotification([DEFENDER_PLAYER], "The trader wasn't willing to trade.");
				return false;
			}
		}
		//PushGUINotification([DEFENDER_PLAYER], "The trader was willing to trade.");
		
		if (cmpPlayer)
			cmpPlayer.AddResource(goods.type, goods.amount.traderGain);

		var cmpStatisticsTracker = QueryOwnerInterface(currentHarbour, IID_StatisticsTracker);
		if (cmpStatisticsTracker)
			cmpStatisticsTracker.IncreaseTradeIncomeCounter(goods.amount.traderGain);

		return true;
	}

	return false;
};


Trigger.prototype.grant_one_time_druid_reinforcements = function(spawn_points)
{


	// TODO Or rather use the druid for the spawn position?
	var druid_trigger_point = cmpTrigger.GetTriggerPoints("D")[0];
    if (spawn_points)
	    druid_trigger_point = pickRandomly(spawn_points);
    
	var count = Math.round(10 * Math.random(), 0);
	TriggerHelper.SpawnUnits(druid_trigger_point, "units/gaul_infantry_javelinist_a", Math.max(1, count), DEFENDER_PLAYER); 
	
	// TODO more diversity! 
	PushGUINotification([DEFENDER_PLAYER], "Druid: 'My friends! Please welcome these " + count + " Gallic neighbours!'"); 
	return true; 
}	


Trigger.prototype.lessen_major_enemy_attack_probability = function()
{
	this.debug('decrease major enemy attack probability');
	if (this.major_enemy_attack_probability > this.MAJOR_ENEMY_ATTACK_PROBABILITY_MIN + this.MAJOR_ENEMY_ATTACK_PROBABILITY_STEP)
	{
		this.major_enemy_attack_probability -= this.MAJOR_ENEMY_ATTACK_PROBABILITY_STEP;
	}
	
}

Trigger.prototype.increase_major_enemy_attack_probability = function()
{
	this.debug('increase major enemy attack probability');
	if (this.major_enemy_attack_probability < this.MAJOR_ENEMY_ATTACK_PROBABILITY_MAX - this.MAJOR_ENEMY_ATTACK_PROBABILITY_STEP)
	{
		this.major_enemy_attack_probability += this.MAJOR_ENEMY_ATTACK_PROBABILITY_STEP;
	}
	
}
		
		
Trigger.prototype.grant_gallic_neighbours_reinforcements = function()
{
	if (random_abort(95))
		return false;
	
	this.grant_one_time_druid_reinforcements(this.GetTriggerPoints("B"));
	return true;
}


Trigger.prototype.random_launch_major_enemy_assault = function(data)
{
	var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (random_abort(1 - cmpTrigger.major_enemy_attack_probability))
		return ;
}

cmpTrigger.major_enemy_attack_attacking_entities = []; 
cmpTrigger.major_enemy_attack_entities_on_the_way = []; 
Trigger.prototype.launch_major_enemy_assault = function()
{
	
	PushGUINotification([DEFENDER_PLAYER], "Spies: 'We have spotted a major enemy assault. Are we lost?'");

	// launch a giant enemy assault.
	// 1) spawn strong enemy units for the attack.
	var entities = [];	
	
	var trigger_points_in_roman_camp = this.GetTriggerPoints("F");
	entities = this.spawn(trigger_points_in_roman_camp, this.units_to_spawn[INTRUDER_PLAYER], INTRUDER_PLAYER);

	// 2) choose random roads (from trigger points I)
	var road_trigger_points = cmpTrigger.GetTriggerPoints("I"); 
	if (!road_trigger_points)
	{
		this.debug("No trigger points (I) that define each road that can be taken towards the Gallic village.");
		return ;
	}
	
	// in formation, reusing the rally point system:
	var cmpRallyPoint;
	// find structure that has a RallyPoint component.
	for (var structure of this.playerData[INTRUDER_PLAYER].initial_buildings)
	{
		cmpRallyPoint = Engine.QueryInterface(structure, IID_RallyPoint);
		if (cmpRallyPoint)
			break;
	}
	if (cmpRallyPoint)
	{
		// save previous state:
		var positions_old = cmpRallyPoint.GetPositions();
		var data_old = cmpRallyPoint.GetData();

		cmpRallyPoint.Unset();
		//cmpRallyPoint.Reset(); // TODO use if RallyPointRenderer should also be reset (also calls Unset()).
			
		var chosen_target = pickRandomly(road_trigger_points);
		var cmpPosition = Engine.QueryInterface(chosen_target, IID_Position);
		var pos = cmpPosition.GetPosition();
		cmpRallyPoint.AddPosition(pos.x, pos.z);
		
		cmpRallyPoint.AddData({"command": "walk"/*, "targetClasses": ["Unit", "Structure"]*/});
		
		var commands = GetRallyPointCommands(cmpRallyPoint, entities);
		for each(var command in commands)
			ProcessCommand(INTRUDER_PLAYER, command);
		
		// restore to previous state:
		cmpRallyPoint.Unset();
		for (var pos_old of positions_old)
			cmpRallyPoint.AddPosition(pos_old);
		cmpRallyPoint.AddData(data_old);
	}

	for each (var ent in entities)
	{
		// treat only existing and alive units (TODO in world entities only? if garrisoned, then the position is -1).
		if (ent == undefined)
			continue;
		
		var cmpUnitAi = Engine.QueryInterface(ent, IID_UnitAI);
		if (!cmpUnitAi.TargetIsAlive(ent))
			continue;
		
		// if the spawned units were already sent to the target position in formation using a rally point, then skip the per-entity command.
		if (!cmpRallyPoint) {
			var chosen_target = pickRandomly(road_trigger_points);
			//cmpUnitAi.PushOrderFront(
			//	"WalkToTargetRange", { "target": chosen_target, "min": 0, "max": 15 }
			//);
			
			var cmpPosition = Engine.QueryInterface(chosen_target, IID_Position);
			var pos = cmpPosition.GetPosition();
			cmpUnitAi.WalkToPointRange(pos.x, pos.z, 0, 15, true);
			//var cmpUnitMotion = Engine.QueryInterface(ent, IID_UnitMotion);
			//cmpUnitMotion.MoveToTargetRange(chosen_target, 0, 15);
		}
		
		if (cmpTrigger.major_enemy_attack_attacking_entities.indexOf(ent) === -1)
			cmpTrigger.major_enemy_attack_entities_on_the_way.push(ent); 

	}

	// Set up a trigger that further guides the entities towards the gallic village once the road waypoints has been reach:
	var d = {};
	d = {
		"entities": road_trigger_points, //<-- this is still suboptimal if the DisappearOnArrival is registered with the same event again but with different entities (overwriting the ones we registered/set here). TODO Maybe use one trigger point type of owner gaia as fixed disappear point, where units disappear if they enter its set range?
		"players": [INTRUDER_PLAYER],
		"maxRange": 30, // when the centurio comes in sight of the building. TODO Derive from the target entity's template?
		"requiredComponent": IID_UnitAI,
		"enabled": true
	}
	cmpTrigger.RegisterTrigger("OnRange", "if_attacking_entities_arrived_at_road_waypoint_then_give_further_orders", d);
	//cmpTrigger.EnableTrigger("OnRange", "if_attacking_entities_arrived_at_road_waypoint_then_give_further_orders");

}

Trigger.prototype.if_attacking_entities_arrived_at_road_waypoint_then_give_further_orders = function(data)
{
	var siege_trigger_points = cmpTrigger.GetTriggerPoints("J");
	var siege_trigger_point_chosen_index = Math.round(Math.random() * (siege_trigger_points.length - 1), 0);
	
	for each (var ent in this.major_enemy_attack_entities_on_the_way)
	{
		// treat only existing and alive units (TODO in world entities only? if garrisoned, then the position is -1).
		if (!ent)
			continue;
		
		var cmpUnitAi = Engine.QueryInterface(ent, IID_UnitAI);
		if (!cmpUnitAi || !cmpUnitAi.TargetIsAlive(ent))
			continue;
		
		var cmpUnitAI = Engine.QueryInterface(ent, IID_UnitAI);
		var chosen_target = siege_trigger_points[siege_trigger_point_chosen_index];
		//var cmpUnitMotion = Engine.QueryInterface(this.playerData[INTRUDER_PLAYER].leader, IID_UnitMotion);
		//cmpUnitMotion.MoveToTargetRange(fortress_trigger_point, 0, 20);
		var cmpPosition = Engine.QueryInterface(chosen_target, IID_Position);
		var pos = cmpPosition.GetPosition();
		cmpUnitAI.WalkToPointRange(pos.x, pos.z, 0, 20, true);
		//var cmpUnitMotion = Engine.QueryInterface(ent, IID_UnitMotion);
		//cmpUnitMotion.MoveToTargetRange(chosen_target, 0, 20);


		if (this.major_enemy_attack_attacking_entities.indexOf(ent) === -1)
			this.major_enemy_attack_attacking_entities.push(ent);
		
		var ent_key = this.major_enemy_attack_entities_on_the_way.indexOf(ent);
		if (ent_key !== -1)
			this.major_enemy_attack_entities_on_the_way[ent] = undefined;

	}


	// Set up a trigger that further provides attack orders/plans for the entities:
	var d = {};
	d = {
		"entities": siege_trigger_points, //<-- this is still suboptimal if the DisappearOnArrival is registered with the same event again but with different entities (overwriting the ones we registered/set here). TODO Maybe use one trigger point type of owner gaia as fixed disappear point, where units disappear if they enter its set range?
		"players": [INTRUDER_PLAYER],
		"maxRange": 50, // when the centurio comes in sight of the building. TODO Derive from the target entity's template?
		"requiredComponent": IID_UnitAI,
		"enabled": true
	}
	cmpTrigger.RegisterTrigger("OnRange", "if_attacking_entities_arrived_at_siege_point_then_give_further_orders", d);
	//cmpTrigger.EnableTrigger("OnRange", "if_attacking_entities_arrived_at_siege_points_then_give_further_orders");

}


Trigger.prototype.if_attacking_entities_arrived_at_siege_point_then_give_further_orders = function(data)
{
	for each (var ent in this.major_enemy_attack_attacking_entities)
	{
		// treat only existing and alive units (TODO in world entities only? if garrisoned, then the position is -1).
		if (!ent)
			continue;
		
		var cmpUnitAi = Engine.QueryInterface(ent, IID_UnitAI);
		if (!cmpUnitAi)
			continue;
		if (!cmpUnitAi.TargetIsAlive(ent))
			continue;
		
	 	attackNearbyEnemy(ent, 0, 250);
	}
}
	
function attackNearbyEnemy(entity, range_min, range_max)
{
	var cmpUnitAi = Engine.QueryInterface(entity, IID_UnitAI);
	if (!cmpUnitAi)
		return; 

	var nearby = getNearbyEnemies(entity, range_min, range_max);

	var target = undefined;
	var target_cmpIdentity = undefined;
	for each (var ent in nearby)
	{
        var cmpIdentity = Engine.QueryInterface(ent, IID_Identity);
		// Don't attack possibly captured Romans: (as you might want to re-convert or free them)
		if (!cmpIdentity || cmpIdentity.GetCiv().indexOf("rom") !== -1)
			continue;
		target = ent;
		target_cmpIdentity = cmpIdentity;
		break;

	}

	if (!target)
		return ;

    var cmpEnemyOfRomanPosition = Engine.QueryInterface(target, IID_Position);
   	var pos = cmpEnemyOfRomanPosition.GetPosition();
	cmpUnitAi.PushOrderFront("WalkAndFight", { "x": pos.x, "z": pos.z, "targetClasses": {"attack": undefined, "avoid": undefined }, "force": false });
}


function random_abort(abort_chance_percent_float_or_int)
{
	var abort_chance_percent_integer = 0;
	if (Math.round(abort_chance_percent_float_or_int, 0) * 100 === abort_chance_percent_float_or_int * 100)
		// no comma => no float!
		abort_chance_percent_integer = abort_chance_percent_float_or_int;
	else
		abort_chance_percent_integer = abort_chance_percent_float_or_int * 100;
	
	// random decision: (99 because of 0 being included.)
	var chance = Math.round(Math.random() * 99, 0);
	//warn('chance: ' + chance + ' < abort_chance_percent_integer: ' + abort_chance_percent_integer + ' ('+abort_chance_percent_float_or_int+')');	
	// e.g. chance_percent = 70 
	if (chance < abort_chance_percent_integer)
		return true;
	return false;
}

function pickRandomly(list)
{
	if (!list || !list.length || list.length < 1)
		return undefined;

	return list[Math.round(Math.random() * (list.length - 1), 0)];
}

function now()
{
	var cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	if (cmpTimer)
		return cmpTimer.GetTime();
	return -1;
}

