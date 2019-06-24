const {Builder, By, Key, until} = require('selenium-webdriver');
 
(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('https://fmap.citizensfla.com/fmap/login.do');
    await driver.wait(until.titleIs('FMAP - Login'), 10000);
    let title1 = await driver.getTitle();
    console.log(title1);

    await driver.findElement(By.name('loginId')).sendKeys('W280572');
    await driver.findElement(By.name('password')).sendKeys('JF2019');
    await driver.findElement(By.name('Login')).click();
    await driver.wait(until.titleIs('FMAP - Agent Home Page'), 10000);
    let title2 = await driver.getTitle();
    console.log(title2);

    await driver.findElement(By.xpath("//a[@href='javascript:runSearch(\'56139\')']")).click();
    await driver.wait(until.titleIs('FMAP - SearchResults'), 10000);
    let title3 = await driver.getTitle();
    console.log(title3);
  } finally {
    await driver.quit();
  }
})()