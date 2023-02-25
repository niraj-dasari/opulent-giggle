// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory,Attachment, AttachmentLayoutTypes, CardFactory } = require('botbuilder');
const axios = require('axios');
const feedBack = require('./AdaptiveCards/feedbackTemplate.json');
let prevQuestion = "";

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.

        var input,output;
        this.onMessage(async (context, next) => {
            // const respose = axios.get('https://niraj-dasari-verbose-space-waffle-494p549v557fq56j-5000.preview.app.github.dev/get_text?data='+context.activity.text);
            input = context.activity;
            var api_end_point = 'https://niraj-dasari-verbose-space-waffle-494p549v557fq56j-5000.preview.app.github.dev/get_text'
            console.log(input.channelData)
            if(context.activity.value?.feedback)
            {
                console.log('received feedback');
                await context.sendActivity(MessageFactory.text(context.activity.value.feedback));
                axios.get('https://niraj-dasari-verbose-space-waffle-494p549v557fq56j-5000.preview.app.github.dev?data='+prevQuestion);
                return;
            }

            output = axios.post(api_end_point,context.activity);
            const adaptInfo = {
                text:input.text,
                body:"satified with the answer?",
                username:context.activity.from.name,
            } 
            prevQuestion = adaptInfo.text;
            
            
            console.log(context.activity)
            const titleCard = CardFactory.adaptiveCard(JSON.parse(
                JSON.stringify(feedBack).replace("${text}", adaptInfo.text).replace('${body}', adaptInfo.body).replace('${username}',adaptInfo.username)));
            
            await context.sendActivity(MessageFactory.attachment(
            {
                contentType: titleCard.contentType,
                content: titleCard.content,
                name: titleCard.name
            }));
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;
