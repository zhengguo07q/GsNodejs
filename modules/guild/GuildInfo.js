// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildInfo.js
//  Creator 	: zg 
//  Date		: 2015-6-18
//  Comment	: 
// ***************************************************************


var GuildStorage = require('app/dao/GuildStorage');
var NodeJsUtility = require('app/util/NodeJsUtility');
var ObjectUtility = require('app/util/ObjectUtility');
var ArrayUtility = require('app/util/ArrayUtility');
var Timer = require('app/core/Timer');
var time = require('app/util/time');
var tableReader = require('app/util/tableReader');

var GuildData = require('./GuildData');
var GuildApplyMember = require('./GuildApplyMember');
var GuildCopy = require('./GuildCopy');
var GuildShop = require('./GuildShop');
var GuildTreasure = require('./GuildTreasure');
var GuildMessage = require('./GuildMessage');
var GuildErr = require('./GuildErr');
var GuildSacrifice = require('./GuildSacrifice');


var GuildInfo = function(entity)
{
	this.guildData = entity;
	this.guildEntry = null;

	this.guildApplyMember = new GuildApplyMember(entity, this);
	this.guildMessage = new GuildMessage(entity);
	this.guildTreasure = new GuildTreasure(entity);
	this.guildCopy = new GuildCopy(entity, this);
	this.guildShop = new GuildShop(entity);
	this.guildSacrifice = new GuildSacrifice(entity, this);
};


GuildInfo.prototype.create = function(guildName, playerId, playerNickname, icon, level, fight, playerIcon, callback)
{
	var self = this;
	function createComplete(err, entity)
	{
		self.guildData = entity;
		self.guildData.info.guildLevel = 1;
		self.guildData.info.guildName = guildName;
		self.guildData.info.masterId = playerId;
		self.guildData.info.masterNickname = playerNickname;
		self.guildData.info.contribution = 0;
		self.guildData.info.contributionAmout = 0;
		self.guildData.info.icon = icon;
		self.guildData.info.createTime = Date.now();
		self.init();

		self.guildData.info.announce = self.guildEntry.defaultAnnounce;
		self.guildData.info.notice = self.guildEntry.defaultNotice;
		self.guildApplyMember.create(self.guildData, self);
		self.guildMessage.create(self.guildData);
		self.guildTreasure.create(self.guildData);
		self.guildCopy.create(self.guildData, self);
		self.guildShop.create(self.guildData);
		self.guildSacrifice.create(self.guildData, self);

		self.addMember(playerId, playerNickname, level, fight, 1, playerIcon);
		callback && callback();
	};

	GuildStorage().createByAutoId(createComplete);
};


GuildInfo.prototype.init = function()
{
	this.guildEntry = tableReader.tableRowByUnique('GuildCreate', 'level', this.guildData.info.guildLevel);
	if(this.guildData.info.viceMasterIds == null)
	{
		this.guildData.info.viceMasterIds == [];
	}
	if(this.guildData.messages == null)
	{
		this.guildData.messages = [];
	}
	this.checkDissolution();
};


GuildInfo.prototype.addMember = function(pid, nickname, level, fight, job, icon)
{
	if(this.guildData.members.hasItem(pid) == true)
	{
		throw GuildErr.AlreadyJoinGuild;
	}
	if(this.guildData.info.playerAmount >= this.guildEntry.maxPlayerAmount)
	{
		throw GuildErr.ReachMaxAmount;
	}
    var player = this.guildData.members.createItem(pid);

	player.playerId = pid,
    player.nickname = nickname,
    player.level = level,
    player.fight = fight,
    player.online = true
    player.job = job;
    player.icon = icon;
    player.joinTime = Date.now();

    this.guildData.info.playerAmount += 1;
    this.guildMessage.add(1, player.nickname);
};


GuildInfo.prototype.removeMember = function(pid)
{
	if(this.guildData.members.hasItem(pid) == false)
	{
		throw GuildErr.NotExistsPlayer;
	}
	var player = this.guildData.members[pid];

	this.guildData.members.deleteItem(pid);

	this.guildData.info.playerAmount -= 1;
	this.guildMessage.add(2, player.nickname);
};


GuildInfo.prototype.getMember = function(pid)
{
	if(this.guildData.members.hasItem(pid) == false)
	{
		throw GuildErr.NotExistsPlayer;
	}
	return this.guildData.members[pid];
};


GuildInfo.prototype.getGuildMemberList = function()
{
	var issuedList = []; 
	var self = this;
	function forEach(itemId)
	{
		var item = self.guildData.members[itemId];
		issuedList.push(
		{
			playerId: item.playerId,
			icon: item.icon,
			nickname: item.nickname, 
			level: item.level, 
			vipLevel:item.vipLevel, 
			fight: item.fight, 
			contribution: item.contribution, 
			contributionAmout : item.contributionAmout, 
			offlineTime: item.offlineTime, 
			job: item.job
		});
	};
	this.guildData.members.forEachItem(forEach);
	return issuedList;
};


GuildInfo.prototype.getGuildDetailInfo = function()
{
	var info = this.guildData.info;
	var ret = {guildId: this.guildData.guildId, info: 
	{
		guildName: info.guildName, 
		guildLevel : info.guildLevel, 
		experience: info.experience, 
		isCondition: info.isCondition,
        applyLevel: info.applyLevel,
		icon: info.icon, 
		masterNickname : info.masterNickname,
		masterId: info.masterId,
		playerAmount: info.playerAmount, 
		playerAmountLimit : this.guildEntry.maxPlayerAmount , 
		announce : info.announce, 
		notice:info.notice, 
		viceMasterIds: info.viceMasterIds,
		sacrificeProgress : info.sacrificeProgress,
		sacrificeAmount : info.sacrificeAmount,
		chapterProgressId : info.chapterProgressId,
		dissolutionStartTime : info.dissolutionStartTime,
		dissolutionTime : info.dissolutionTime
	}}; 
	return ret;
};


GuildInfo.prototype.getGuildExtInfo = function(pid)
{
	var player = this.getMember(pid);
	return {ext :  
		{
			sacrificeType : player.sacrificeType,
			contribution: player.contribution, 
			contributionAmout : player.contributionAmout, 
			joinTime : player.joinTime
		}};
};


GuildInfo.prototype.getGuildBaseInfo = function()
{
	var info = this.guildData.info; 
	return {
		guildId : this.guildData.guildId, 
		guildName: info.guildName, 
		guildLevel : info.guildLevel, 
		icon: info.icon, 
		announce : info.announce, 
		masterNickname : info.masterNickname, 
		playerAmount: info.playerAmount, 
		playerAmountLimit : this.guildEntry.maxPlayerAmount 
	};
};


GuildInfo.prototype.addExperience = function(exp)
{
	var nextLevel = this.guildData.info.guildLevel + 1;
	var nextGuildCreateEntry = tableReader.tableRowByUnique('GuildCreate', 'level', nextLevel);
	if(nextGuildCreateEntry != null)
	{
		this.guildData.info.experience += exp;
		if(this.guildData.info.experience >= this.guildEntry.nextLevelExperience)
		{
			this.guildData.info.guildLevel += 1;
			this.guildEntry = nextGuildCreateEntry;
		}
	}
	else
	{
		this.guildData.info.experience += exp;
		if(this.guildData.info.experience > this.guildEntry.nextLevelExperience)
		{
			this.guildData.info.experience = this.guildEntry.nextLevelExperience;
		}
	}
};


GuildInfo.prototype.syncPlayerData = function(pid, level, icon, fight, isOnline)
{
	if(this.guildData.members.hasItem(pid) == false)
	{
		throw GuildErr.NotExistsPlayer;
	}
	var member = this.guildData.members[pid];
	if(isOnline == true)
	{
		member.level = level;
		member.icon = icon;
		member.fight = fight;
		member.offlineTime = 0;
	}
	else
	{
		member.offlineTime = Date.now();
	}
};


GuildInfo.prototype.fireJob = function(memberId)
{
	var player = this.getMember(memberId);
	if(player.job == 3)
	{
		throw GuildErr.AlreadyThisJob;
	}
	ArrayUtility.remove(this.guildData.info.viceMasterIds, player.playerId);
	player.job = 3;

	this.guildMessage.add(4, player.nickname);
};


GuildInfo.prototype.appointJob = function(memberId)
{
	var player = this.getMember(memberId);
	if(this.guildData.info.viceMasterIds.length >= this.guildEntry.viceMasterAmount)
	{
		throw GuildErr.OverJobLimit;
	}
	if(player.job == 2)
	{
		throw GuildErr.AlreadyThisJob;
	}

	this.guildData.info.viceMasterIds.push(memberId);
	player.job = 2;

	this.guildMessage.add(3, player.nickname);
};


GuildInfo.prototype.appointMasterJob = function(memberId)
{
	var oldMasterNickname = this.guildData.info.masterNickname;
	var masterPlayer = this.getMember(this.guildData.info.masterId);
	masterPlayer.job = 3;

	var player = this.getMember(memberId);
	player.job = 1;
	this.guildData.info.masterId = player.playerId;
	this.guildData.info.masterNickname = player.nickname;

	this.guildMessage.add(5, oldMasterNickname, player.nickname);
};


GuildInfo.prototype.impeach = function(memberId)
{
	var masterPlayer = this.getMember(this.guildData.info.masterId);
	ObjectUtility.print('_____________1');
	if(Date.now() - masterPlayer.offlineTime < GuildData.impeachTimeLimit)
	{
		ObjectUtility.print('_____________2');
		throw GuildErr.NotEnoughImpeachTime;
	}
	ObjectUtility.print('_____________3');
	masterPlayer.job = 3;
	ObjectUtility.print('_____________4');
	var oldMasterNickname = this.guildData.info.masterNickname;
	ObjectUtility.print('_____________5');
	var player = this.getMember(memberId);
	player.job = 1;
	this.guildData.info.masterId = player.playerId;
	this.guildData.info.masterNickname = player.nickname;

	this.guildMessage.add(6, oldMasterNickname, player.nickname);
};


GuildInfo.prototype.setDissolution = function(isCancel)
{
	if(isCancel)
	{
		this.guildData.info.dissolutionStartTime = 0;
		this.guildData.info.dissolutionTime = 0;
	}
	else 
	{
		this.guildData.info.dissolutionStartTime = time.now();
		this.guildData.info.dissolutionTime = GuildData.dissTime;
	}
	this.checkDissolution();
};


GuildInfo.prototype.checkDissolution = function()
{
	if((Date.now() - this.guildData.info.createTime) < GuildData.dissolutionTimeLimit)
	{
		Timer.once('dissolutionAuto' + this.guildData.guildId, this.dissolutionAuto.bind(this), (this.guildData.info.createTime + GuildData.dissolutionTimeLimit - Date.now()));
	}

	if(this.guildData.info.dissolutionStartTime != 0)
	{
		var now = time.now();
		var disTime = this.guildData.info.dissolutionTime - (now - this.guildData.info.dissolutionStartTime);
		Timer.once('dissolution' + this.guildData.guildId, this.dissolution.bind(this), disTime);
	}
	else
	{
		Timer.remveonce('dissolution' + this.guildData.guildId);
	}
};


GuildInfo.prototype.dissolutionAuto = function()
{
	if(this.guildData.info.playerAmount < GuildData.dissolutionMemberAmountLimit && this.guildData.info.guildLevel <= GuildData.dissolutionGuildLevelLimit)
	{
		this.dissolution();
	}
};


GuildInfo.prototype.dissolution = function()
{
	function eachDissolution(memberId, guildName)
	{
		if(require('pomelo').app.rpc != null)
		{
			require('pomelo').app.rpc.logic.guildRemote.leaveGuildInfo(memberId, memberId, guildName,  1, function () {});
		}
	};

	function foreachItem(memberId)
	{
		var member = this.guildData.members[memberId];
		NodeJsUtility.setImmediate(eachDissolution.bind(this, memberId, this.guildData.info.guildName));
	};
	this.guildData.members.forEachItem(foreachItem.bind(this));
	require('./GuildMgr').removeGuildInfoFromAll(this.guildData.guildId);
};


GuildInfo.prototype.checkPermission = function(pid, permissionId)
{
	var player = this.getMember(pid);
	GuildData.checkPermission(player.job, permissionId);
};


GuildInfo.prototype.changeGuildInfo = function(type, val)
{
	if(type == 1)
	{
		this.guildData.info.icon = val;
	}
	else if(type == 2)
	{
		GuildData.checkFilter(val);
		this.guildData.info.announce = val;
	}
	else if(type == 3)
	{
		GuildData.checkFilter(val);
		this.guildData.info.notice = val;
	}
};


GuildInfo.prototype.kick = function(pid)
{
	var player = this.getMember(pid);
	if(player.job == 2)
	{
		ArrayUtility.remove(this.guildData.info.viceMasterIds, player.playerId);
	}
	if(Date.now() - player.joinTime < GuildData.kickMemberIntervalLimit)
	{
		throw GuildErr.KickMemberIntervalLimit;
	}
	this.removeMember(pid);
	require('pomelo').app.rpc.logic.guildRemote.leaveGuildInfo(player.playerId, player.playerId, this.guildData.info.guildName,  2, function () {});
};


GuildInfo.prototype.exit = function(pid)
{
	var player = this.getMember(pid);
	if(player.job == 1)
	{
		throw GuildErr.NotAllowMasterExit;
	}
	if(player.job == 2)
	{
		ArrayUtility.remove(this.guildData.info.viceMasterIds, player.playerId);
	}
	this.removeMember(pid);
};


GuildInfo.prototype.clearDailyData = function()
{
	var self = this;
	function forEach(itemId)
	{
		var member = self.guildData.members[itemId];
		member.contribution = 0;
		member.sacrificeType = 0;
	};
	this.guildData.members.forEachItem(forEach);
};


module.exports = function(entity)
{
	return new GuildInfo(entity);
};