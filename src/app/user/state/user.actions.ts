import { LoginCredentials, TokenizedUser } from '../models/user.model';
import { Action } from '@ngrx/store';
import { ActivationStatus } from '../../shared/model/types';

export enum UserActionTypes {
    LoginUser = '[User] Login User',
    LoginUserSuccess = '[User] Login User Success',
    LoginUserFailure = '[User] Login User Failure',
    LogoutUser = '[User] Logout User',
    LoginActivated = '[User] Login active'
}

export class LoginUser implements Action {
    readonly type = UserActionTypes.LoginUser;

    constructor(public payload: LoginCredentials) { }
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

export class LoginActivated implements Action {
    readonly type = UserActionTypes.LoginActivated;

    constructor(public payload: ActivationStatus) {}
}

export type UserActions =
      LoginUser
    | LoginUserSuccess
    | LoginUserFailure
    | LogoutUser
    | LoginActivated;
