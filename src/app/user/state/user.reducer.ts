import * as fromRoot from '../../state/app.state';
import { TokenizedUser } from '../models/user.model';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserActions, UserActionTypes } from './user.actions';

export const STATE_SLICE_NAME = 'user';

export interface State extends fromRoot.State {
    user: UserState;
}

export interface UserState {
    currentUser: TokenizedUser | null;
}

const initialState: UserState = {
    currentUser: retrieveUserFromLocalStorage()
};

// SELECTORS
export const getUserFeatureState = createFeatureSelector<UserState>(STATE_SLICE_NAME);

export const getCurrentUser = createSelector(
  getUserFeatureState,
  state => state.currentUser
);

// REDUCER
export function reducer(state: UserState = initialState, action: UserActions): UserState {
    switch (action.type) {

        case UserActionTypes.LoginUserSuccess:
            return {
                ...state,
                currentUser: action.payload
            };

        case UserActionTypes.LoginUserFailure:
            return {
                ...state,
                currentUser: null
            };

        case UserActionTypes.LogoutUser:
            return {
                ...state,
                currentUser: null
            };
        default:
            return state;
    }
}

// Utilities
function retrieveUserFromLocalStorage(): TokenizedUser | null {
    const currentUser: string | null = localStorage.getItem('currentUser');
    if (!currentUser) {
        return null;
    }
    return JSON.parse(currentUser);
}
