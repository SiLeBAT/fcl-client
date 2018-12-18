import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private httpClient: HttpClient) { }

    create(user: User) {
        return this.httpClient
      .post('/users/register', user);
    }

    recoveryPassword(email: String) {
        return this.httpClient
      .post('users/recovery', { email: email });
    }

    resetPassword(newPw: String, token: String) {
        return this.httpClient
      .post('users/reset/' + token, { newPw: newPw });
    }

    activateAccount(token: String) {
        return this.httpClient
      .post('users/activate/' + token, null);
    }

    adminActivateAccount(adminToken: String) {
        return this.httpClient
      .post('users/adminactivate/' + adminToken, null);
    }

}
