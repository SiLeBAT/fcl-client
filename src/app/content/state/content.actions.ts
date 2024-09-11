import {Action} from '@ngrx/store';

export enum ContentActionTypes {
  LoadGDPRDateSSA = '[Data Protection Declaration] Request GDPR Date',
  UpdateGDPRDateSOA = '[Data Protection Declaration] Update GDPR Date',
}

export class LoadGDPRDateSSA implements Action {
  readonly type = ContentActionTypes.LoadGDPRDateSSA;
}

export class UpdateGDPRDateSOA implements Action {
  readonly type = ContentActionTypes.UpdateGDPRDateSOA;

  constructor(public payload: {gdprDate: string}) {}
}

export type ContentActions = LoadGDPRDateSSA | UpdateGDPRDateSOA;
