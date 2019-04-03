import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { TokenizedUser } from '../../models/user.model';

@Component({
    selector: 'fcl-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
    @Input() currentUser: TokenizedUser;
    @Output() logout = new EventEmitter();
    private componentActive = true;

    constructor() { }

    ngOnInit() {}

    onLogout() {
        this.logout.emit();
    }

    ngOnDestroy(): void {
        this.componentActive = false;
    }
}
