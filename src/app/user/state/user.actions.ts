import { LoginCredentials, TokenizedUser } from '../models/user.model';
import { Action } from '@ngrx/store';
import { ActivationStatus } from '../../shared/model/types';

export enum UserActionTypes {
    LoginUserSSA = '[User] Login User',
    UpdateUserSOA = '[User] Update User',
    LogoutUserMSA = '[User] Logout User',
    LoginActivatedSOA = '[User] Login active'
}

export class LoginUserSSA implements Action {
    readonly type = UserActionTypes.LoginUserSSA;

    constructor(public payload: LoginCredentials) { }
}

export class UpdateUserSOA implements Action {
    readonly type = UserActionTypes.UpdateUserSOA;

    constructor(public payload: { currentUser: TokenizedUser | null }) { }
}

export class LogoutUserMSA implements Action {
    readonly type = UserActionTypes.LogoutUserMSA;

    constructor() { }
}

export class LoginActivatedSOA implements Action {
    readonly type = UserActionTypes.LoginActivatedSOA;

    constructor(public payload: ActivationStatus) {}
}

export type UserActions =
      LoginUserSSA
    | UpdateUserSOA
    | LogoutUserMSA
    | LoginActivatedSOA;
