import { Component, OnInit } from '@angular/core';
import { TokenizedUser } from '../../models/user.model';
import * as fromUser from '../../../user/state/user.reducer';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-profile-container',
    templateUrl: './profile-container.component.html',
    styleUrls: ['./profile-container.component.scss']
})
export class ProfileContainerComponent implements OnInit {
    currentUser$ = this.store.pipe(
        select(fromUser.getCurrentUser)
    );

    constructor(private store: Store<fromUser.State>) { }

    ngOnInit() {
    }
}
