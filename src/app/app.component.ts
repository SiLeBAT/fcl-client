import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { environment } from '../environments/environment';
import { AuthService } from './/user/services/auth.service';
import { AppService } from './app.service';

@Component({
    // tslint:disable-next-line:component-selector
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
    public authService: AuthService,
    public appService: AppService) {}

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

    isServerLess(): boolean {
        return environment.serverless;
    }

    logout() {
        this.authService.logout();
    }

    isTracingActive() {
        return this.appService.isTracingActive();
    }

    setInputEmpty() {
        (this.fileInput.nativeElement as HTMLInputElement).value = '';
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
