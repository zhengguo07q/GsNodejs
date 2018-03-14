// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildCopy.js
//  Creator 	: zg
//  Date		: 2015-6-27
//  Comment	: 
// ***************************************************************


var GuildInfo = require('./GuildInfo');
var GuildErr = require('./GuildErr');
var GuildData = require('./GuildData');

var ObjectUtility = require('app/util/ObjectUtility');
var EntityUtility = require('app/util/EntityUtility');

var GuildCopy = function(data, info)
{
	this.info = info;
	this.data = data;
	this.sortCopyRecords = [];
};


GuildCopy.prototype.create = function(data, info)
{
	this.info = info;
	this.data = data;
	this.resetCopys();
};


GuildCopy.prototype.resetCopys = function()
{
	if(this.data.info.chapterProgressId == 0)
	{
		this.data.info.chapterProgressId = 1;
	}

	var chapterProgressId = this.data.info.chapterProgressId;

	EntityUtility.deleteItem(this.data.copys);

	var self = this;
	tableReader.forEachTable('GuildCopy', function (nrow, oRow) 
	{
		if(oRow.chapterId == self.data.info.chapterProgressId)
		{
			var copyId = oRow.copyId;
			var monsterTeam = tableReader.tableRowById('monsterTeam', oRow.$monster.id);

			if(self.data.copys.hasItem(copyId) == false)
			{
				self.data.copys.createItem(copyId);						//创建出一个副本
			}
			var copy =	self.data.copys[copyId];					

			var totalHp = 0;
			for(var k in monsterTeam.monsters)
			{
				var monsterEntry = monsterTeam.monsters[k];
				if(copy.monsters.hasItem(monsterEntry.monster) == false)
				{
					copy.monsters.createItem(monsterEntry.monster);		//创建一个怪物
				}
				var monster = copy.monsters[monsterEntry.monster];

				monster.hp = monsterEntry.$monster.max_hp;
				if(monster.hp == 1)
					monster.hp = 0;
				totalHp += monster.hp;
			}

			copy.totalHp = totalHp;
			copy.totalMaxHp = totalHp;
		}
	});
};


GuildCopy.prototype.getCopyList = function()
{
	var retVal = [];
	var self = this;
	function forEachFunction(copyId)
	{
		var copy = self.data.copys[copyId];
		retVal.push({copyId : copyId, totalHp : copy.totalHp, totalMaxHp : copy.totalMaxHp});
	}	
	this.data.copys.forEachItem(forEachFunction);
	return retVal;
};


GuildCopy.prototype.getChapterProgress = function()
{
	return this.data.info.chapterProgressId;
};


GuildCopy.prototype.getCopy = function(copyId)
{
	if(this.data.copys.hasItem(copyId) == false)
	{
		throw GuildErr.NotExistsCopy;
	}
	return this.data.copys[copyId];
};


GuildCopy.prototype.getCopyMonsters = function(copyId)
{
	var guildCopyEntry = tableReader.tableRowByUniqueKey('GuildCopy', this.data.info.chapterProgressId, copyId);
	if(guildCopyEntry == null)
	{
		throw GuildErr.NotExistsCopy;
	}
	if(guildCopyEntry.unlock.unlock_condition == 'league_lvl' && guildCopyEntry.unlock.unlock_arg < this.data.info.guildLevel)
	{
		throw GuildErr.NotUnlockCopy;
	}

	var copy = this.getCopy(copyId);

	if(copy.totalHp == 0)
	{
		throw GuildErr.MonsterAlreadyDie;
	}

	var retVal = {};
	var self = this;
	function forEachFunction(monsterId)
	{
		var monster = copy.monsters[monsterId];
		retVal[monsterId] = monster.hp;
	};	
	copy.monsters.forEachItem(forEachFunction);
	
	return retVal;
};


GuildCopy.prototype.setCopyMonsters = function(copyId, pid, monsters)
{
	var copy = this.getCopy(copyId);
	var newTotalHp = 0;
	for(var monsterId in monsters)
	{
		var newHp = monsters[monsterId];
		newTotalHp += newHp;
		if(copy.monsters.hasItem(monsterId))
		{
			var monster = copy.monsters[monsterId];
			monster.hp =  newHp;
			if(monster.hp < 0)
			{
				monster.hp = 0;
			}
		}
	}

	var totalHurt = copy.totalHp - newTotalHp;
	copy.totalHp = newTotalHp;

	if(this.isKillChapter())
	{
		this.data.info.chapterProgressId += 1;
		this.resetCopys();
	}
	this.addRecordInfo(pid, totalHurt);

	return totalHurt;
};


GuildCopy.prototype.isKillChapter = function()
{
	var isKill = true;
	var self = this;
	function forEachFunction(id)
	{
		if(self.data.copys[id].totalHp > 0)
		{
			isKill = false;
		}
	};
	this.data.copys.forEachItem(forEachFunction);
	return isKill;
};


GuildCopy.prototype.isKillCopy = function(copyId)
{
	var copy = this.getCopy(copyId);
	if(copy.totalHp == 0)
		return true;
	return false;
};


GuildCopy.prototype.addReward = function(copyId, pid, donate)
{
	var reward = {experience : 0, contribution: donate};
	if(this.isKillCopy(copyId))
	{
		var guildCopyEntry = tableReader.tableRowByUniqueKey('GuildCopy', this.data.info.chapterProgressId, copyId);

		for(var dropId in guildCopyEntry.killer_drop)
		{
			if(guildCopyEntry.killer_drop[dropId].type == 'exp')
			{
				reward.experience += guildCopyEntry.killer_drop[dropId].arg;
			}
			else if(guildCopyEntry.killer_drop[dropId].type == 'donate')
			{
				reward.contribution += guildCopyEntry.killer_drop[dropId].arg;
			}
		}
	}

	this.info.addExperience(reward.experience);
	var player = this.info.getMember(pid);
	player.contribution += reward.contribution;
	player.contributionAmout += reward.contribution;
	return reward;
};


GuildCopy.prototype.addRecordInfo = function(pid, hurt)
{
	var member = this.info.getMember(pid);

	var copyRecord = null;
	if(this.data.copyRecords.hasItem(pid) == true)
	{
		copyRecord = this.data.copyRecords[pid];
	}
	else
	{
		copyRecord = this.data.copyRecords.createItem(pid);
		copyRecord.playerId = pid;
		copyRecord.maxHurt = 0;
		copyRecord.amount = 0;
		this.rebuildRecordInfo();
	}
	copyRecord.maxHurt = copyRecord.maxHurt + hurt;
	copyRecord.amount = copyRecord.amount + 1;

	this.sortCopyRecords.sort(this.sortRecordInfoFunc);
};


GuildCopy.prototype.rebuildRecordInfo = function()
{
	var self = this;
	this.sortCopyRecords = [];

	function foreachRecord(pid)
	{
		var record = self.data.copyRecords[pid];
		self.sortCopyRecords.push(record);
	}
	if(this.data != null && this.data.copyRecords != null)
	{
		this.data.copyRecords.forEachItem(foreachRecord);
	}
};


GuildCopy.prototype.sortRecordInfoFunc = function(copyRecord1, copyRecord2)
{
	return copyRecord1.maxHurt < copyRecord2.maxHurt;
};


GuildCopy.prototype.getRecordList = function(pid)
{
	if(this.sortCopyRecords.length == 0)
	{
		this.rebuildRecordInfo();
		this.sortCopyRecords.sort(this.sortRecordInfoFunc);
	}
	var selfRecord = {pos:0, hurt:0, amount: 0};
	var issuedList = []; 
	var pos = 0;
	var len = (this.sortCopyRecords.length > GuildData.recordRankList ? GuildData.recordRankList : this.sortCopyRecords.length);
	for(var i=0; i<len; i++)
	{
		var record = this.sortCopyRecords[i];
		if(this.data.members.hasItem(record.playerId) == false)
			continue
		if(pid == record.playerId)
		{
			selfRecord.pos = (i + 1);
			selfRecord.hurt = record.maxHurt;
			selfRecord.amount = record.amount;
		}
		var member = this.data.members[record.playerId];
		issuedList.push({playerId : record.playerId, nickname : member.nickname, icon : member.icon, level: member.level, vipLevel : member.vipLevel, hurt: record.maxHurt, amount: record.amount});
	}
	return {info : selfRecord, list : issuedList};
};


module.exports = function(data, info)
{
	return new GuildCopy(data, info);
};