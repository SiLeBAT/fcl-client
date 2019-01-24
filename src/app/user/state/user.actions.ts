import { Credentials, TokenizedUser } from '../models/user.model';
import { Action } from '@ngrx/store';

export enum UserActionTypes {
    LoginUser = '[User] Login User',
    LoginUserSuccess = '[User] Login User Success',
    LoginUserFailure = '[User] Login User Failure',
    LogoutUser = '[User] Logout User'
}

export class LoginUser implements Action {
    readonly type = UserActionTypes.LoginUser;

    constructor(public payload: Credentials) { }
}

export class LoginUserSuccess implements Action {
    readonly type = UserActionTypes.LoginUserSuccess;

    constructor(public payload: TokenizedUser) { }
}

export class LoginUserFailure implements Action {
    readonly type = UserActionTypes.LoginUserFailure;

    constructor() { }
}

export class LogoutUser implements Action {
    readonly type = UserActionTypes.LogoutUser;

    constructor() { }
}

export type UserActions =
      LoginUser
    | LoginUserSuccess
    | LoginUserFailure
    | LogoutUser;
