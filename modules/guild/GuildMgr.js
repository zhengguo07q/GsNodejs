// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildMgr.js
//  Creator 	: zg 
//  Date		: 2015-6-18
//  Comment	: 
// ***************************************************************


var GuildStorage = require('app/dao/GuildStorage');
var Timer = require('app/core/Timer');
var async = require('async');
var ObjectUtility = require('app/util/ObjectUtility');
var NodeJsUtility = require('app/util/NodeJsUtility');
var ArrayUtility = require('app/util/ArrayUtility');

var GuildErr = require('./GuildErr');
var GuildData = require('./GuildData');
var GuildInfo = require('./GuildInfo');
var GuildShop = require('./GuildShop');

var GuildMgr = function()
{
	this.guildDict = {};
	this.guildListFast = [];
	this.guildIdDictByNameFast = {};
	this.resetCopyTime = '11h35m';
	this.resetShopTime = '18h16m';
	this.clearApplyTime = '24h00m';
	this.clearDailyDataTime = '24h02m';
};


GuildMgr.prototype.createGuildInfo = function(guildName, masterId, masterNickname, icon, level, fight, playerIcon, callback)
{
	var self = this;
	var guildInfo = GuildInfo();
	function createComplete()
	{
		self.cache(guildInfo);
		console.log('create guild complete');
		callback && callback(null, guildInfo);
	};
	guildInfo.create(guildName, masterId, masterNickname, icon,  level, fight, playerIcon, createComplete);
};


GuildMgr.prototype.searchGuildByNameOrId = function(nameOrId)
{
	var guild = this.guildDict[nameOrId];
	if(guild == undefined)
	{
		var guildId = this.guildIdDictByNameFast[nameOrId];
		if(guildId == undefined)
		{
			throw GuildErr.NotExistsGuild;
		}

		guild = this.guildDict[guildId];
		return guild;
	}
};


GuildMgr.prototype.isExistGuildName = function(guildName)
{
	if(this.guildIdDictByNameFast[guildName])
		return true;
	return false;
};


GuildMgr.prototype.getGuildInfoByGid = function(gid)
{
	var guild = this.guildDict[gid];
	if(guild == undefined)
	{
		throw GuildErr.NotExistsGuild;
	}
	return guild;
};


GuildMgr.prototype.cache = function(guildInfo)
{
	this.guildDict[guildInfo.guildData.guildId] = guildInfo;
	this.guildIdDictByNameFast[guildInfo.guildData.info.guildName] = guildInfo.guildData.guildId;
	this.guildListFast.push(guildInfo);
};


GuildMgr.prototype.clearCache = function(gid)
{
	var guildInfo = this.guildDict[gid];
	delete this.guildDict[gid];
	delete this.guildIdDictByNameFast[guildInfo.guildData.info.guildName];
	ArrayUtility.remove(this.guildListFast, guildInfo);
};


GuildMgr.prototype.removeGuildInfoFromAll = function(gid)
{
	this.clearCache(gid);
	GuildStorage().remove(gid, function(err)
	{
		if(err)
		{
			throw new Error('sys err : remove guild from mongodb error : gid ' + gid);
		}
	});
};


GuildMgr.prototype.getGuildListByPage = function(page)
{
	var guildInfoList = ArrayUtility.getListByPage(this.guildListFast, page, GuildData.maxGuildListPageSize);

	var issuedList = [];

	for(var id in guildInfoList)
	{
		var guildInfo = guildInfoList[id];
		if(guildInfo == null)
			continue;
		issuedList.push(guildInfo.getGuildBaseInfo());
	}
	return issuedList;
};


GuildMgr.prototype.getGuildRankList = function()
{
	var issuedList = []; 

	var len = (this.guildListFast.length > GuildData.rankLimit ? GuildData.rankLimit : this.guildListFast.length);
	for(var i=0; i<len; i++)
	{
		var guildInfo = this.guildListFast[i];
		issuedList.push(guildInfo.getGuildBaseInfo());
	}
	return issuedList;
};


GuildMgr.prototype.getGuildRankPosition = function(gid)
{
	var guildInfo = this.getGuildInfoByGid(gid);
	var position = this.guildListFast.indexOf(guildInfo);
	return position;
};


GuildMgr.prototype.flushGuildRank = function()
{
	function sortGuildList(a, b)
	{
		var aVal = a.guildData.info.experience;
		var bVal = b.guildData.info.experience;
		if(aVal == bVal)
		{
			return a.guildData.info.playerAmount < b.guildData.info.playerAmount
		}
		else
		{
			return aVal < bVal;
		}
	};
	this.guildListFast.sort(sortGuildList);
};


GuildMgr.prototype.resetCopy = function()
{
	var guildInfo = null;
	for(var infoKey in this.guildDict)
	{
		guildInfo = this.guildDict[infoKey];
		if(guildInfo == null)
			continue;
		guildInfo.guildCopy.resetCopy();
	}
};


GuildMgr.prototype.resetShop = function()
{
	var guildInfo = null;
	for(var infoKey in this.guildDict)
	{ 
		guildInfo = this.guildDict[infoKey];
		if(guildInfo == null)
			continue;
		guildInfo.guildShop.resetShop();
	}
};


GuildMgr.prototype.clearApply = function()
{
	var guildInfo = null;
	for(var infoKey in this.guildDict)
	{
		guildInfo = this.guildDict[infoKey];
		if(guildInfo == null)
			continue;
		guildInfo.guildApplyMember.clearOvertimeMember();
	}
};


GuildMgr.prototype.clearDailyData = function()
{
	var guildInfo = null;
	for(var infoKey in this.guildDict)
	{
		guildInfo = this.guildDict[infoKey];
		if(guildInfo == null)
			continue;
		guildInfo.clearDailyData();
	}
};


GuildMgr.prototype.loadGuildDictFromDb = function(callback)
{
	var self = this;

	function loadComplete(err, entitys)
	{
		if(err)
		{
			throw new Error('sys err : load guild dict from mongodb error ');
		}

		for(var eid in entitys)
		{
			if(entitys[eid].info.guildLevel == 0)
				continue;
			var guildInfo = GuildInfo(entitys[eid]);
			guildInfo.init();
			self.cache(guildInfo);
		}

		console.info('guild initialize complete');
		callback && callback();
	}
	GuildStorage().loadAllFromDb(loadComplete);
};


GuildMgr.prototype.saveGuildDictToDb = function()
{
	var guildInfoList = ObjectUtility.valueToArray(this.guildDict);

//	console.log('saveGuildDictToDb length : ' + guildInfoList.length);
    async.each(guildInfoList, this.saveGuildToDb.bind(this), function (err, entitys) 
    {
    	if(err)
    		console.log(err);

    });
};


GuildMgr.prototype.saveGuildToDb = function(guildInfo, next)
{
	GuildStorage().update(guildInfo.guildData, function(err)
	{
        if (err)
        {	
        	console.log(err);
        }
        NodeJsUtility.setImmediate(next);
	});
};


GuildMgr.prototype.initByGlobal = function(callback)
{
	GuildData.init();
	Timer.add('saveGuildDictToDb', this.saveGuildDictToDb.bind(this), 10 * Timer.millisecond);
	Timer.add('flushGuildRank', this.flushGuildRank.bind(this), GuildData.flushGuildRankTimeInterval);
	Timer.scheduler('resetCopy', this.resetCopy, 'day', GuildData.resetCopyTime);
	Timer.scheduler('resetShop', this.resetShop, 'day', GuildData.resetShopTime);
	Timer.scheduler('clearApply', this.clearApply, 'day', GuildData.clearApplyTime);
	Timer.scheduler('clearDailyData', this.clearDailyData, 'day', GuildData.clearDailyDataTime);
	this.loadGuildDictFromDb(callback);
};


GuildMgr.prototype.initByLogic = function(callback)
{
	GuildData.init();
};

module.exports = new GuildMgr();