// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildSacrifice.js
//  Creator 	:  
//  Date		: 2015-6-27
//  Comment	: 
// ***************************************************************

var tableReader = require('app/util/tableReader');
var MathUtility = require('app/util/MathUtility');
var ObjectUtility = require('app/util/ObjectUtility');

var GuildSacrifice = require('./GuildInfo');
var GuildData = require('./GuildData');
var GuildErr = require('./GuildErr');

var GuildSacrifice = function(data, info)
{
	this.data = data;
	this.info = info; 
};


GuildSacrifice.prototype.create = function(data, info)
{
	this.data = data;
	this.info = info; 
};


GuildSacrifice.prototype.apply = function(pid, typeId, vipLevel)
{
	if(this.data.members.hasItem(pid) == false)
	{
		throw GuildErr.NotExistsPlayer;   
	}

	var player = this.data.members[pid];
	if(player.sacrificeType != 0)
	{
		throw GuildErr.AlreadyJoinSacrifice;
	}
	
	var guildSacrificeEntry = tableReader.tableRowById('GuildSacrifice', typeId);
	if(vipLevel < guildSacrificeEntry.vipLimit)
	{
		throw GuildErr.SacrificeVipLimit;
	}
	var sacrificeData = this.getReward(typeId, guildSacrificeEntry, player, vipLevel);

	if(this.data.info.sacrificeProgress < this.info.guildEntry.sacrificeAmount)
	{
		this.data.info.sacrificeProgress += guildSacrificeEntry.progress;
	}
	this.data.info.sacrificeAmount += 1;

	player.contribution += sacrificeData.contribution;
	player.contributionAmout += sacrificeData.contribution;

	sacrificeData.sacrificeProgress = this.data.info.sacrificeProgress;
	sacrificeData.sacrificeAmount = this.data.info.sacrificeAmount;

	this.info.addExperience(sacrificeData.experience);
	player.sacrificeType = typeId;
	
	return sacrificeData;
};


GuildSacrifice.prototype.getReward = function(typeId, guildSacrificeEntry, player, vipLevel)
{
	var retSacrifice = {};

	var guildSacrificeCriticEntry = tableReader.tableRowByUnique('GuildSacrificeCritic', 'vipLevel', vipLevel);

	if(MathUtility.randomTrueFalse(guildSacrificeCriticEntry.critOdds, 1000))
	{
		retSacrifice.contribution = guildSacrificeEntry.contribution * guildSacrificeCriticEntry.CritRate;
		retSacrifice.experience = guildSacrificeEntry.exp * guildSacrificeCriticEntry.CritRate;
		retSacrifice.isOdds = true;
	}
	else
	{
		retSacrifice.contribution = guildSacrificeEntry.contribution;
		retSacrifice.experience = guildSacrificeEntry.exp;
		retSacrifice.isOdds = false;
	}

	this.info.guildMessage.add(this.getMessageId(typeId, retSacrifice.isOdds), player.nickname, retSacrifice.experience);
	return retSacrifice;
};


GuildSacrifice.prototype.getMessageId = function(typeId, isOdds)
{
	if(isOdds)
	{
		if(typeId == 1)
			return 12;
		else if(typeId == 2)
			return 10;
		else if(typeId == 3)
			return 8;
		else 
			return 12;
	}
	else
	{
		if(typeId == 1)
			return 11;
		else if(typeId == 2)
			return 9;
		else if(typeId == 3)
			return 7;
		else 
			return 11;
	}
};


module.exports = function(data, info)
{
	return new GuildSacrifice(data, info);
};