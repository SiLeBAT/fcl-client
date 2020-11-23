import { Action } from '@ngrx/store';
import { ActivationStatus } from '../../shared/model/types';

export enum MainPageActionTypes {
    DashboardActivated = '[Dashboard] Dashboard active'
}

export class DashboardActivated implements Action {
    readonly type = MainPageActionTypes.DashboardActivated;

    constructor(public payload: ActivationStatus) {}
}

export type MainPageActions =
      DashboardActivated;
