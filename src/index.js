const request = require('request');
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();

exports.handler = async function(event, context) {

  // Get WebHook URL from SSM parameter store.
  const slackWebhook = await ssm.getParameter({
    Name: '/Lambda/production/slack-webhook',
    WithDecryption: true,
  }).promise();
  let SLACK_WEBHOOK = slackWebhook.Parameter.Value;

  // Get user_id from SSM parameter store.
  const slackMember = await ssm.getParameter({
      Name: '/Lambda/production/slack-members',
      WithDecryption: true,
  }).promise();
  let member = slackMember.Parameter.Value.split(',');

  // Inject SLACK_CHANNEL value.
  const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

  // create message
  const now = new Date();
  const Today =  now.getDate();
  const mention = "<@" + member[Today] + ">";
  let message = mention + "\n";
  message += '*' + "Advent Calendar " + Today + "日目 よろしくお願いします！" + '*' + "\n";
  message += 'https://adventar.org/calendars/4548';

  // Request configure
  const options = {
    url: SLACK_WEBHOOK,
    headers: {
      'Content-type': 'application/json'
    },
    body: {
      "text": message,
      "channel": SLACK_CHANNEL,
      "username": "uluru",
      "icon_emoji": "uluru",
    },
    json: true
  };

  // Sending message
  request.post(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      context.done(null, body);
    } else {
      console.log('error: ' + response.statusCode);
      context.done(null, 'error');
    }
  });
}
