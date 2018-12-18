import { Component, OnInit } from '@angular/core';

import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';

@Component({
  // tslint:disable-next-line:component-selector
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    currentUser: User;
    users: User[] = [];

    constructor(private authService: AuthService) {}

    ngOnInit() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));

    }

    logout() {
        this.authService.logout();
    }

}
