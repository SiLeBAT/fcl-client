import * as fromRoot from '../../state/app.state';
import {TokenizedUser} from '../models/user.model';
import {createFeatureSelector, createSelector} from '@ngrx/store';
import {UserActions, UserActionTypes} from './user.actions';

export const STATE_SLICE_NAME = 'user';

export interface State extends fromRoot.State {
  user: UserState;
}

export interface UserState {
  currentUser: TokenizedUser | null;
  loginActive: boolean;
}

const initialState: UserState = {
  currentUser: retrieveUserFromLocalStorage(),
  loginActive: false,
};

// SELECTORS
export const getUserFeatureState =
  createFeatureSelector<UserState>(STATE_SLICE_NAME);

export const getCurrentUser = createSelector(
  getUserFeatureState,
  state => state.currentUser
);

export const getLoginActive = createSelector(
  getUserFeatureState,
  state => state.loginActive
);

// REDUCER
export function reducer(
  state: UserState = initialState,
  action: UserActions
): UserState {
  switch (action.type) {
    case UserActionTypes.UpdateUserSOA:
      return {
        ...state,
        currentUser: action.payload.currentUser,
      };

    case UserActionTypes.LoginActivatedSOA:
      return {
        ...state,
        loginActive: action.payload.isActivated,
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
