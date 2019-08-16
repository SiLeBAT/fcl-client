import { MainPageState, reducer } from './main-page.reducer';
import { DashboardActivated } from './main-page.actions';
import { ActivationStatus } from '../../shared/model/types';

describe('main-page reducer', () => {

    let currentState: MainPageState;

    beforeEach(() => {
        currentState = {
            dashboardActive: false
        };
    });

    it('should have valid state after DashboardActivated action', () => {
        const activationStatus: ActivationStatus = {
            isActivated: true
        };

        const currentAction: DashboardActivated = new DashboardActivated(activationStatus);

        const expectedState: MainPageState = {
            dashboardActive: true
        };

        const result: MainPageState = reducer(currentState, currentAction);

        expect(result).toMatchObject(expectedState);
    });
});
