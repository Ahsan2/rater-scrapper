const {Builder, By, Key, until} = require('selenium-webdriver');
const { parse } = require('node-html-parser');
const axios = require('axios');
const config = require('./config');
const sendMail = require('./sendMail');
const emailTemplate = require('./emailTemplate');

const client = require('twilio')(config.TWILIO_ACC_SID, config.TWILIO_AUTH_TOKEN);

let driver1 = new Builder().forBrowser('chrome').build();
let driver2 = new Builder().forBrowser('chrome').build();
let prevUpdateID = 0;

async function makePostRequest(params) {
  var headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'key': 'lkmqwer7f60b864976a08abh789t098'
  }
  /*var params = {
      first_name: 'test f name',
      last_name: 'test l name',
      email: 'nilesh.silversky@gmail.com',
      phone: '1234567890',
      address: 'test',
      zipcode: '121212',
      city: 'test city'
  }*/
  var url = "http://homeinsurance.flquotes.com/external_api/insert_lead_from_external_source.php";
  const formUrlEncoded = x => Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')
  
  axios({
      method: 'POST',
      url,
      headers,
      data: formUrlEncoded(params)
  }).then(function(response) {
      console.log(response.data)
  }).catch(function(error) {
      console.log(error)
  })
}

const getLeadsForSMS = async () => {
  await driver1.wait(until.titleIs('FMAP - SearchResults'), 10000);
  let html  = await driver1.getPageSource();
  let root = parse(html);
  let rows = root.querySelector('#property tbody') ? root.querySelector('#property tbody').childNodes : [];
  rows.forEach((tr, j) => {
    if (tr.tagName === 'tr') {
      if (!tr.childNodes[7].childNodes[0]) {
        const checkID = tr.childNodes[19].childNodes[3].rawAttrs.match('onclick="interested\\((.*)\\)"')[1];
        getConsumerInfo(checkID, j, tr.childNodes[5].childNodes[0].rawText);
      }
    }
  })
}

const getLeadsForEmail = async () => {
  await driver2.wait(until.titleIs('FMAP - SearchResults'), 10000);
  let html  = await driver2.getPageSource();
  let root = parse(html);
  let rows = root.querySelector('#property tbody') ? root.querySelector('#property tbody').childNodes : [];
  let updateIDs = [];

  rows.forEach((tr, j) => {
    if (tr.tagName === 'tr') {
      if (tr.childNodes[7].childNodes[0]) {
        const updateID = tr.childNodes[19].childNodes[1].rawAttrs.match('onclick="updateQuoteRequestStatus\\((.*)\\)"')[1];
        let consumerInfo = tr.childNodes[7].childNodes[0].rawText.replace('Cell', ' Cell');//.replace('&lt;', '<'). replace('&gt;', ' >');
        // closeLead(updateID);
        if (updateID > prevUpdateID) {
          updateIDs.push({updateID, consumerInfo});
          prevUpdateID = updateID;
        }
      }
    }
  })
  closeLeads(updateIDs);
}

const getConsumerInfo = async (checkID,index, id) => {
  driver1.executeScript("interested(" + checkID + ")")
  await driver1.switchTo().alert().accept();
  await driver1.wait(until.titleIs('FMAP - SearchResults'), 10000);
  let html  = await driver1.getPageSource();
  let root = parse(html);
  let rows = root.querySelector('#property tbody').childNodes;
  let consumerInfo = rows[index].childNodes[7].childNodes[0].rawText
  let body = consumerInfo.replace('Cell', ' Cell')
  // .replace('&lt;', '<')
  // .replace('&gt;', ' >')
  .replace('Home', '<br/>Home')
  .replace('Cell', '<br/>Cell')
  .replace('Email', '<br/>Email');
  client.messages.create({
    to: config.TWILIO_TO,
    from: config.TWILIO_FROM,
    body
  })
  .then(msg => console.log(msg.sid))
  
  let params = {}
  params.last_name = consumerInfo.substring(0, str.indexOf("+")); 
  params.first_name = consumerInfo.substring(s.indexOf(",") + 1, s.indexOf("Home:")).trim();
  params.phone = consumerInfo.substring(s.indexOf("Home:") + 5, s.indexOf("Cell:")).trim();
  params.email = consumerInfo.substring(s.indexOf("Email:") + 6).trim();
  params.address = ''
  params.zipcode = 0
  params.city = ''
  console.log(params)
  // makePostRequest(params)
}

const closeLeads = async (updateIDs) => {
  const len = updateIDs.length
  for (let i = 0; i < len; i++) {
    let updateID = updateIDs[i].updateID;
    // console.log("updateQuoteRequestStatus(" + updateID + ")")
    await driver2.executeScript("updateQuoteRequestStatus(" + updateID + ")")
    await driver2.wait(until.titleIs('FMAP - Update Status'), 10000);
    // let fieldset = await driver2.findElements(By.tagName("fieldset"));
    let html  = await driver2.getPageSource();
    let root = parse(html);
    let fieldset = root.querySelectorAll('fieldset.eightPt_fieldset')[1].outerHTML;
    let consumerInfo = `<div style="font-weight: bold">Consumer Info</div>
                        <div>${updateIDs[i].consumerInfo}<div>`;
    sendMail(emailTemplate(consumerInfo + fieldset))
    .then(data => {
      console.log("Lead mailed");
    })
    .catch(error => {
      console.log("Mail error:", error);
    });

    await driver2.findElement(By.name('update')).click();

    await driver2.get('https://fmap.citizensfla.com/fmap/searchcriteria.do');
    await driver2.wait(until.titleIs('FMAP - Agent Home Page'), 10000);

    driver2.executeScript("runSearch('56139')")
    await driver2.switchTo().alert().accept();
  }
}

(async function example() {
  try {
    // Driver for SMS
    await driver1.get('https://fmap.citizensfla.com/fmap/login.do');
    await driver1.wait(until.titleIs('FMAP - Login'), 10000);
    // let title1 = await driver1.getTitle();
    // console.log(title1);

    await driver1.findElement(By.name('loginId')).sendKeys(config.FMAP_USERNAME);
    await driver1.findElement(By.name('password')).sendKeys(config.FMAP_PASSWORD);
    await driver1.findElement(By.name('Login')).click();
    await driver1.wait(until.titleIs('FMAP - Agent Home Page'), 10000);
    // let title2 = await driver1.getTitle();
    // console.log(title2);

    driver1.executeScript("runSearch('56139')")
    await driver1.switchTo().alert().accept();

    getLeadsForSMS();
    
    // Driver for Email
    await driver2.get('https://fmap.citizensfla.com/fmap/login.do');
    await driver2.wait(until.titleIs('FMAP - Login'), 10000);
    // let title1 = await driver2.getTitle();
    // console.log(title1);

    await driver2.findElement(By.name('loginId')).sendKeys(config.FMAP_USERNAME);
    await driver2.findElement(By.name('password')).sendKeys(config.FMAP_PASSWORD);
    await driver2.findElement(By.name('Login')).click();
    await driver2.wait(until.titleIs('FMAP - Agent Home Page'), 10000);
    // let title2 = await driver2.getTitle();
    // console.log(title2);

    driver2.executeScript("runSearch('56139')")
    await driver2.switchTo().alert().accept();

    getLeadsForEmail();

    setInterval(async () => {
      await driver1.navigate().refresh();
      getLeadsForSMS();
    }, 2500)

    setInterval(async () => {
      await driver2.navigate().refresh();
      getLeadsForEmail();
    }, 4000)
  } finally {
    // await driver1.quit();
  }
})()