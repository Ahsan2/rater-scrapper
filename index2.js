const {Builder, By, Key, until} = require('selenium-webdriver');
 
(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('https://www.000webhost.com/cpanel-login?from=panel');
    await driver.wait(until.titleIs('Login to free cPanel and manage free web hosting'), 4000);
    let title1 = await driver.getTitle();
    console.log(title1)
    await driver.findElement(By.name('email')).sendKeys('ahsan21916@gmail.com');
    await driver.findElement(By.name('password')).sendKeys('00.Aloha1.');
    await driver.findElement(By.id('000-button_user-login_sign-in-form_log-in')).click();
    await driver.wait(until.titleIs('Website list'), 4000);
    let title2 = await driver.getTitle();
    console.log(title2)
  } finally {
    await driver.quit();
  }
})()