// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory,Attachment, AttachmentLayoutTypes, CardFactory } = require('botbuilder');
const axios = require('axios');
const feedBack = require('./AdaptiveCards/feedbackTemplate.json');
const moredetails = require('./AdaptiveCards/moreDetailsCard.json')
let prevQuestionsAnswer_policy = "";
let prevQuestionsAnswer_personal = "";
let prevQuestionPolicyUrl = "";
let prevAns;
let prevContext;

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.

        var input,output;
        this.onMessage(async (context, next) => {
            let greetingRegex = /^(hello|hi|hey)\s*[a-zA-Z]*/i;
            let mes= context.activity.text;
            if(mes != null)
            if(greetingRegex.test(mes?.toLocaleLowerCase()))
            {
                console.log('gretting message...');
                await context.sendActivity(MessageFactory.text(`Hello ${context.activity.from.name}, how can i help you!`));
                return
            }
            // const respose = axios.get('https://niraj-dasari-verbose-space-waffle-494p549v557fq56j-5000.preview.app.github.dev/get_text?data='+context.activity.text);
            input = context.activity;
            var api_end_point = 'http://ec2-54-82-167-77.compute-1.amazonaws.com:5000/generate_response'
            console.log(input.channelData)
            if(context.activity.value?.feedback)
            {
                // await context.sendActivity(MessageFactory.text(context.activity.value.feedback));
                let con = context.activity;
                let payload ={
                    context:context.activity,
                    username: prevContext.from.name,
                    question: prevContext.text,
                    answer: {prevQuestionsAnswer_policy,prevQuestionsAnswer_personal},
                    Timestamp: context.activity.timestamp,
                    feed_back:  context.activity.value?.value
                }
                con.question = prevContext.text;
                con.answer = {prevQuestionsAnswer_policy,prevQuestionsAnswer_personal};
                // con['previousAns'] = prevQuestionsAnswer;
                // con['previouseQues']= prevContext.text;
                // console.log(payload);
                const prevfeedback = axios.post('http://ec2-54-82-167-77.compute-1.amazonaws.com:5000/collect_feedback',payload)
                .then((result) => {
                    console.log("line 44",result.data.policy_url);
                    prevQuestionPolicyUrl = result.data.policy_url;
                });
                // axios.get('https://niraj-dasari-verbose-space-waffle-494p549v557fq56j-5000.preview.app.github.dev?data='+prevContext.text);
               
                console.log('received feedback=>',prevQuestionPolicyUrl);
                if(!context.activity.value?.value)
                {
                    console.log(prevQuestionPolicyUrl);
                    const replycard = CardFactory.adaptiveCard(JSON.parse(JSON.stringify(moredetails).replace("${url}", prevQuestionPolicyUrl != null ?prevQuestionPolicyUrl:'https://persistentsystems.sharepoint.com/sites/Pi/Search/SitePages/Policy.aspx?k=policy')));
                    await context.sendActivity(MessageFactory.attachment({
                        contentType: replycard.contentType,
                        content: replycard.content,
                        name: replycard.name
                    }));
                }
                else
                {
                    await context.sendActivity(MessageFactory.text("we are glad to help you!"));
                }

                 return;
            }

            // console.log(axios.post("http://ec2-44-206-240-107.compute-1.amazonaws.com:5000/generate_response",context.activity));
            prevAns = await axios.post("http://ec2-54-82-167-77.compute-1.amazonaws.com:5000/generate_response",context.activity)
            .then((result) => {
                console.log(result);
                prevQuestionsAnswer_policy = result.data.answer.policy_answer;
                prevQuestionsAnswer_personal = result.data.answer.personal_answer;
            });

            const adaptInfo = {
                text:input.text,
                body:"satified with the answer?",
                username:context.activity.from.name,
            } 
            prevContext = context.activity;
            
            var fb = feedBack;
            let titleCard;
            try
            {
                console.log(prevQuestionsAnswer_policy,prevQuestionsAnswer_personal);
                console.log(typeof prevQuestionsAnswer_policy);
                let card_data = JSON.stringify(fb).replace('${policy}',prevQuestionsAnswer_policy != null ? prevQuestionsAnswer_policy.replace(/\n/g, ' '):'').replace('${personal}',prevQuestionsAnswer_personal != null ? prevQuestionsAnswer_personal.replace(/\n/g, ' '):'');
                console.log(card_data)
                titleCard = CardFactory.adaptiveCard(JSON.parse(card_data));
                
            }
            catch(error)
            {
                console.log(error);
            }
            await context.sendActivity(MessageFactory.attachment(
            {
                contentType: titleCard?.contentType,
                content: titleCard?.content,
                name: titleCard?.name
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
