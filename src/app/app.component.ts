import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { environment } from '../environments/environment';
import { UserService } from './/user/services/user.service';
import { AppService } from './app.service';
import { Store } from '@ngrx/store';
import * as fromUser from './user/state/user.reducer';
import * as userActions from './user/state/user.actions';

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
    public userService: UserService,
    public appService: AppService,
    private store: Store<fromUser.State>
  ) {}

    ngOnInit() {
        this.subscriptions.push(
            this.appService.doInputEmpty.subscribe(notification =>
            this.setInputEmpty()
          )
        );
    }

    getCurrentUserEmail() {
        if (this.userService.loggedIn()) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            return currentUser.email;
        }
    }

    isServerLess(): boolean {
        return environment.serverless;
    }

    logout() {
        this.store.dispatch(new userActions.LogoutUser());
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
