var util = require('util');
var GuildErr = require('app/modules/guild/GuildErr');
var tableReader = require('app/util/tableReader');

var BoxChestReward;
var CopyReward;
var GuildDamageReward;
var ChapterReward;
var SacrificeLvReward;
var SacrificeTypeReward;

module.exports = function(entity) {
    return new GuildTreasure(entity);
};

function GuildTreasure(entity) {
    this.entity = entity;
    this.init();
}

GuildTreasure.prototype.create = function(entity) {
    this.entity = entity;
    this.init();
};

GuildTreasure.prototype.init = function() {
    if (!BoxChestReward) {
        tableReader.load();
        BoxChestReward = tableReader.getTable('Guild_chest_reward');
        ChapterReward = tableReader.getTable('Guild_chapter_reward');
        SacrificeLvReward = tableReader.getTable('league_workship_score');
        SacrificeTypeReward = tableReader.getTable('league_workship');
        CopyReward = tableReader.getTable('GuildCopy');
        GuildDamageReward = tableReader.getTable('Guild_damage_reward');
        if (!BoxChestReward) {
            setTimeout(this.init, 5000);
        }
    }
};

/*
 * 领取公会参拜类型奖励
 *
 * @param type 1 初级参拜, 2 中级参拜, 3 高级参拜
 */
GuildTreasure.prototype.getSacrificeByType = function(type) {
    var drop = SacrificeTypeReward.rowByUnique('id', type).drop;
    var reward = [];

    for (var i = 0; i < drop.length; i++) {
        var item = drop[i];
        reward.push({
            type: item.type,
            arg: item.arg,
            arg2: item.arg2
        });
    }

    return reward;
};

/*
 * 领取公会参拜等级奖励
 */
GuildTreasure.prototype.getSacrificeByLv = function(lv, pid, callback) {
    var config = SacrificeLvReward.rowByUnique('id', lv);

    if (!config) {
        console.error('参拜奖励未找到 lv', lv, 'config', config);
        return callback(GuildErr.SacrificeRewardNotFound.getErrorCode());
    }

    // 检查公会参拜进度
    if (this.entity.info.sacrificeProgress < config.cost_arg) {
        console.error('公会参拜进度不足');
        return callback(GuildErr.SacrificeProgressLack.getErrorCode());
    }

    // 检查该会员是否领过
    var member = this.entity.members[pid];

    // 检查会员是否存在
    if (!member) {
        console.error('会员不存在');
        return callback(GuildErr.MemberNotExist.getErrorCode());
    }

    if (!member.sacrificeReward) {
        this.entity.members[pid].sacrificeReward = [];
    }

    if (contain(member.sacrificeReward, lv)) {
        console.error('参拜奖励已领取', member.sacrificeReward);
        return callback(GuildErr.RewardHaveReceived.getErrorCode());
    }

    member.sacrificeReward.push(lv);

    // 奖励拼装
    var drop = config.drop;
    var reward = [];

    for (var i = 0; i < drop.length; i++) {
        var item = drop[i];
        reward.push({
            type: item.type,
            arg: item.arg,
            arg2: item.arg2
        });
    }

    return callback(null, reward);
};

/*
 * 领取公会副本战斗奖励
 *
 * @param chapter   第几章
 * @param hurt      对Boss造成的伤害
 * @param callback  回调 cb(err, donate)  donate 为获取到的公会贡献值 0~n
 */
GuildTreasure.prototype.getCopyFightById = function(chapter, hurt) {
    initDamageReward(GuildDamageReward);
    return getDamageReward(chapter, hurt);
};

/*
 * 领取公会副本关卡Boss击杀奖励
 */
GuildTreasure.prototype.getCopyKillById = function(id) {
    var copy = CopyReward.rowById(id);

    if (!copy) {
        throw GuildErr.CopyNotFound.getErrorCode();
    }
    var drop = copy.killer_drop;
    var reward = [];

    for (var i = 0; i < drop.length; i++) {
        var item = drop[i];
        reward.push({
            type: item.type,
            probe: item.probe,
            // times: item.times, // todo check
            arg: item.arg,
            arg2: item.arg2
        });
    }

    return reward;
};

/*
 * 领取公会副本章节奖励
 */
GuildTreasure.prototype.getCopyPassById = function(stage, pid, callback) {
    var config = ChapterReward.rowByUnique('id', stage);

    if (!config) {
        console.error('副本通关奖励未找到 stage', stage, 'config', config);
        return callback(GuildErr.ChapterRewardNotFound.getErrorCode());
    }

    // 检查公会副本进度
    if (stage < this.entity.info.chapterProgressId) {
        console.error('公会副本进度不足');
        return callback(GuildErr.ChapterProgressLack.getErrorCode());
    }

    // 检查该会员是否领过
    var member = this.entity.members[pid];

    // 检查会员是否存在
    if (!member) {
        console.error('会员不存在');
        return callback(GuildErr.MemberNotExist.getErrorCode());
    }

    if (!member.copyReward) {
        this.entity.members[pid].copyReward = [];
    }

    console.log('member.copyReward', member.copyReward);

    if (contain(member.copyReward, stage)) {
        console.error('副本奖励已领取', member.copyReward);
        return callback(GuildErr.RewardHaveReceived.getErrorCode());
    }

    member.copyReward.push(stage);

    // 奖励拼装
    var drop = config.drop;
    var reward = [];

    for (var i = 0; i < drop.length; i++) {
        var item = drop[i];
        reward.push({
            type: item.type,
            arg: item.arg,
            arg2: item.arg2
        });
    }

    return callback(null, reward);
};

/*
 * 领取Boss宝藏
 */
GuildTreasure.prototype.getBoxByIdIndex = function(id, index, pid, name, callback) {
    var copy = this.getBoxById(id);

    if (!copy) {
        return callback(GuildErr.CopyNotFound.getErrorCode());
    }

    if (!copy[index].recv) {
        var member = this.entity.members[pid];

        if (!member) {
            console.error('会员不存在');
            return callback(GuildErr.MemberNotExist.getErrorCode());
        }

        if (!member.boxReward) {
            this.entity.members[pid].boxReward = [];
        }

        if (contain(member.boxReward, id)) {
            console.error('副本奖励已领取', member.boxReward);
            return callback(GuildErr.RewardHaveReceived.getErrorCode());
        }

        member.boxReward.push(id);

        copy[index].recv = true;
        copy[index].name = name;

        return callback(null, entityJson2Arr(copy[index].reward));
    }

    return callback(GuildErr.BoxHaveReceived.getErrorCode());
};

/*
 * 获取Boss宝藏列表
 */
GuildTreasure.prototype.getBoxListById = function(copy_id, callback) {
    var box = this.getBoxById(copy_id);

    if (!box) {
        return callback(GuildErr.CopyNotFound.getErrorCode());
    }

    return callback(null, getFlagArr(box));
};

/*
 * 获取宝藏列表
 */
GuildTreasure.prototype.getBoxById = function(id) {
    var info = getCSById(id);

    if (!info) {
        return null;
    }

    if (!this.entity.treasure.hasItem(id)) {
        var list = randBoxDrops(info.chapter, info.section);
        this.entity.treasure.createItem(id);
        clone2entity(this.entity.treasure[id], list);
        this.entity.treasure[id].length = list.length;
    }

    var copy = this.entity.treasure[id];
    return copy;
};

var clone2entity = function(copy, src) {
    for (var id in src) {
        copy.createItem(id);

        if (typeof src[id] == 'object') {
            var box = copy[id];
            var arr = src[id].reward;
            box.recv = false;
            box.name = 'one';
            box.index = src[id].index;
            box.length = src[id].reward.length;
            box.reward = {};

            for (var j = 0; j < arr.length; j++) {
                if (!box.reward.hasItem(j)) {
                    box.reward.createItem(j);
                }
                box.reward[j].type = arr[j].type;
                box.reward[j].arg = arr[j].arg.toString();
                box.reward[j].arg2 = arr[j].arg2.toString();
            }
        }
    }
};

var getFlagArr = function(data) {
    var list = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i]._data.r) {
            list.push({
                name: data[i]._data.n,
                index: data[i]._data.i,
                reward: json2arr(data[i]._data.w),
            });
        } else {
            list.push(data[i]._data.r);
        }
    }
    return list;
};

var json2arr = function(json) {
    var list = [];
    for (var i = 0; !!json[i]; i++) {
        list.push(json[i]);
    }
    return list;
};

var getCSById = function(id) {
    var copy = CopyReward.rowById(id);
    if (!copy) {
        return null;
    }
    return {
        chapter: copy.chapterId,
        section: copy.copyId,
    };
};

/* 
 * 随机宝箱内容
 */
var randBoxDrops = function(chapter, section) {
    var drop_list = BoxChestReward.rowByUniqueKey(chapter, section).drop;
    var result = [];
    var rands = [];

    for (var i = drop_list.length - 1; i >= 0; i--) {
        var drop = drop_list[i];
        if (!drop.arg || !drop.arg2) {
            throw new Error('静态表配置错误[' + drop.arg + '][' + drop.arg2 + ']');
        }
        rands.push(
            range(
                tableReader.tableRowById(drop.arg, drop.arg2).drop,
                drop.times
            )
        );
    }

    do {
        var index = random(rands.length - 1);
        var r = rands[index].shift();
        if (r) {
            // { probe: 10000, times: [ 10 ], type: 'money', arg: 2001, arg2: '' }
            result.push({
                reward: r,
                index: index
            });
        }
    } while (!empty(rands));

    return result;
};

var empty = function(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].length)
            return false;
    }
    return true;
};

var range = function(value, max) {
    var list = [];
    for (var i = 0; i < max; i++) {
        list.push(value);
    }
    return list;
};

var random = function(max) {
    return Math.floor(Math.random() * (max + 1));
};

var contain = function(arr, val) {
    for (var i = arr.length - 1; i >= 0; i--) {
        if (arr[i] == val) {
            return true;
        }
    }
    return false;
};

var entityJson2Arr = function(data) {
    var arr = [];
    for (var i = 0; !!data[i]; i++) {
        arr.push({
            type: data[i].type,
            arg: data[i].arg,
            arg2: data[i].arg2,
        });
    }
    return arr;
};

// todo 临时解决，待重写
var map = {};
var damageRewardFlag = true;

var initDamageReward = function(table) {
    if (damageRewardFlag) {
        if (!table)
            return;

        table.forEach(function(_, row) {
            if (!map[row.chapter])
                map[row.chapter] = [];
            map[row.chapter].push(row);
        });

        for (var key in map) {
            map[key].sort(function(a, b) {
                if (a.damage > b.damage)
                    return 1;
                return 0;
            });
        }
        damageRewardFlag = false;
    }
};

var getDamageReward = function(chapter, hurt) {
    var list = map[chapter];
    var index = -1;

    if (!list)
        throw GuildErr.ConfigNotExist.getErrorCode();

    for (var i = 0; i < list.length; i++)
        if (hurt >= list[i].damage)
            index = i;

    if (index == -1)
        return 0;
    return list[index].donate_reward;
};