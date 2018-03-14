// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildData.js
//  Creator 	: zg 
//  Date		: 2015-6-19
//  Comment	: 
// ***************************************************************


var GuildErr = require('./GuildErr');
var ObjectUtility = require('app/util/ObjectUtility');
var textFilter = require('app/modules/textFilter');
var time = require('app/util/time');

var GuildData = function()
{
	this.jobType = 
	[
		{id: 1,  name: '帮主'}, 
		{id: 2,  name: '副帮主'}, 
		{id: 3,  name: '帮众'}
	];

	this.permissionType = 
	[
		{id: 1,  name: '职务任命'}, 
		{id: 2,  name: '解散协会'}, 
		{id: 3,  name: '入会条件设置'},
		{id: 4,  name: '修改帮会公告'}, 
		{id: 5,  name: '修改帮会会徽'}, 
		{id: 6,  name: '踢出帮会'},
		{id: 7,  name: '成员审核'}, 
		{id: 8,  name: '商店'}, 
		{id: 9,  name: '参拜'},
		{id: 10, name: '聊天'}, 
		{id: 11, name: '帮会动态'},
		{id: 12, name: '改变会长'}
	];

	this.authPermission = 
	[
		{jobId: 1, permissionId: 1,  val: true},
		{jobId: 1, permissionId: 2,  val: true},
		{jobId: 1, permissionId: 3,  val: true},
		{jobId: 1, permissionId: 4,  val: true},
		{jobId: 1, permissionId: 5,  val: true},
		{jobId: 1, permissionId: 6,  val: true},
		{jobId: 1, permissionId: 7,  val: true},
		{jobId: 1, permissionId: 8,  val: true},
		{jobId: 1, permissionId: 9,  val: true},
		{jobId: 1, permissionId: 10, val: true},
		{jobId: 1, permissionId: 11, val: true},
		{jobId: 1, permissionId: 12, val: true},

		{jobId: 2, permissionId: 1,  val: false},
		{jobId: 2, permissionId: 2,  val: false},
		{jobId: 2, permissionId: 3,  val: true},
		{jobId: 2, permissionId: 4,  val: true},
		{jobId: 2, permissionId: 5,  val: true},
		{jobId: 2, permissionId: 6,  val: true},
		{jobId: 2, permissionId: 7,  val: true},
		{jobId: 2, permissionId: 8,  val: true},
		{jobId: 2, permissionId: 9,  val: true},
		{jobId: 2, permissionId: 10, val: true},
		{jobId: 2, permissionId: 11, val: true},
		{jobId: 1, permissionId: 12, val: false},

		{jobId: 3, permissionId: 1,  val: false},
		{jobId: 3, permissionId: 2,  val: false},
		{jobId: 3, permissionId: 3,  val: false},
		{jobId: 3, permissionId: 4,  val: false},
		{jobId: 3, permissionId: 5,  val: false},
		{jobId: 3, permissionId: 6,  val: false},
		{jobId: 3, permissionId: 7,  val: false},
		{jobId: 3, permissionId: 8,  val: true},
		{jobId: 3, permissionId: 9,  val: true},
		{jobId: 3, permissionId: 10, val: true},
		{jobId: 3, permissionId: 11, val: true},
		{jobId: 1, permissionId: 12, val: false},
	];

	this.guildMessageFormat = 
	[
		{type :1, 	format: '%s玩家加入了协会，协会的实力愈发强大了'},
		{type :2, 	format: '%s玩家退出了协会'},
		{type :3, 	format: '%s玩家被任命为副会长'},
		{type :4, 	format: '%s玩家被解除了副会长职务'},
		{type :5, 	format: '%s将会长的职务转交给了%s'},
		{type :6, 	format: '会长%s连续7日未上线，%s玩家弹劾会长成功，成为新的会长'},
		{type :7, 	format: '%s玩家进行了高级参拜仪式，为协会增加了%s点协会经验'},
		{type :8, 	format: '%s玩家进行了高级参拜仪式，因心怀至诚触发暴击，为协会增加了%d点协会经验'},
		{type :9, 	format: '%s玩家进行了中级参拜仪式，为协会增加了%s点协会经验'},
		{type :10, 	format: '%s玩家进行了中级参拜仪式，因心怀至诚触发暴击，为协会增加了%d点协会经验'},
		{type :11, 	format: '%s玩家进行了初级参拜仪式，为协会增加了%s点协会经验'},
		{type :12, 	format: '%s玩家进行了初级参拜仪式，因心怀至诚触发暴击，为协会增加了%d点协会经验'},
		{type :13, 	format: '众成员齐心协力，成功击败%s，为协会增加了%s点经验'},
	];

	this.joinLevelLimit = 0;

	this.createLevelLimit = 0;

	this.maxMessageLimit = 50;

	this.maxApplyLimit = 10;

	this.rankLimit = 10;
  
	this.recordRankList = 10;

	this.dissTime = 2 *60 * 1000;

	this.guildFightItemId = 1000;

	this.guildFightCountInterval = '30s';

	this.guildFightCountMax = 10;

	this.kickMemberIntervalLimit =  20 * 1000;

	this.dissolutionTimeLimit = 7 *24 * 60 * 60 * 1000;

	this.dissolutionMemberAmountLimit = 3;

	this.dissolutionGuildLevelLimit = 1;

	this.joinAndCreateTimeLimit = 60 * 1000;

	this.applyMemberExistTimeLimit = 3 * 24 * 60 * 60 * 1000;

	this.flushGuildRankTimeInterval = 10 * 1000;

	this.maxGuildListPageSize = 10;

	this.impeachTimeLimit = 7 *24 * 60 * 60 * 1000;

	this.resetCopyTime = '11h35m';
	this.clearApplyTime = '24h00m';
	this.clearDailyDataTime = '24h02m';
};


GuildData.prototype.init = function()
{
	this.guildFightCountInterval 		= tableReader.tableValueById('systemConfig', 'value', 'guild_fight_count_inc_interval');
    this.guildFightCountMax  			= tableReader.tableValueById('systemConfig', 'value', 'guild_fight_count_max');
	this.joinLevelLimit 				= tableReader.tableValueById('GuildSetting', 'args1', 'joinLevelLimit');
	this.createLevelLimit 				= tableReader.tableValueById('GuildSetting', 'args1', 'createLevelLimit');
	this.maxMessageLimit 				= tableReader.tableValueById('GuildSetting', 'args1', 'maxMessageLimit');
	this.maxApplyLimit 					= tableReader.tableValueById('GuildSetting', 'args1', 'maxApplyLimit');
	this.rankLimit 						= tableReader.tableValueById('GuildSetting', 'args1', 'rankLimit');
	this.recordRankList 				= tableReader.tableValueById('GuildSetting', 'args1', 'recordRankList');
	this.guildFightItemId 				= tableReader.tableValueById('GuildSetting', 'args1', 'guildFightItemId');
	this.maxGuildListPageSize 			= tableReader.tableValueById('GuildSetting', 'args1', 'maxGuildListPageSize');
	this.dissolutionMemberAmountLimit 	= tableReader.tableValueById('GuildSetting', 'args1', 'dissolutionMemberAmountLimit');
	this.dissolutionGuildLevelLimit 	= tableReader.tableValueById('GuildSetting', 'args1', 'dissolutionGuildLevelLimit');
	this.resetCopyTime 					= tableReader.tableValueById('GuildSetting', 'args1', 'resetCopyTime');
	this.clearApplyTime 				= tableReader.tableValueById('GuildSetting', 'args1', 'clearApplyTime');
	this.clearDailyDataTime 			= tableReader.tableValueById('GuildSetting', 'args1', 'clearDailyDataTime');

	this.dissTime 						= time.convertNumberFormat(tableReader.tableValueById('GuildSetting', 'args1', 'dissTime'));
	this.kickMemberIntervalLimit 		= time.convertNumberFormat(tableReader.tableValueById('GuildSetting', 'args1', 'kickMemberIntervalLimit'));
	this.dissolutionTimeLimit 			= time.convertNumberFormat(tableReader.tableValueById('GuildSetting', 'args1', 'dissolutionTimeLimit'));
	this.joinAndCreateTimeLimit 		= time.convertNumberFormat(tableReader.tableValueById('GuildSetting', 'args1', 'joinAndCreateTimeLimit'));
	this.applyMemberExistTimeLimit 		= time.convertNumberFormat(tableReader.tableValueById('GuildSetting', 'args1', 'applyMemberExistTimeLimit'));
	this.flushGuildRankTimeInterval 	= time.convertNumberFormat(tableReader.tableValueById('GuildSetting', 'args1', 'flushGuildRankTimeInterval'));
	this.impeachTimeLimit			 	= time.convertNumberFormat(tableReader.tableValueById('GuildSetting', 'args1', 'league_replace_cost'));
};


GuildData.prototype.getAuthPermission = function(jobId, permissionId)
{
	var isAllow = false;
	for(var authKey in this.authPermission) 
	{
		var auth = this.authPermission[authKey];
		if(auth.jobId == jobId && auth.permissionId == permissionId)
		{
			isAllow = true;
			break;
		}
	}
	return isAllow;
};


GuildData.prototype.checkPermission = function(jobId, permissionId)
{
	if(this.getAuthPermission(jobId, permissionId) == false)
	{
		switch(permissionId)
		{
			case 1:  
				throw GuildErr.NotPrivilegeChangeJob;
				break;
			case 2:
				throw GuildErr.NotPrivilegeDissolution;
				break;
			case 3:
				throw GuildErr.NotPrivilegeChangeCondition;
				break;
			case 4:
				throw GuildErr.NotPrivilegeChangeJob;
				break;
			case 5:
				throw GuildErr.NotPrivilegeChangeIcon;
				break;
			case 6:
				throw GuildErr.NotPrivilegeKickMember;
				break;
			case 7:
				throw GuildErr.NotPrivilegeAgreeJoin;
				break;
			case 8:
				throw GuildErr.NotPrivilegeUseShop;
				break;
			case 9:
				throw GuildErr.NotPrivilegeUseSacrifice;
				break;
			case 10:
				throw GuildErr.NotPrivilegeUseChat;
				break;
			case 11:
				throw GuildErr.NotPrivilegeShowMessage;
				break;
			case 12:
				throw GuildErr.NotPrivilegeChangeMaster;
				break;
		}
	}
};


GuildData.prototype.checkLevelLimit = function(level)
{
	if(level < this.joinLevelLimit)
	{
		throw GuildErr.NotEnoughLevel;
	}
};


GuildData.prototype.checkCreateLevelLimit = function(level)
{
	if(level < this.createLevelLimit)
	{
		throw GuildErr.NotEnoughLevelCreate;
	}
};


GuildData.prototype.isExistsJob = function(jobId)
{
	var isExists = false;
	for(var jobKey in this.jobType) 
	{
		var job = this.jobType[jobKey];
		if(job.id == jobId)
		{
			isExists = true;
		}
	}
	return isExists;
};


GuildData.prototype.getMessageFormat = function(typeId)
{
	var messageFormat = null;
	for(var formatKey in this.guildMessageFormat) 
	{
		var format = this.guildMessageFormat[formatKey];
		if(format.type == typeId)
		{
			messageFormat = format.format;
			break;
		}
	}
	if(messageFormat == null)
	{
		throw new Error('not exists guild message format : ' + type);
	}
	return messageFormat;
};


GuildData.prototype.checkName = function(name) 
{
    if (name.indexOf(" ") >= 0) 
    {
        throw GuildErr.NotAllowName;
    }
    if (name.indexOf("　") >= 0) 
    {
        throw GuildErr.NotAllowName;
    }
    if (textFilter.testContainMask(name)) {
        throw GuildErr.NotAllowName;
    }
    if (!(/^[0-9a-zA-Z\u4E00-\u9FA5]+$/gi.test(name))) 
    {
        throw GuildErr.NotAllowName;
    }
    var len = name.replace(/[\u4E00-\u9FA5]/gi, "aa").length;
    if (len < 2 || len > 16) 
    {
        throw GuildErr.NotAllowName;
    }
};


GuildData.prototype.checkFilter = function(name)
{
    if (textFilter.testContainMask(name)) 
    {
        throw GuildErr.NotAllowName;
    }
};

module.exports = new GuildData();