// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildApplyMember.js
//  Creator 	:  
//  Date		: 2015-6-26
//  Comment	: 
// ***************************************************************

var GuildInfo = require('./GuildInfo');
var GuildErr = require('./GuildErr');

var ObjectUtility = require('app/util/ObjectUtility');

var GuildApplyMember = function(data, info)
{
	this.data = data;
	this.info = info; 
};


GuildApplyMember.prototype.create = function(data, info)
{
	this.data = data;
	this.info = info;
};


GuildApplyMember.prototype.setApplyCondition = function(isCondition, level)
{
	this.data.info.isCondition = isCondition;
	this.data.info.applyLevel = level;
};


GuildApplyMember.prototype.isCondition = function()
{
	return this.data.info.isCondition ?  false : this.data.info.isCondition;
};


GuildApplyMember.prototype.addApplyMember = function(pid, nickname, level, fight, icon) 
{
	if(this.data.memberRequests.hasItem(pid) == true)
	{
		throw GuildErr.AlreadyApplyMember;
	}
	if(level < this.data.info.applyLevel)
	{
		throw GuildErr.NotEnoughLevel;
	}
	
	var applyMember = this.data.memberRequests.createItem(pid);
	applyMember.playerId = pid;
	applyMember.nickname = nickname;
	applyMember.level = level;
	applyMember.fight = fight;
	applyMember.icon = icon;
	applyMember.createTime = Date.now();
};


GuildApplyMember.prototype.removeApplyMember = function(pid)
{
	if(this.data.memberRequests.hasItem(pid) == false)
	{
		throw GuildErr.NotExistsApplyPlayer;
	}
	this.data.memberRequests.deleteItem(pid);
};


GuildApplyMember.prototype.getApplyMember = function(pid)
{
	if(this.data.memberRequests.hasItem(pid) == false)
	{
		throw GuildErr.NotExistsApplyPlayer;
	}

	return this.data.memberRequests[pid];
};


GuildApplyMember.prototype.isApplyMember = function(pid)
{
	if(this.data.memberRequests.hasItem(pid) == true)
	{
		return true;
	}
	return false;
};


GuildApplyMember.prototype.clearOvertimeMember = function()
{
	var self = this;
	function forEachFunction(pid)
	{
		var player = self.data.memberRequests[pid];
		if((Date.now() - player.createTime) > GuildDate.applyMemberExistTimeLimit)
		{
			self.data.memberRequests.deleteItem(pid);
		}
	};

	this.data.memberRequests.forEachItem(forEachFunction);
};


GuildApplyMember.prototype.verifierApplyMember = function(applyId, isOk, callback)
{
	var applyMember = this.getApplyMember(applyId);
	function getApplyComplete(result)
	{
		var applyMember = this.getApplyMember(applyId);
		if(result == true)
		{
			this.removeApplyMember(applyId);
			callback && callback(GuildErr.AlreadyJoinGuild);
			return ;
		}
		if (applyMember) 
		{
			if (isOk) 
			{
				this.info.addMember(applyMember.playerId, applyMember.nickname, applyMember.level, applyMember.fight, 3, applyMember.icon);
				this.removeApplyMember(applyId);
				callback && callback(GuildErr.Sucess, {type : true, guildName : this.data.info.guildName});
			}
			else
			{
				this.removeApplyMember(applyId);
				callback && callback(GuildErr.Sucess, {type : false, guildName :this.data.info.guildName});
			};
		} 
	};

	require('pomelo').app.rpc.logic.guildRemote.isExistsGuild(applyId, applyId, getApplyComplete.bind(this));
};


GuildApplyMember.prototype.getApplyMemberList = function()
{
	var self = this;
	var retArr = [];

	function foreachItem(pid)
	{
		var player = self.data.memberRequests[pid];
		retArr.push({playerId : pid, nickname : player.nickname,  level: player.level, fight : player.fight, icon: player.icon});
	}

	this.data.memberRequests.forEachItem(foreachItem);
	
	return retArr;
};


module.exports = function(data, info)
{
	return new GuildApplyMember(data, info);
};