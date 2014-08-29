Engine.IncludeModule("common-api");

var JansTMAI = (function() {
var m = {};

// "local" global variables for stuffs that will need a unique ID
// Note that since order of loading is alphabetic, this means this file must go before any other file using them.
m.playerGlobals = [];

m.PetraBot = function PetraBot(settings)
{
	API3.BaseAI.call(this, settings);

	this.turn = 0;
	this.playedTurn = 0;
	this.elapsedTime = 0;

	this.Config = new m.Config();
	this.Config.updateDifficulty(settings.difficulty);	
	//this.Config.personality = settings.personality;	

	this.savedEvents = {};
};

m.PetraBot.prototype = new API3.BaseAI();

m.PetraBot.prototype.CustomInit = function(gameState, sharedScript)
{
};

m.PetraBot.prototype.OnUpdate = function(sharedScript)
{
	
	this.turn++;
};

// defines our core components strategy-wise.
// TODO: the sky's the limit here.
m.PetraBot.prototype.initPersonality = function()
{
	if (this.Config.difficulty >= 2)
	{
		this.Config.personality.aggressive = Math.random();
		this.Config.personality.cooperative = Math.random();
	}

	if (this.Config.personality.aggressive > 0.7)
	{
		this.Config.Military.popForBarracks1 = 12;
		this.Config.Economy.popForTown = 55;
		this.Config.Economy.popForMarket = 70;
		this.Config.Economy.femaleRatio = 0.3;
		this.Config.priorities.defenseBuilding = 60;
	}

	if (this.Config.debug == 0)
		return;
	API3.warn(" >>>  Petra bot: personality = " + uneval(this.Config.personality));
};

/*m.PetraBot.prototype.Deserialize = function(data, sharedScript)
{
};

// Override the default serializer
PetraBot.prototype.Serialize = function()
{
	return {};
};*/

return m;
}());
