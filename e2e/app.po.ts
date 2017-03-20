import {browser, element, by} from 'protractor';

export class FclAppPage {
  static navigateTo() {
    browser.ignoreSynchronization = true;
    return browser.get('/');
  }

  static getHomeButtonText() {
    return element(by.css('app-root > md-toolbar > div > md-toolbar-row > button.mat-button > span')).getText();
  }
}
