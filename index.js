const {Builder, By, Key, until} = require('selenium-webdriver');
const { parse } = require('node-html-parser');
// const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const config = require('./config');
// const csvWriter = createCsvWriter({
//     path: './leads.csv',
//     fieldDelimiter: ';',
//     append: true,
//     header: [
//         {id: 'propertyAddr', title: 'Property Address'},
//         {id: 'consumerInfo', title: 'Consumer Information'},
//         {id: 'needBy', title: 'Need By'},
//         {id: 'amount', title: 'Amount'},
//         {id: 'propertyType', title: 'Property Type'},
//         {id: 'year', title: 'Year'},
//         {id: 'construction', title: 'Construction'}
//     ]
// });

const client = require('twilio')(config.TWILIO_ACC_SID, config.TWILIO_AUTH_TOKEN);

// let leads = [];
let driver = new Builder().forBrowser('chrome').build();

const getLeads = async () => {
  await driver.wait(until.titleIs('FMAP - SearchResults'), 10000);
  let html  = await driver.getPageSource();
  let root = parse(html);
  let rows = root.querySelector('#property tbody').childNodes;
  rows.forEach((tr, j) => {
    if (tr.tagName === 'tr') {
      // let lead = {};
      // let count = 0;

      if (!tr.childNodes[7].childNodes[0]) {
        const checkID = tr.childNodes[19].childNodes[3].rawAttrs.match('onclick="interested\\((.*)\\)"')[1];
        getConsumerInfo(checkID, j, tr.childNodes[5].childNodes[0].rawText);
      }

      /*tr.childNodes.forEach((td, i) => {
        if (i !== 1 && i !== 3 && i !== tr.length - 1) {
          if (td.tagName === 'td') {
            if (i == 5) {
              lead.propertyAddr = '';
              count++;
              td.childNodes.forEach(textNode => {
                lead.propertyAddr += textNode.rawText;
              })
            } 
            else {
              switch(count) {
                case 0:
                  lead.propertyAddr = td.childNodes[0].rawText; count++; break;
                case 1:
                  lead.consumerInfo = td.childNodes[0] ? td.childNodes[0].rawText.replace('&lt;', '').replace('&gt;', '') : '';
                  count++; break;
                case 2:
                  lead.needBy = td.childNodes[0].rawText; count++; break;
                case 3:
                  lead.amount = td.childNodes[0].rawText; count++; break;
                case 4:
                  lead.propertyType = td.childNodes[0].rawText; count++; break;
                case 5:
                  lead.year = td.childNodes[0].rawText; count++; break;
                case 6:
                  lead.construction = td.childNodes[0].rawText; 
                  count++; 
                  leads.push(lead); 
                  if (j == rows.length - 1) {
                    csvWriter.writeRecords(leads)       // returns a promise
                      .then(() => {
                          console.log('Leads fetched:', leads.length);
                          leads = [];
                      });
                  }
                  break;
              }
            }
          }
        }
      })*/
    }
  })
}

const getConsumerInfo = async (checkID,index, id) => {
  driver.executeScript("interested(" + checkID + ")")
  await driver.switchTo().alert().accept();
  await driver.wait(until.titleIs('FMAP - SearchResults'), 10000);
  let html  = await driver.getPageSource();
  let root = parse(html);
  let rows = root.querySelector('#property tbody').childNodes;
  let consumerInfo = rows[index].childNodes[7].childNodes[0].rawText.replace('Cell', ' Cell').replace('&lt;', '<'). replace('&gt;', ' >');
  client.messages.create({
    to: config.TWILIO_TO,
    from: config.TWILIO_FROM,
    body: consumerInfo
  })
  .then(msg => console.log(msg.sid))
  // rows.forEach((tr, j) => {
  //   if (tr.tagName === 'tr') {

  //   }
  // }
}

(async function example() {
  try {
    await driver.get('https://fmap.citizensfla.com/fmap/login.do');
    await driver.wait(until.titleIs('FMAP - Login'), 10000);
    // let title1 = await driver.getTitle();
    // console.log(title1);

    await driver.findElement(By.name('loginId')).sendKeys(config.FMAP_USERNAME);
    await driver.findElement(By.name('password')).sendKeys(config.FMAP_PASSWORD);
    await driver.findElement(By.name('Login')).click();
    await driver.wait(until.titleIs('FMAP - Agent Home Page'), 10000);
    // let title2 = await driver.getTitle();
    // console.log(title2);

    // await driver.findElement(By.xpath("//a[@href='javascript:runSearch(\'56139\')']")).click();
    // driver.findElement(By.linkText('<span id="text_1">Run</span>')).click()
    driver.executeScript("runSearch('56139')")
    await driver.switchTo().alert().accept();
    getLeads();

    setInterval(async () => {
      await driver.navigate().refresh();
      getLeads();
    }, 2000)
  } finally {
    // await driver.quit();
  }
})()