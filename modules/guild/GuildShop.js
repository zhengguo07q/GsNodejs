// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildShop.js
//  Creator 	:  
//  Date		: 2015-6-27
//  Comment	: 
// ***************************************************************

var GuildInfo = require('./GuildInfo');
var drop = require('app/modules/drop');
var time = require('app/util/time');
var Timer = require('app/core/Timer');
var GuildErr = require('app/modules/guild/GuildErr');
var tableReader = require('app/util/tableReader');

var GuildShop = function (data) {
    this.data = data;
//    console.log('this.data', this.data);
};


GuildShop.prototype.create = function (data) {
    this.data = data;
    // console.log('initGuildShop--------', this.data);
    checkStatus(this);
};

GuildShop.prototype.resetShop = function () {
    checkStatus.bind(null, this)();

};


function checkStatus(self) {
    //检查状态
    console.log(self, 'fffffff');
    var nt = tableReader.tableValueById('systemConfig', 'value', 'default');
    tableReader.forEachTable('shop_reset_config', function (nRow, oRow) {
        // console.log('thisss..nRow, oRow', nRow, oRow, self.data);
        if (!oRow.id || (oRow.shop_type !== 2 && oRow.shop_type !== 3)) {
            return;
        }
        var shopid = oRow.id;
        if (!self.data.guildShop.hasItem(shopid)) {
            self.data.guildShop.createItem(shopid);
        }
        self.data.guildShop[shopid].id = 1;
        checkOpen(self, shopid, checkUnlock(self, shopid)); //判断解锁。未解锁不初始化其他信息。
    });
    // console.log('end checkStatus GuildShop-----selfdata---', self.data);
}

function checkOpen(self, shopid, unlock) {
    if (self.data.guildShop[shopid].open) {
        if (time.checkCountDown(self.data.guildShop[shopid].countdown)) {
            self.data.guildShop[shopid].open = false;
            self.data.guildShop[shopid].countdown = 0;
            // self.data.guildShop[shopid].reset_arg = 0; //清除一些信息
        }
    }

    if (!self.data.guildShop[shopid].open && unlock) {
        tryAutoReset(self, shopid);
    }
}

function checkUnlock(self, shopid) {
    var unlock = false;
    tableReader.forEachTable('guildshop_refresh', function (nRow, oRow) {
        if (oRow.id && oRow.shop == shopid) {
            console.log('checkUnlock', shopid);
            //检查解锁条件。
            var unlock_condition = oRow.limitArg;
            if (self.data.info.guildLevel < unlock_condition) {
                return;
            }
            unlock = true;
            //所有条件都满足了。
            self.data.guildShop[shopid].id = oRow.id; //如果有多行满足条件的。取最后一行。以后也要求是有顺序的。或加入优先级列。
            // console.log('checkUnlock shop.id', shop.id, oRow);
        }
    });
    return unlock;
}

function tryAutoReset(self, shopid) { //shopid是数据结构的单个key， shop是数据结构的对应的单个value
    var shop_config = tableReader.tableRowById('shop_reset_config', shopid);
    // console.log('shop_con', shop_config, shopid);
    var countdown = time.getCountDownWithTimes(shop_config.open_times);

    if (countdown) {
        self.data.guildShop[shopid].open = true;
        self.data.guildShop[shopid].countdown = countdown;
        var shop_rid = self.data.guildShop[shopid].id;
        buildReset(self, shopid, shop_rid);
        return;
    }
}

//刷新公会商店
function buildReset(self, shopid, shop_rid) { //shopid是数据结构的单个key， shop是数据结构的对应的单个value, 
    var shop_refresh = tableReader.tableRowById('guildshop_refresh', shop_rid); //shop.id是guildshop_refresh里面的id
    if (!shop_refresh)
        return;
    var Drops = shop_refresh.drop;
    var dropArr = [];
    for (var i = 0; i < Drops.length; i++) {
        var dropItem = Drops[i];
        var dropType = dropItem.type;
        var dropArg = dropItem.arg;
        var dropArg2 = dropItem.arg2;
        if (dropItem.type == 'drop') {
            var ADrop = drop.getDropItemFormDropTable(dropArg, dropArg2);
            dropArr.push(ADrop);
        } else {
            var temp = parseInt(dropArg, 10);

            if (isNaN(temp) || temp.toString().length != dropArg.toString().length) {
                dropArg = tableReader.tableValueByUnique(dropType, 'id', 'name', dropArg);
                if (!dropArg) {
                    console.log('dropArg is null.....', dropItem);
                }
            }
            //else

            dropArr.push({
                type: dropType,
                arg: dropArg,
                arg2: dropArg2,
                per_limit_num: dropItem.per_limit_num || -1,
                total_limit_num: dropItem.total_limit_num || -1
            });
        }
        // console.log('dropItem:', dropItem);
    }
    // console.log('dropArr: ', dropArr);
    putItemIntoshop(self, shopid, dropArr);
}

function putItemIntoshop(self, shopid, dropArr) {
    var arrLen = dropArr.length;
    var shop = self.data.guildShop[shopid];
    var sc = shop.count;
    for (var i = arrLen; i < sc; i++) {
        shop.deleteItem(i);
    }
    shop.count = arrLen;
    var pricemark;
    for (var i = arrLen - 1; i >= 0; i--) {
        var item;
        if (!shop.hasItem(i)) {
            item = shop.createItem(i);
        }
        item = shop[i];
        var dropItem = dropArr[i];
        if (dropItem.type.indexOf('_rdm') >= 0) {
            drop.dealRdmType(dropItem, item);
        } else {
            item.type = dropItem.type;
            item.id = dropItem.arg;
            item.count = dropItem.arg2;
        }
        item.sell = false;
        var row = tableReader.tableRowByUniqueKey('shop_price', item.type, item.id);
        var allconsume = row.consume;
        var theconsume; //取对应商店的该物品出售价格信息
        if (pricemark) {
            theconsume = allconsume[pricemark];
        } else {
            for (var k = allconsume.length - 1; k >= 0; k--) {
                if (allconsume[k].shop == parseInt(shopid, 10)) {
                    theconsume = allconsume[k];
                    pricemark = k;
                    break;
                }
            }
        }

        item.sell_type = theconsume.type;
        var discount = item.sell_discount = theconsume.discount || 100;
        var price = item.sell_price = theconsume.arg * item.count;
        item.per_limit_num = dropItem.per_limit_num;
        item.guild_limit_num = dropItem.total_limit_num;
        item.sell_num = Math.floor(price * discount / 100);
        item.guild_buy_num = 0;
        item.step = parseInt(theconsume.step) || 1;
        item.inc = parseInt(theconsume.inc) || 0;
        // console.log(item.buy_record, 'item.buy_record----------');
        item.buy_record.forEachItem(function (key, value) {
            item.buy_record.deleteItem(key);
        });

        var checktag = checkRightItem(item, shopid, pricemark);
        if (!checktag) {
            console.error('get a wrong item....now change it.');
            console.log('>>>item:', item, '>>>shopid:', shopid);
        }
        // console.log(item, self.data.guildShop[shopid][i], 'item >>>>>>>>>>>');
    }
}

//检查该物品的定价
function checkRightItem(item, shopid, keyForMe) {
    // console.log(item, shopid, 'item && shopid');
    var itemrow = tableReader.tableRowByUniqueKey('shop_price', item.type, item.id);
    // console.log(itemrow.$item_id.name);
    var check = 1;
    if (itemrow) {
        var allcon = itemrow.consume;
        // console.log(allcon);
        for (var i = 0; i < allcon.length; i++) {
            if (allcon[i].shop == shopid) {
                check = 2;
                // console.log(item.sell_type, item.sell_price, allcon[i].type, allcon[i].arg);
                if (allcon[i].type !== item.sell_type || parseInt(allcon[i].arg * item.count) !== parseInt(item.sell_price))
                    return false;
            }
        }
        if (check == 1)
            return false;
        return true; //it is a right item.
    } else { //correct the item, set default item   一个灵子糖果（500）
        item.sell_num = 6000;
        item.sell_price = 6000;
        item.sell_type = 'money';
        item.sell_discount = 100;
        item.type = 'item';
        item.id = 28;
        item.count = 1;
        return false;
    }
}

GuildShop.prototype.guildLvUpdate = function () {
    //公会升级时要更新商店，重新刷新商店
    // console.log('this.data.guildShop', this.data.guildShop);
    this.data.info.guildLevel = 2;
    checkStatus.bind(null, this)();
    // console.log('this.data.guildShop2', this.data.guildShop);
}

GuildShop.prototype.getShopList = function (pid, GuildPkg, guildinfo, shopid) {
    var result = {};
    result.items = result.items || [];
    // console.log('GuildPkg', GuildPkg);
    var shop_row = tableReader.tableRowById('shop_reset_config', shopid);
    var shop_type = shop_row.shop_type;
    if (shop_type == 4) {
        //shop_type是类似vip礼包类型的商店，此处方便客户端解析所以转成普通商店数据结构下发
        pkgToShop(GuildPkg, shopid, result.items);
        return {
            shop: result,
            ret: 0
        };
    }

    if (shopid == 20) {
        //超级特殊的商店：公会道具商店，既有杂货店类型的商品，又有vip礼包类型的商品。
        //因此将数据合成一种结构方便客户端解析。
        pkgToShop(GuildPkg, shopid, result.items);
    }
    var shop = guildinfo.guildData.guildShop[shopid];
    if (!shop)
        return {
            ret: 0
        };
    shopToLongkey(pid, shop, result.items);
    result.open = shop.open || false;
    result.countdown = shop.countdown || 0;
    result.count = shop.count || 6;

    return {
        shop: result,
        ret: 0
    };
}

function pkgToShop(GuildPkg, shopid, resultArr) {
    var result = {};
    tableReader.forEachTable('guildPackage', function (nRow, oRow) {
        if (oRow.which_shop == shopid) {
            var id = oRow.id;
            var consumeitem = oRow.consume[0];
            var dropitem = oRow.drop[0];
            result[id] = result[id] || {};
            // result[id].buy_record = shop[id].R || {};
            result[id].type = dropitem.type || 'item';
            result[id].id = dropitem.arg || 28;
            result[id].count = dropitem.arg2 || 1;
            result[id].per_limit_num = oRow.limit || 1;
            // result[id].guild_limit_num = shop[id].g || 1;
            // result[id].guild_buy_num = shop[id].gn || 0;
            result[id].sell = false;
            if (GuildPkg[id] && GuildPkg[id] >= oRow.limit)
                result[id].sell = true;
            result[id].sell_type = consumeitem.consume_type;
            result[id].sell_num = consumeitem.consume_arg;
            result[id].sell_discount = 100;
            result[id].sell_price = consumeitem.consume_arg;
            result[id].step = 1;
            result[id].inc = 0;
            result[id].pkgId = id;
            resultArr.push(result[id]);
        }
    });
}

function shopToLongkey(pid, shop, resultArr) {
    var result = {};
    resultArr = resultArr || [];
    for (var i = 0; i < shop.count; i++) {
        var item = shop[i];
        console.log('item', item);
        result[i] = result[i] || {};
        result[i].buy_record = item.buy_record[pid] || 0;
        result[i].type = item.type || 'item';
        result[i].id = item.id || 28;
        result[i].count = item.count || 1;
        result[i].per_limit_num = item.per_limit_num || 1;
        result[i].guild_limit_num = item.guild_limit_num || 1;
        result[i].guild_buy_num = item.guild_buy_num || 0;
        result[i].sell = item.sell || false;
        result[i].sell_type = item.sell_type || 'gold';
        result[i].sell_num = item.sell_num || 6000;
        result[i].sell_discount = item.sell_discount || 100;
        result[i].sell_price = item.sell_price || 6000;
        result[i].step = item.step || 1;
        result[i].inc = item.inc || 0;
        resultArr.push(result[i]);
    }
}

function checkItemEnough(shoptype, item, pid, num) {
    if (shoptype == 2) { //道具商店
        if (item.per_limit_num < num)
            return GuildErr.NotEnoughItem;
    }
    if (shoptype == 3) { //限时商店
        if (item.per_limit_num < num || item.guild_limit_num - item.guild_buy_num < num)
            return GuildErr.NotEnoughItem;
    }
    if (item.buy_record.hasItem(pid) && item.buy_record[pid] + num > item.per_limit_num)
        return GuildErr.NotEnoughItem;
    else
        return {
            ret: 0
        };
}

GuildShop.prototype.getShopItem = function (pid, num, type, id, shopid, guildinfo) {
    //msg.pid, msg.num, msg.type, msg.id, msg.shopid, guildinfo
    if (num < 0)
        return {
            err: GuildErr.NotExistsGuildItem
        };
    var num = parseInt(num);
    var shop = guildinfo.guildData.guildShop[shopid];
    var shop_type = tableReader.tableValueById('shop_reset_config', 'shop_type', shopid);
    if (shop) {
        var item;
        for (var i = 0; i < shop.count; i++) {
            if (shop[i].type == type && shop[i].id == id) {
                item = shop[i];
                break;
            }
        };
        if (item) {
            var checkRet = checkItemEnough(shop_type, item, pid, num);
            if (checkRet.ret !== 0)
                return {
                    err: checkRet
                };
            return {
                err: null,
                item: item
            };
        } else
            return {
                err: GuildErr.NotExistsGuildItem
            };
    } else
        return {
            err: GuildErr.NotExistsGuildShop
        };
}

GuildShop.prototype.buyShopItem = function (pid, num, type, id, shopid, guildinfo) {
    if (num < 0) {
        return {
            err: GuildErr.NotEnoughItem
        };
    }
    var shop_type = tableReader.tableValueById('shop_reset_config', 'shop_type', shopid);
    num = parseInt(num);
    var shop = guildinfo.guildData.guildShop[shopid];
    if (!shop)
        return {
            err: GuildErr.NotExistsGuildShop
        }
    var item;
    for (var i = 0; i < shop.count; i++) {
        if (shop[i].type == type && shop[i].id == id) {
            item = shop[i];
            break;
        }
    };
    if (!item)
        return {
            err: GuildErr.NotExistsGuildItem
        };

    var checkRet = checkItemEnough(shop_type, item, pid, num);
    if (checkRet.ret !== 0)
        return {
            err: checkRet
        };
    else {
        item.guild_buy_num = item.guild_buy_num || 0;
        item.guild_buy_num += num;
        if (shop_type == 3 && item.guild_buy_num == item.guild_limit_num)
            item.sell = true;
        if (!item.buy_record.hasItem(pid)) {
            item.buy_record.createItem(pid);
        }
        item.buy_record[pid] = item.buy_record[pid] || 0;
        item.buy_record[pid] += num;
    }
    return {
        err: null,
        ret: {
            ret: 0
        }
    };
}

module.exports = function (data) {
    return new GuildShop(data);
};