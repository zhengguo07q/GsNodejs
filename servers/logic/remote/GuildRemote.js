// ***************************************************************
//  Copyright(c) Cmge
//  FileName    : GuildRemote.js
//  Creator     : zg 
//  Date        : 2015-6-26
//  Comment : 
// ***************************************************************

var GuildMgr = require('app/modules/guild/GuildMgr');
var GuildErr = require('app/modules/guild/GuildErr');
var GuildClient = require('app/modules/guild/GuildClient');
var playerStorage = require('app/dao/playerStorage');
var ObjectUtility = require('app/util/ObjectUtility');

var Handler = function(app) 
{
    this.app = app;
};


Handler.prototype.leaveGuildInfo = function (pid, guildName, reasonType, cb)
{
    playerStorage().load(pid, function (err, player) 
    {
        if (err ||!player)
            return ;
        GuildClient.removeGuildInfo(player,  guildName, reasonType);
        playerStorage().update(player, function (err) {});
    });
    cb();
};


Handler.prototype.isExistsGuild = function (pid, cb)
{
    playerStorage().load(pid, function (err, player) 
    {
        if (player)
        {
            cb(GuildClient.isExistsGuild(player));
            return;
        }
        else
        {
            cb(true);
        }
        
    });
};


Handler.prototype.addGuildInfo = function(applyId, guildId, guildName, type, cb)
{
    playerStorage().load(applyId, function (err, player) 
    {
        if (player)
        {
            if(type == true)
            {
                GuildClient.addGuildInfo(player, guildId, guildName);
            }
            else
            {
                GuildClient.removeApply(player, guildId);
            }
            playerStorage().update(player, function (err) {});
        }
    }); 
    cb && cb();
};


module.exports = function (app) 
{
    return new Handler(app);
};