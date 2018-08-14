import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { User } from '../../models/user.model';
import { UserService } from '../services/user.service';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser: User;
  users: User[] = [];

  constructor(private userService: UserService,
              private alertService: AlertService,
              private authService: AuthService) {}

  ngOnInit() {
    // this.loadAllUsers();
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }

  logout() {
    this.authService.logout();
  }

  deleteUser(user: User) {
    const _id = user._id;

    this.userService.delete(_id)
    .subscribe((data) => {
      this.alertService.success('User ' + user.firstName + ' ' + user.lastName + ' deleted');
      this.loadAllUsers();
    }, (err: HttpErrorResponse) => {
      try {
        const errObj = JSON.parse(err.error);
        if (err.error instanceof Error) {
          console.error('deleteUser client-side or network error: ', errObj);
        } else {
          console.error(`deleteUser error status ${err.status}: `, errObj);
        }

        this.alertService.error(errObj.title);
      } catch (e) {}

      this.loadAllUsers();
    });

  }

  private loadAllUsers() {
    this.userService.getAll()
    .subscribe((data) => {
      this.alertService.success(data['title']);
      this.users = data['obj'];
    }, (err: HttpErrorResponse) => {
      try {
        const errObj = JSON.parse(err.error);
        console.log('error loadAllUsers: ', errObj);
        this.alertService.error(errObj.title);
      } catch (e) {}
    });
  }
}
