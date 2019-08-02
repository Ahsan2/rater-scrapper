const AWS = require("aws-sdk");

AWS.config.update(require('./config').SES);

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

module.exports = (emailTemplate) => {
  const params = {
    Destination: {
      ToAddresses: ["jfriman@str8linegroup.com", "ahsan21916@gmail.com"]
      // ToAddresses: ["ahsan21916@gmail.com"]
    },
    Message: {
      Body: {
        Html: {
          // HTML Format of the email
          Charset: "UTF-8",
          Data:
            emailTemplate
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "FMAP Lead"
      }
    },
    Source: "jose.friman@gmail.com"
  };
  
  return ses.sendEmail(params).promise();
}