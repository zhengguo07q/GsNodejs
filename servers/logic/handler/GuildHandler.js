// ***************************************************************
//  Copyright(c) Cmge
//  FileName    : GuildHandler.js
//  Creator     : zg 
//  Date        : 2015-6-18
//  Comment : 
// ***************************************************************

var ErrCode = require('app/modules/error_code');
var Check = require('app/util/check');
var RpcUtility = require('app/util/RpcUtility');
var ObjectUtility = require('app/util/ObjectUtility');
var playerStorage = require('app/dao/playerStorage');

var GuildMgr = require('app/modules/guild/GuildMgr');
var GuildData = require('app/modules/guild/GuildData');
var GuildErr = require('app/modules/guild/GuildErr');
var GuildClient = require('app/modules/guild/GuildClient');
var Consume = require('app/modules/consume');
var drop = require('app/modules/drop');
var Check = require('app/util/check');
var Types = require('app/modules/types');
var async = require('async');
var mail = require('app/modules/mail');
var time = require('app/util/time');
var error_code = require('app/modules/error_code');

function Handler(app) {
    this.app = app;
};


Handler.prototype.createGuildInfo = function (msg, session, next) {
    var guildName = msg.guildName;
    var icon = msg.icon;
    var cost = msg.cost;

    var player = session.player;
    if(GuildClient.isExistsGuild(player))
    {
        throw GuildErr.AlreadyJoinGuild;
    }
    GuildData.checkCreateLevelLimit(player.Info.level);
    GuildClient.checkGuildCoolDown(player);
    GuildData.checkName(guildName);

    var settingEntry = tableReader.tableRowByUnique('GuildSetting', 'id', 'league_creat_cost');
    var consumeArr = 
        [{
            consume_type: settingEntry.args1,
            consume_arg: parseInt(settingEntry.args2),
            consume_arg2: 0,
        }];
    var conRet = Consume.checkResource(player,consumeArr);
    if (conRet.ret !== 0) 
    {
        return next(null, conRet);
    }

    var fight = 0;
    if (session.player.Team["0"] != undefined) {
        fight = session.player.Team["0"].power;
    }
    

    this.app && this.app.rpc.global.GuildRemote.createGuildInfo('', guildName, player.playerId, player.Info.nickname, icon,  player.Info.level, fight, player.Info.head, function () {
        var rpcResult = RpcUtility.result(arguments);
        try
        {
            if (rpcResult.ret === GuildErr.Sucess.getErrorCode()) {
                GuildClient.addGuildInfo(player, rpcResult.guildId, rpcResult.info.guildName);
                var consumeRet = Consume.consumeWithArray(player, consumeArr, null, 1);
                if (consumeRet.ret) 
                {
                    throw consumeRet;
                }
            }
        }
        catch(e)
        {
            next(null, e);
            return;
        }
        next(null, rpcResult);
    });
};


Handler.prototype.dissolutionGuildInfo = function (msg, session, next) {
    var isCancel = msg.isCancel;
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.dissolutionGuildInfo('', session.player.playerId, session.player.Info.guildId, isCancel, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.getGuildBaseInfo = function (msg, session, next) {
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.getGuildDetailInfo('', session.player.Info.guildId, session.player.playerId , function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.getGuildList = function (msg, session, next) {
    var page = msg.page;  
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.getGuildList('', page, function () {
        var rpcResult = RpcUtility.result(arguments);
        GuildClient.injectApplyList(session.player, rpcResult.list);
        next(null, rpcResult);
    });
};


Handler.prototype.getGuildMemberList = function (msg, session, next) {
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.getGuildMemberList('', session.player.Info.guildId, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.getGuildMessageList = function (msg, session, next) {
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.getGuildMessageList('', session.player.Info.guildId, function () {
        next(null, RpcUtility.result(arguments));
    });
};

 
Handler.prototype.setApplyCondition = function (msg, session, next) {
    var isCondition = msg.isCondition;
    var level = msg.level;

    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.setApplyCondition('',  session.player.playerId, session.player.Info.guildId,  isCondition, level, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.applyJoin = function (msg, session, next) {
    var gid = msg.guildId;

    GuildClient.checkGuildCoolDown(session.player);
    GuildData.checkLevelLimit(session.player.Info.level);

    var fight = 0;
    if (session.player.Team["0"] != undefined) {
        fight = session.player.Team["0"].power;
    }

    this.app && this.app.rpc.global.GuildRemote.applyJoin('', gid, session.player.playerId, session.player.Info.nickname, session.player.Info.level, fight, session.player.Info.head, function () {
        var rpcResult = RpcUtility.result(arguments);

        if (rpcResult.ret === GuildErr.Sucess.getErrorCode()) {

            if(rpcResult.type == 1)
            {
                GuildClient.addApply(session.player, gid);
            }            
            else if(rpcResult.type == 2)
            {
                GuildClient.addGuildInfo(session.player, gid, rpcResult.guildName);
            }
        }
        else if (rpcResult.ret === GuildErr.AlreadyApplyMember.getErrorCode()) {
            GuildClient.addApply(session.player, gid);
        }
        next(null, rpcResult);
    });
};


Handler.prototype.cancelApplyJoin = function (msg, session, next) {
    var gid = msg.guildId;

    var fight = 0;
    if (session.player.Team["0"] != undefined) {
        fight = session.player.Team["0"].power;
    }

    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.cancelApplyJoin('', gid, session.player.playerId, function () {
        var rpcResult = RpcUtility.result(arguments);

        if (rpcResult.ret === GuildErr.Sucess.getErrorCode()) {
            GuildClient.removeApply(session.player, gid);
        }
        next(null, rpcResult);
    });
};


Handler.prototype.getGuildApplyList = function (msg, session, next) {
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.getGuildApplyList('', session.player.Info.guildId, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.agreeJoin = function (msg, session, next) {
    var isOk = msg.isOk;
    var applyId = msg.applyId;

    GuildData.checkLevelLimit(session.player.Info.level);
    var self = this;
    this.app && this.app.rpc.global.GuildRemote.agreeJoin('', session.player.playerId, session.player.Info.guildId, isOk, applyId, function () {
        var rpcResult = RpcUtility.result(arguments);

        if (rpcResult.ret === GuildErr.Sucess.getErrorCode()) 
        {
            self.app && self.app.rpc.logic.guildRemote.addGuildInfo(applyId, applyId, session.player.Info.guildId, session.player.Info.guildName, rpcResult.type, function () {});
        }

        next(null, rpcResult);
    });
};


Handler.prototype.kickMember = function (msg, session, next) {
    var playerId = msg.playerId;

    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.kickMember('', session.player.Info.guildId, session.player.playerId, playerId, function () {
        var rpcResult = RpcUtility.result(arguments);
        next(null, rpcResult);
    });
};


Handler.prototype.fireJob = function (msg, session, next) {
    var memberId = msg.playerId;
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.fireJob('', session.player.Info.guildId, session.player.playerId, memberId, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.appointJob = function (msg, session, next) {
    var memberId = msg.playerId;
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.appointJob('', session.player.Info.guildId, session.player.playerId, memberId, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.appointMasterJob = function (msg, session, next) {
    var memberId = msg.playerId;
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.appointMasterJob('', session.player.Info.guildId, session.player.playerId, memberId, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.impeach = function (msg, session, next) {
    GuildData.checkLevelLimit(session.player.Info.level);

    var settingEntry = tableReader.tableRowByUnique('GuildSetting', 'id', 'league_replace_cost');
    var consumeArr = 
        [{
            consume_type: settingEntry.args1,
            consume_arg: parseInt(settingEntry.args2),
            consume_arg2: 0,
        }];
    var conRet = Consume.checkResource(session.player,consumeArr);
    if (conRet.ret !== 0) 
    {
        return next(null, conRet);
    }

    this.app && this.app.rpc.global.GuildRemote.impeach('', session.player.Info.guildId, session.player.playerId, function () {
        var rpcResult = RpcUtility.result(arguments);
        try
        {
            if (rpcResult.ret === GuildErr.Sucess.getErrorCode()) {
                var consumeRet = Consume.consumeWithArray(player, consumeArr, null, 1);
                if (consumeRet.ret) 
                {
                    throw consumeRet;
                }
            }
        }
        catch(e)
        {
            next(null, e);
            return;
        }
        next(null, rpcResult);
    });
};


Handler.prototype.changeGuildInfo = function (msg, session, next)
{
    var type = msg.type;
    var val = msg.val;
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.changeGuildInfo('', session.player.Info.guildId, session.player.playerId, type, val, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.searchGuildByNameOrId = function (msg, session, next) {
    var nameOrId = msg.nameOrId;
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.searchGuildByNameOrId('', nameOrId, function () {
        var rpcResult = RpcUtility.result(arguments);
        if (rpcResult.ret === GuildErr.Sucess.getErrorCode()) 
        {
            GuildClient.injectApplyList(session.player, rpcResult.list);
        }
        next(null, rpcResult);
    });
};


Handler.prototype.exit = function (msg, session, next) {
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.exit('', session.player.Info.guildId, session.player.playerId, function () {
        var rpcResult = RpcUtility.result(arguments);

        if (rpcResult.ret === GuildErr.Sucess.getErrorCode()) 
        {
            GuildClient.removeGuildInfo(session.player,  null, 3);
            session.player.Info.guildId = '';
        }

        next(null, rpcResult);
    });
};


Handler.prototype.getGuildRankList = function (msg, session, next) {
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.getGuildRankList('', session.player.Info.guildId, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.getGuildHurtRankList = function (msg, session, next) {
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.getGuildHurtRankList('', session.player.Info.guildId, session.player.playerId, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.getCopyList = function (msg, session, next)
{
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.getCopyList('', session.player.Info.guildId, function () {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.defiance = function (msg, session, next) 
{
    var chapterId = msg.chapterId;
    var copyId = msg.copyId;
    var team = msg.team;
    var self = this;
    GuildData.checkLevelLimit(session.player.Info.level);

    var guildCopyEntry = tableReader.tableRowByUniqueKey('GuildCopy', chapterId, copyId);
    if(guildCopyEntry == null)
    {
        throw error_code.TABLE_ERROR;
    }

    var conRet = Consume.checkResource(session.player, guildCopyEntry.consume);
    this.app && this.app.rpc.global.GuildRemote.getCopyMonsters('', session.player.Info.guildId, session.player.playerId, copyId, function () 
    {
        var rpcResult = RpcUtility.result(arguments);
        try{
            if (rpcResult.ret === GuildErr.Sucess.getErrorCode()) 
            {
                var consumeRet = Consume.consumeWithArray(session.player, guildCopyEntry.consume, null, 1);
                if (consumeRet.ret)
                {
                    throw consumeRet;
                }
                function fightComplete(fightResult, monsterInfo)
                {
                    self.app && self.app.rpc.global.GuildRemote.setCopyMonsters('', session.player.Info.guildId, session.player.playerId, copyId, monsterInfo, function () 
                    {
                        var rpcResult = RpcUtility.result(arguments);
                        fightResult.drop = rpcResult;
                        session.player.Resource.donate += rpcResult.contribution;
                        next(null, fightResult);
                    });
                };
                GuildClient.fightBoss(session.player, rpcResult.chapterId, copyId, rpcResult.info, fightComplete);
                return;
            }
        }
        catch(e)
        {
            next(null, e);
            return;
        }
        next(null, rpcResult);
    });
};


Handler.prototype.memberStatus = function (msg, session, next) 
{
    var player = session.player;
    var pid = player.playerId;
    var gid = player.Info.guildId;

    this.app && this.app.rpc.global.GuildRemote.memberStatus('', gid, pid, function () 
    {
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.sacrifice = function (msg, session, next) 
{    
    var typeId = msg.typeId;

    GuildData.checkLevelLimit(session.player.Info.level);

    var guildSacrificeEntry = tableReader.tableRowById('GuildSacrifice', typeId);
    if(guildSacrificeEntry == null)
    {
        throw error_code.TABLE_ERROR;
    }

    var conRet = Consume.checkResource(session.player, guildSacrificeEntry.consume);
    if (conRet.ret !== 0) 
    {
        return next(null, conRet);
    }
    
    this.app && this.app.rpc.global.GuildRemote.sacrifice('', session.player.Info.guildId, session.player.playerId, typeId, session.player.Info.vip, function () 
    {
        var rpcResult = RpcUtility.result(arguments);
        try
        {
            if (rpcResult.ret === GuildErr.Sucess.getErrorCode())
            {
                var consumeRet = Consume.consumeWithArray(session.player, guildSacrificeEntry.consume, null, 1);
                if (consumeRet.ret)
                {
                    throw consumeRet;
                }
                session.player.Resource.donate += rpcResult.info.contribution;
            }
        }
        catch(e)
        {
            next(null, e);
            return;
        }
        next(null, RpcUtility.result(arguments));
    });
};


Handler.prototype.sacrificeReward = function (msg, session, next) {
    var lv = msg.lv || 0;
    var player = session.player;
    var pid = player.playerId;
    var gid = player.Info.guildId;

    this.app.rpc.global.GuildRemote.sacrificeReward(null, gid, pid, lv, function (err, reward) {
        if (err) {
            return next(null, { ret: err });
        }
        var dropRet = {};
        try {
            drop.dropWithArray(player, reward || [], dropRet);
        } catch(e) {
            return next(null, e);
        }
        next(null, { ret: 0, drop: dropRet });
    });
};


Handler.prototype.copyPassReward = function (msg, session, next) {
    var chapter = msg.chapter || 0;
    var player = session.player;
    var pid = player.playerId;
    var gid = player.Info.guildId;

    this.app.rpc.global.GuildRemote.copyPassReward(null, gid, pid, chapter, function (err, reward) {
        if (err) {
            return next(null, { ret: err });
        }
        var dropRet = {};
        try {
            drop.dropWithArray(player, reward || [], dropRet);
        } catch(e) {
            return next(null, e);
        }
        next(null, { ret: 0, drop: dropRet });
    });
};


Handler.prototype.getBoxListById = function (msg, session, next) {
    var copyId = msg.copyId || 0;
    var player = session.player;
    var pid = player.playerId;
    var gid = player.Info.guildId;

    this.app.rpc.global.GuildRemote.getBoxListById(null, gid, copyId, function (err, list) {
        if (err) {
            return next(null, { ret: err });
        }
        next(null, { ret: 0, list: list });
    });
};


Handler.prototype.getBoxRewardById = function (msg, session, next) {
    var copyId = msg.copyId || 0;
    var index = msg.index || 0;
    var player = session.player;
    var gid = player.Info.guildId;
    var pid = player.playerId;
    var name = player._data.o.n;

    this.app.rpc.global.GuildRemote.getBoxRewardById(null, gid, copyId, index, pid, name, function (err, reward) {
        if (err) {
            return next(null, { ret: err });
        }
        var dropRet = {};
        try {
            drop.dropWithArray(player, reward || [], dropRet);
        } catch(e) {
            return next(null, e);
        }
        next(null, { ret: 0, drop: dropRet });
    });
};


Handler.prototype.useGuildFightItem = function (msg, session, next) 
{
    GuildClient.useGuildFightItem(session.player);
    next(null, {ret : 0});
};


Handler.prototype.getShopList = function (msg, session, next) {
    //msg:{shopid}
    msg.gid = session.player.Info.guildId;
    msg.GuildPkg = session.player.GuildPkg;
    msg.pid = session.player.playerId;
    var shopid = Check.checkIsInt('shopid', "商店id", msg.shopid);
    this.app && this.app.rpc.global.GuildRemote.getShopList('', msg, function (err, result) {
        if (err)
            next(null, {
                ret: err._val + err._subVal
            });
        else
            next(null, result);
    });
};


Handler.prototype.buyGuildShop = function (msg, session, next) {
    var self = this;
    var consumeArr, theitem;
    if (!this.app) {
        console.log('app not found');
        return;
    }
    //msg: {shopid, type, id, num}
    var player = session.player;
    msg.pid = player.playerId;
    msg.gid = session.player.Info.guildId;
    if (!msg.gid)
        return next(null, GuildErr.NotExistsGuild);
    var num = Check.checkIsIntWithRange('num', "购买数量", msg.num, 0);
    async.waterfall([
        function (cb) {
            self.app.rpc.global.GuildRemote.getShopItem(null, msg, cb);
        },
        function (item, cb) {
            // console.log("buyGuildShop 1", item._data.t, item._data.c);
            theitem = item;
            consumeArr = [{
                consume_type: Types[item._data.t],
                consume_arg: item._data.n * (msg.num || 1),
                consume_arg2: 0
            }];
            console.log("buyGuildShop 1+", consumeArr, item._data.t, item._data.c);

            var consumeRet = GuildClient.checkBeforeBuy(player, consumeArr); //报错在内部throw
            // console.log('consumeRet', consumeRet);
            if (consumeRet.ret !== 0) {
                return next(null, consumeRet);
            }
            self.app.rpc.global.GuildRemote.buyGuildShop(null, msg, cb);
        },
        function (ret, cb) {
            console.log("buyGuildShop 2", ret);
            var dropArr = [{
                type: Types[theitem._data.y],
                arg: theitem._data.i,
                arg2: theitem._data.c * msg.num
            }]
            var consumeRet = GuildClient.tryBuyGuildShop(player, consumeArr, dropArr, msg);
            cb(null, consumeRet);
        }
    ], function (err, consumeRet) {
        if (err) {
            console.log('waterfall err', err);
            return next(null, {
                ret: err._val + err._subVal
            });
        }

        next(null, consumeRet);
    });

};

Handler.prototype.buyPkgShop = function (msg, session, next) {
    //msg:{id, num}
    var num = Check.checkIsIntWithRange('num', "购买数量", msg.num, 0);
    var player = session.player;
    msg.pid = player.playerId;
    msg.gid = session.player.Info.guildId;
    var self = this;
    var pkgRow = tableReader.tableRowById('guildPackage', msg.id);
    if (!pkgRow){
        return next(null, GuildErr.ErrorId);
    }
    var consumeRet = GuildClient.checkBeforeBuy(player, pkgRow.consume); //报错在内部throw
    // console.log('consumeRet', consumeRet);
    if (consumeRet.ret !== 0) {
        return next(null, consumeRet);
    }

    self.app.rpc.global.GuildRemote.getGuildLevel(null, msg, function (err, guildLevel) {
        var buyPkgShopRet = GuildClient.TryBuyPkg(player, msg.id, msg.num, guildLevel); //报错在内部throw
        next(null, buyPkgShopRet);
        
    });
};

Handler.prototype.guildLvUpdate = function (msg, session, next) {
    msg.gid = session.player.Info.guildId;
    var self = this;
    self.app.rpc.global.GuildRemote.guildLvUpdate(null, msg, function (err, ret) {
        if (err)
            next(null, err);
        else
            next(null, ret);
    });

};


module.exports = function (app) {
    return new Handler(app);
};