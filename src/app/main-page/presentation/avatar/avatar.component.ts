import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../../user/models/user.model';
import { Observable } from 'rxjs';

@Component({
    selector: 'fcl-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent {
    @Input() currentUser: User | null;
    @Output() onLogout = new EventEmitter();
    @Output() onProfile = new EventEmitter();

    constructor() { }

    logout() {
        this.onLogout.emit();
    }

    goToProfile() {
        this.onProfile.emit();
    }
}
