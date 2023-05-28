const AWS = require('aws-sdk'),
  ssm = new AWS.SSM(),
  qs = require('querystring'),
  processResponse = require('./src/process-response'),
  createCharge = require('./src/create-charge'),
  STRIPE_SECRET_KEY_NAME = `/${process.env.SSM_PARAMETER_PATH}`,
  IS_CORS = true,
  stripeSecretKeyValue = ssm.getParameter({ Name: STRIPE_SECRET_KEY_NAME, WithDecryption: true });

exports.handler = (event) => {
  console.log('SSM_PARAMETER_PATH:', process.env.SSM_PARAMETER_PATH);
  if (event.httpMethod === 'OPTIONS') {
    return Promise.resolve(processResponse(IS_CORS));
  }
  if (!event.body) {
    return Promise.resolve(processResponse(IS_CORS, 'invalid', 400));
  }

  const chargeRequest = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  if (!chargeRequest.amount || !chargeRequest.currency) {
    return Promise.resolve(processResponse(IS_CORS, 'invalid arguments, please provide amount and currency fields as mentioned in the app README', 400));
  }

  return createCharge(stripeSecretKeyValue.Parameter.value, chargeRequest.stripeToken, chargeRequest.email, chargeRequest.amount, chargeRequest.currency, chargeRequest.description)
    .then(createdCharge => processResponse(IS_CORS, { createdCharge }))
    .catch((err) => {
      console.log(err);
      return processResponse(IS_CORS, { err }, 500);
    });
};
