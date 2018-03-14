// ***************************************************************
//  Copyright(c) Cmge
//  FileName	: GuildMessage.js
//  Creator 	: zg
//  Date		: 2015-6-27
//  Comment	: 
// ***************************************************************


var GuildInfo = require('./GuildInfo');
var GuildData = require('./GuildData');
var util = require('util');
var ObjectUtility = require('app/util/ObjectUtility');
var time = require('app/util/time');


var GuildMessage = function(data)
{
	this.data = data;
};


GuildMessage.prototype.create = function(data)
{
	this.data = data;
};


GuildMessage.prototype.add = function(typeId)
{
	if(this.data.messages.length >= GuildData.maxMessageLimit)
	{
		this.data.messages.shift();
	}

	var args = Array.prototype.slice.call(arguments); 
	args.shift();

	var messageObject = this.getMessageObject(typeId, args);

	this.data.messages.push(messageObject);
};


GuildMessage.prototype.getMessageObject = function(typeId, messageFormat)
{
	return {time : time.now(), typeId : typeId, message: this.getFormatMessage(typeId, messageFormat)};
};


GuildMessage.prototype.getFormatMessage = function(typeId, messageFormat)
{
	
	if(messageFormat.length < 1)
	{
		throw new Error('guild message not allow null : ' + util.inspect(messageFormat));
	}

	var messageFormatTemplate = GuildData.getMessageFormat(typeId);

	if(messageFormat.length == 1)
	{
		var p1 = messageFormat[0];
		var messageText = util.format(messageFormatTemplate, p1);
	}
	else if(messageFormat.length == 2)
	{
		var p1 = messageFormat[0];
		var p2 = messageFormat[1];
		var messageText = util.format(messageFormatTemplate, p1, p2);
	}
	else if(messageFormat.length == 3)
	{
		var p1 = messageFormat[0];
		var p2 = messageFormat[1];
		var p3 = messageFormat[2];
		var messageText = util.format(messageFormatTemplate, p1, p2, p3);
	}
	else if(messageFormat.length == 4)
	{
		var p1 = messageFormat[0];
		var p2 = messageFormat[1];
		var p3 = messageFormat[2];
		var p4 = messageFormat[3];
		var messageText = util.format(messageFormatTemplate, p1, p2, p3, p4);
	}

	return messageText; 
};


GuildMessage.prototype.getMessages = function()
{
	return this.data.messages;
}


module.exports = function(data)
{
	return new GuildMessage(data);
};