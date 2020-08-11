import { Action } from '@ngrx/store';

export enum ContentActionTypes {
    LoadGDPRDateRequested = '[Data Protection Declaration] Load GDPR Date Request',
    LoadGDPRDate = '[Data Protection Declaration] Load GDPR Date'
}

export class LoadGDPRDateRequested implements Action {
    readonly type = ContentActionTypes.LoadGDPRDateRequested;
}

export class LoadGDPRDate implements Action {
    readonly type = ContentActionTypes.LoadGDPRDate;

    constructor(public payload: { gdprDate: string }) {}
}

export type ContentActions =
    LoadGDPRDateRequested
    | LoadGDPRDate;
