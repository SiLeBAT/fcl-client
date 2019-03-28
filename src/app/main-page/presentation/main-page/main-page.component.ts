import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { UserService } from '../../../user/services/user.service';
import { MainPageService } from '../../services/main-page.service';
import { Store } from '@ngrx/store';
import * as fromUser from '../../../user/state/user.reducer';
import * as userActions from '../../../user/state/user.actions';

@Component({
    selector: 'fcl-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {
    @ViewChild('fileInput') fileInput: ElementRef;

    private isActive = false;
    appName: string = environment.appName;
    supportContact: string = environment.supportContact;
    subscriptions = [];

    constructor(
    public userService: UserService,
    public mainPageService: MainPageService,
    private store: Store<fromUser.State>
  ) {}

    ngOnInit() {
        this.subscriptions.push(
            this.mainPageService.doInputEmpty.subscribe(notification =>
            this.setInputEmpty()
          )
        );
    }

    logout() {
        this.store.dispatch(new userActions.LogoutUser());
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
