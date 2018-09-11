import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';

import { environment } from '../environments/environment';
import { AuthService } from './auth/services/auth.service';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('fileInput') fileInput: ElementRef;

  private isActive = false;
  appName: string = environment.appName;
  supportContact: string = environment.supportContact;
  subscriptions = [];

  constructor(
    private authService: AuthService,
    private appService: AppService) {}

  ngOnInit() {
    this.subscriptions.push(this.appService.doInputEmpty
      .subscribe(notification => this.setInputEmpty()));
  }

  getCurrentUserEmail() {
    if (this.authService.loggedIn()) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      return currentUser.email;
    }
  }

  logout() {
    this.authService.logout();
  }

  isTracingActive() {
    return this.appService.isTracingActive();
  }

  setInputEmpty() {
    (<HTMLInputElement>this.fileInput.nativeElement).value = '';
  }

  getDisplayMode() {
    let displayMode;
    if (this.isActive) {
      displayMode = 'block';
    } else {
      displayMode = 'none';
    }

    return displayMode;
  }

}
