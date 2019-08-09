import { reducer, UserState } from './user.reducer';
import {
    LoginUserSuccess,
    LoginUserFailure,
    LogoutUser,
    LoginActivated
} from './user.actions';
import { TokenizedUser } from '../models/user.model';
import { ActivationStatus } from '../../shared/model/types';

describe('user reducer', () => {

    let currentState: UserState;
    let mockUser: TokenizedUser;

    beforeEach(() => {
        currentState = {
            currentUser: null,
            loginActive: false
        };

        mockUser = {
            email: 'test',
            firstName: 'test',
            lastName: 'test',
            token: 'test'
        };
    })

    it('should have valid state after LoginUserSuccess action', () => {
        const currentAction: LoginUserSuccess = new LoginUserSuccess(mockUser);

        const expectedState: UserState = {
            currentUser: mockUser,
            loginActive: false
        };

        const result: UserState = reducer(currentState, currentAction);

        expect(result).toMatchObject(expectedState);
    });

    it('should have valid state after LoginUserFailure action', () => {
        const currentAction: LoginUserFailure = new LoginUserFailure();

        const expectedState: UserState = {
            currentUser: null,
            loginActive: false
        };

        const result: UserState = reducer(currentState, currentAction);

        expect(result).toMatchObject(expectedState);
    });

    it('should have valid state after LogoutUser action', () => {
        const currentAction: LogoutUser = new LogoutUser();

        const expectedState: UserState = {
            currentUser: null,
            loginActive: false
        };

        const result: UserState = reducer(currentState, currentAction);

        expect(result).toMatchObject(expectedState);
    });

    it('should have valid state after LoginActivated action', () => {
        const activationStatus: ActivationStatus = {
            isActivated: true
        };

        const currentAction: LoginActivated = new LoginActivated(activationStatus);

        const expectedState: UserState = {
            currentUser: null,
            loginActive: true
        };

        const result: UserState = reducer(currentState, currentAction);

        expect(result).toMatchObject(expectedState);
    });


})
