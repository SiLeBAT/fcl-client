import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../../user/models/user.model';
import { Observable } from 'rxjs';
import { UserService } from '../../../user/services/user.service';

@Component({
    selector: 'fcl-avatar',
    templateUrl: './avatar.component.html'
})
export class AvatarComponent {
    @Input() currentUser$: Observable<User | null>;
    @Output() onLogout = new EventEmitter();
    @Output() onProfile = new EventEmitter();

    constructor(private userService: UserService) { }

    logout() {
        this.onLogout.emit();
    }

    goToProfile() {
        this.onProfile.emit();
    }

    getCurrentUserEmail() {
        if (this.userService.loggedIn()) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            return currentUser.email;
        }
    }
}
