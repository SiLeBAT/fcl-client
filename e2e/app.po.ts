import {browser, element, by} from 'protractor';

export class FclAppPage {
  static navigateTo() {
    browser.ignoreSynchronization = true;
    return browser.get('/');
  }

  static getHomeButtonText() {
    return element(by.css('app-root > mat-toolbar > div > mat-toolbar-row > button.mat-button > span')).getText();
  }
}
