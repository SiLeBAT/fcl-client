import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { User } from '../../models/user.model';
import { Institution } from '../../models/institution.model';
import { UserData } from '../../models/userdata.model';


@Injectable()
export class UserService {

  constructor(private httpClient: HttpClient) { }

  getAll() {
    // const options = this.getJwtHeaders();

    // return this.httpClient
    //   .get('/users', options);

    return this.httpClient
      .get('/users');

  }

  getAllInstitutions() {
    return this.httpClient
      .get('api/v1/institutions');
  }


  delete(_id: string) {
    // const options = this.getJwtHeaders();

    // return this.httpClient
    //   .delete('/users/' + _id, options);

    return this.httpClient
      .delete('/users/' + _id);
}

  create(user: User) {
    return this.httpClient
      .post('/users/register', user);
  }

  recoveryPassword(email: String) {
    return this.httpClient
      .post('users/recovery', {email: email});
  }

  resetPassword(newPw: String, token: String) {
    return this.httpClient
      .post('users/reset/' + token, {newPw: newPw});
  }

  activateAccount(token: String) {
    return this.httpClient
      .post('users/activate/' + token, null);
  }

  adminActivateAccount(adminToken: String) {
    return this.httpClient
      .post('users/adminactivate/' + adminToken, null);
  }

  addUserData(user: User, userData: UserData) {
    return this.httpClient
      .post('users/userdata', {user: user, userdata: userData});
  }

  updateUserData(_id: string, userData: UserData) {
    return this.httpClient
      .put('users/userdata/' + _id, userData);
  }

  deleteUserData(userdataId: string, userId: string) {
    return this.httpClient
      .delete('users/userdata/' + userdataId + '&' + userId);
  }

}
