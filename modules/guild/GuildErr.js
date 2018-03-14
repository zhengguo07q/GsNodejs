// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildErr.js
//  Creator 	: zg 
//  Date		: 2015-6-18
//  Comment	: 
// ***************************************************************

var util = require('util');
var ModuleErr = require('app/core/ModuleErr');


var GuildErr = function(subVal)
{
	ModuleErr.call(this, 1000, subVal);
};

util.inherits(GuildErr, ModuleErr);

module.exports = 
{
	Sucess 							: new GuildErr(0),
	NotExistsGuild 					: new GuildErr(1),			//不存在的帮派
	NotEnoughLevel 					: new GuildErr(2),			//创建帮派的等级不够
	ExistGuildName 					: new GuildErr(3),			//存在的帮派名字
	AlreadyApplyMember				: new GuildErr(4),			//已经申请加入帮会
	NotExistsIcon					: new GuildErr(5),			//不存在的图标
	OverApplyLimit					: new GuildErr(6),			//超出最大申请数量限制
	NotAllowName					: new GuildErr(7),			//不允许的名字
	NotEnoughGold					: new GuildErr(8),			//没有足够的金钱
	ReachMaxAmount					: new GuildErr(9),			//帮会达到最大人数上限
	AlreadyJoinGuild				: new GuildErr(10),			//已经加入帮会
	NotExistsGuildMember			: new GuildErr(11),			//不存在的帮会成员
	AlreadyThisJob					: new GuildErr(12),			//已经是此职位
	OverJobLimit					: new GuildErr(13),			//已经达到最大此职位人数限制
	NotAllowMasterExit				: new GuildErr(14),			//不允许帮主退帮
	NotExistsApplyPlayer			: new GuildErr(15),			//不存在申请的玩家
	AlreadyJoinGuild				: new GuildErr(16),			//已经加入帮派
	SacrificeVipLimit				: new GuildErr(17),			//参拜VIP限制
	AlreadyJoinSacrifice			: new GuildErr(20),			//已经参加祭祀
	NotExistSacrificeType			: new GuildErr(21),			//不存在的祭祀类型
	KickMemberIntervalLimit			: new GuildErr(22),			//踢成员间隔限制
	JoinAndCreateIntervalLimit		: new GuildErr(23),			//加入或者创建间隔限制
	NotUnlockCopy					: new GuildErr(24),			//未解除锁定的副本
	NotEnoughLevelCreate 			: new GuildErr(25),			//参加其他帮派活动的级别不够
	NotEnoughImpeachTime	 		: new GuildErr(25),			//帮主离线时间不够，不能弹劾

	NotPrivilegeChangeJob			: new GuildErr(31),			//没有权限改变职位
	NotPrivilegeDissolution			: new GuildErr(32),			//没有权限解散帮派
	NotPrivilegeChangeCondition		: new GuildErr(33),			//没有权限设置加入条件
	NotPrivilegeChangeNotice		: new GuildErr(34),			//没有权限改变公告
	NotPrivilegeChangeIcon			: new GuildErr(35),			//没有权限改变会徽
	NotPrivilegeKickMember			: new GuildErr(36),			//没有权限踢出成员
	NotPrivilegeAgreeJoin			: new GuildErr(37),			//没有权限成员审核
	NotPrivilegeUseShop				: new GuildErr(38),			//没有权限使用商店
	NotPrivilegeUseSacrifice		: new GuildErr(39),			//没有权限参拜
	NotPrivilegeUseChat				: new GuildErr(40),			//没有权限聊天
	NotPrivilegeShowMessage			: new GuildErr(41),			//没有权限显示消息动态
	NotPrivilegeChangeMaster		: new GuildErr(42),			//不允许改变帮会会长

	NotExistsGuildItem				: new GuildErr(50),			//此物品已卖出或不存在~
	NotExistsPlayer					: new GuildErr(51),			//不是该公会的成员
	NotEnoughItem					: new GuildErr(52),			//购买数量超出上限
	ErrorId							: new GuildErr(53),			//错误的商品id
	NotExistsGuildShop				: new GuildErr(54),			//不存在的公会商店

	NotExistsCopy					: new GuildErr(71),			//不存在的副本
	MonsterAlreadyDie				: new GuildErr(72),			//怪物已经死亡

	MemberNotExist					: new GuildErr(200),		//会员不存在
	ChapterProgressLack				: new GuildErr(201),		//公会副本进度不足
	SacrificeProgressLack			: new GuildErr(202),		//公会参拜进度不足
	RewardHaveReceived				: new GuildErr(203),		//奖励已领取
	ChapterRewardNotFound			: new GuildErr(204),		//副本通关奖励未找到
	SacrificeRewardNotFound			: new GuildErr(205),		//参拜奖励未找到
	BoxHaveReceived					: new GuildErr(206),		//宝箱已被人领取
	CopyNotFound					: new GuildErr(207),		//副本未找到
	ConfigNotExist					: new GuildErr(208),		//配置不存在
};

