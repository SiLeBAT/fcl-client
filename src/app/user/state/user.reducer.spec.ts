import { reducer, UserState } from './user.reducer';
import {
    UpdateUserSOA,
    LoginActivatedSOA
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
            token: 'test',
            gdprAgreementRequested: true
        };
    });

    it('should have valid state after UpdateUserSOA action', () => {
        const currentAction: UpdateUserSOA = new UpdateUserSOA({ currentUser: mockUser });

        const expectedState: UserState = {
            currentUser: mockUser,
            loginActive: false
        };

        const result: UserState = reducer(currentState, currentAction);

        expect(result).toMatchObject(expectedState);
    });

    it('should have valid state after LoginActivatedSOA action', () => {
        const activationStatus: ActivationStatus = {
            isActivated: true
        };

        const currentAction: LoginActivatedSOA = new LoginActivatedSOA(activationStatus);

        const expectedState: UserState = {
            currentUser: null,
            loginActive: true
        };

        const result: UserState = reducer(currentState, currentAction);

        expect(result).toMatchObject(expectedState);
    });

});
