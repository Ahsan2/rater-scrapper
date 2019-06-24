const {Builder, By, Key, until} = require('selenium-webdriver');
 
(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('https://fmap.citizensfla.com/fmap/login.do');
    let title1 = await driver.getTitle();
    console.log(title1)
    await driver.findElement(By.name('loginId')).sendKeys('W280572');
    await driver.findElement(By.name('password')).sendKeys('JF2019');
    await driver.findElement(By.name('Login')).click();
    let title2 = await driver.getTitle();
    console.log(title2)
  } finally {
    await driver.quit();
  }
})()