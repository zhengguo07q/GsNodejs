这是部分NODEJS的服务器的代码，用来表达一种NODEJS的用法。 

这套服务器使用的是网易pomelo的框架， 支持多进程多nodejs服务器模式，也就是传统的分布式服务器模式。


Nodejs开发的核心问题在哪儿？
Nodejs的问题有两点
1，在于callback回调问题， 回调会导致逻辑不是很清晰。
我们一般的程序开发都是顺序逻辑的， 都是从A-B-C这样的逻辑跳跃，一个函数下到另一个函数， cb的写法会导致这个函数体没有执行完， 就跳转到了另外一个函数体。如果这种嵌套体太多， 则开发人员容易逻辑混乱，逻辑混乱就容易造成BUG。 
2，Javascript的语法规范太过宽泛，10年的时候做HTML5研发的时候，统计过js的类的写法， 都有好几种， 这样就造成了开发人员代码太过随意的问题。

所以NODEJS的核心问题在于代码规范的确立，想办法在业务层去掉CB， 我在协议层用了一个特殊的合并技巧来处理回调。
制定一套比较详细的代码规范， 尽量制定好代码格式与要求。
尽可能在开发层，屏蔽掉callback的写法。

类定义写法：

var EntityUtility = require('app/util/EntityUtility');

var GuildCopy = function(data, info)
{
	this.info = info;
};


GuildCopy.prototype.create = function(data, info)
{
	this.resetCopys();
};


跨进程访问合并回调：
Handler.prototype.addGuildInfo = function(applyId, guildId, guildName, type, cb)
{
    playerStorage().load(applyId, function (err, player) 
    {
        if (player)
        {
            GuildClient.addGuildInfo(player, guildId, guildName);
            playerStorage().update(player, function (err) {});
        }
    }); 
    cb && cb();
};

逻辑处理层用来合并回调：
Handler.prototype.dissolutionGuildInfo = function (msg, session, next) {
    var isCancel = msg.isCancel;
    GuildData.checkLevelLimit(session.player.Info.level);

    this.app && this.app.rpc.global.GuildRemote.dissolutionGuildInfo('', session.player.playerId, session.player.Info.guildId, isCancel, function () {
        next(null, RpcUtility.result(arguments));
    });
};

关于Callback的问题。
cb是nodejs存在的基础， 无阻塞依赖于此， 而且我们大量的技巧编程也依赖于此， 我的意见是，在核心框架层可以大量使用，用来实现一些比较麻烦， 复杂多变的业务应用。但是在业务层应该尽量屏蔽掉，以减少开发人员带来的压力。  