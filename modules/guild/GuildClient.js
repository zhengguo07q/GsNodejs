// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildClient.js
//  Creator 	: zg 
//  Date		: 2015-6-26
//  Comment	: 
// ***************************************************************

var GuildData = require('./GuildData');
var GuildErr = require('./GuildErr');
var ObjectUtility = require('app/util/ObjectUtility');
var ArrayUtility = require('app/util/ArrayUtility');
var Battle = require('app/battle/main');
var drop = require('app/modules/drop');
var tableReader = require('app/util/tableReader');
var consume = require('app/modules/consume');
var buyResource = require('app/modules/buyResource');
var time = require('app/util/time');
var mail = require('app/modules/mail');
var util = require('util');

var GuildClient = function()
{

};


GuildClient.prototype.addGuildInfo = function(player, gid, guildName)
{
	player.Info.guildId = gid;
	player.Info.guildName = guildName;
	player.Info.guildLeaveTime = 0;
	player.Resource['guildFightCount'] = GuildData.guildFightCountMax;
	require('pomelo').app.rpc.global.GuildRemote.syncApplyInfo('', player.playerId, player.applys, true, function (result) 
	{
		player.applys = result; 
	});
	player.applys = [];
};


GuildClient.prototype.removeGuildInfo = function(player, guildName, reasonType)
{
	player.Info.guildId = '';
	player.Info.guildName = '';
	player.Info.guildLeaveTime = Date.now();
	if(reasonType == 1)
	{
        var mailEntry = tableReader.tableRowById('mail', 5);
        if(mailEntry)
        {
        	var content = util.format(mailEntry.content, time.formatDatatime(Date.now()));
        	mail.sendSystemMail(player, player.Mails, time.now() + 'br', mailEntry.sender, mailEntry.title, content,  [], function (err, ret) {});
        }
	}
	else if(reasonType == 2)
	{
		//被T
	}
	else if(reasonType == 3)
	{
		//退出
	}
};


GuildClient.prototype.checkGuildCoolDown = function(player)
{
	if(Date.now() - player.Info.guildLeaveTime < GuildData.joinAndCreateTimeLimit)
	{
		throw GuildErr.JoinAndCreateIntervalLimit;
	}
};


GuildClient.prototype.syncOnlinePlayerGuildInfo = function(player)
{
	if(player.Info.guildId == null || player.Info.guildId == '')
	{
		return ;
	}
	var fight = 0;
    if (player.Team["0"] != undefined) 
    {
        fight = player.Team["0"].power;
    }
	if(require('pomelo').app.rpc != null)
	{
		console.log(player.playerId, player.Info.guildId, player.Info.level, player.Info.head, fight);
		require('pomelo').app.rpc.global.GuildRemote.syncGuildMemberInfo('', player.playerId, player.Info.guildId, player.Info.level, player.Info.head, fight, true , function (result) {});
	}
};


GuildClient.prototype.syncOfflinePlayerGuildInfo = function(pid, gid)
{
	if(require('pomelo').app.rpc != null)
	{
		require('pomelo').app.rpc.global.GuildRemote.syncGuildMemberInfo('', pid, gid, 0, 0, 0, false , function (result) {});
	}
};


GuildClient.prototype.checkApplyList = function(player)
{
	if(player.applys == null)
	{
		player.applys = [];
	}
	var isJoin = false;
	if(player.Info.guildId != null && player.Info.guildId != '')
	{
		isJoin = true;
	}
	if(require('pomelo').app.rpc != null)
	{
		require('pomelo').app.rpc.global.GuildRemote.syncApplyInfo('', player.playerId, player.applys, isJoin, function (result) {player.applys = result;});
	}
};


GuildClient.prototype.injectApplyList = function(player, list)
{
	for(var i=0 ; i< list.length; i++)
	{
		var guildData = list[i];
		guildData.isApply = false;
		if(player.applys.indexOf(guildData.guildId) > -1)
		{
			guildData.isApply = true;
		}
	}
};


GuildClient.prototype.addApply = function(player, gid)
{
	if(player.applys.indexOf(gid) <= -1)
	{
		player.applys.push(gid);
	}
};


GuildClient.prototype.removeApply = function(player, gid)
{
	ArrayUtility.remove(player.applys, gid);
};


GuildClient.prototype.checkApply = function(player)
{
	var applys = player.guildinfo.applys;
	if(applys == null)
	{ 
		applys = [];
	}
	if(applys.length >= GuildData.maxApplyLimit)
	{
		throw GuildErr.OverApplyLimit;
	}
};


GuildClient.prototype.isExistsGuild = function(player)
{
	if(player.Info.guildId != null && player.Info.guildId != '')
		return true;
	return false;
};


GuildClient.prototype.fightBoss = function(player, chapterId, copyId, monsterInfo, callback)
{
	buyResource.restartAddResource(player, 'guildFightCount', GuildData.guildFightCountInterval, GuildData.guildFightCountMax);
	var guildCopyEntry = tableReader.tableRowByUniqueKey('GuildCopy', chapterId, copyId);
	var selfTeam = Battle.Team.loadFromPlayer(player, 0);
    var monsterTeam = Battle.Team.loadByMonsterTeam(guildCopyEntry.$monster.id);
    function fightComplete(fightResult)
    {
	    callback && callback({ret: 0, battle3: { win: true, scene: guildCopyEntry.scn_id,  battle: [fightResult.recorder.getLogs()] }}, fightResult.recorder.results);
    };
    Battle.runBattle3(selfTeam, monsterTeam, fightComplete, null, monsterInfo, true);
};


GuildClient.prototype.useGuildFightItem = function(player) 
{
    var consumeArr = [{
        consume_type: 'item',
        consume_arg: GuildData.guildFightItemId ,
        consume_arg2: 1
    }];  
    consume.consumeWithArray(player, consumeArr, {}, 1);
    player.Resource.guildFightCount ++;
};


//购买公会商品前的验证
GuildClient.prototype.checkBeforeBuy = function (player, consumeArr) {
    var consumeRet = consume.checkResource(player, consumeArr);
    return consumeRet;
}

GuildClient.prototype.tryBuyGuildShop = function (player, consumeArr, dropArr, msg) {
    //msg: {gid, shopid, pos, num}
    //若验证成功，修改玩家数据//扣除资源
    var consumeRet = consume.consumeWithArray(player, consumeArr);
    console.log(dropArr, 'dropitem~~')
    var dropRet = {};
    drop.dropWithArray(player, dropArr, dropRet, {});
    console.log(dropRet, 'dropRet~~');
    return {
        ret: 0,
        consume: consumeRet ? consumeRet.consume : undefined,
        drop: dropRet || {}
    }
}

//购买公会奖励礼包前的验证
GuildClient.prototype.TryBuyPkg = function (player, id, num, guildLevel) {
    var pkgRow = tableReader.tableRowById('guildPackage', id);
    console.log('pkgRow', pkgRow);
    if (!pkgRow){
        return {ret: GuildErr.ErrorId._val + GuildErr.ErrorId._subVal};
    }
    if (player.GuildPkg.hasItem(id) && player.GuildPkg[id] >= pkgRow.limit){
        return {ret: GuildErr.NotExistsGuildItem._val + GuildErr.NotExistsGuildItem._subVal};
    }
    if(pkgRow.guildlevel_limit > guildLevel){
        return {ret: GuildErr.NotEnoughLevel._val + GuildErr.NotEnoughLevel._subVal};
    }

    var consumeRet = consume.consumeWithArray(player, pkgRow.consume);
    var dropRet = drop.dropWithTableRow(player, pkgRow, {}, num);
    if (!player.GuildPkg.hasItem(id))
        player.GuildPkg.createItem(id)
    player.GuildPkg[id] = player.GuildPkg[id] || 0;
    player.GuildPkg[id] += num;

    return {
        ret: 0,
        consume: consumeRet ? consumeRet.consume : undefined,
        drop: dropRet || {}
    }
}

module.exports = new GuildClient();