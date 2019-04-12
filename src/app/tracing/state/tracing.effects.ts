import { Observable } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AlertService } from '../../shared/services/alert.service';

import * as tracingActions from './tracing.actions';
import { map, catchError, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DataService } from '../services/data.service';
import { FclData } from '../util/datatypes';

@Injectable()
export class TracingEffects {

    constructor(private actions$: Actions,
        private dataService: DataService,
                private alertService: AlertService
    ) { }

    @Effect()
    loadFclData$ = this.actions$.pipe(
        ofType<tracingActions.LoadFclData>(tracingActions.TracingActionTypes.LoadFclData),
        mergeMap((action) => {
            const file: File = action.payload;
            if (file) {
                this.dataService.setDataSource(file);
            }
            return Observable.fromPromise(this.dataService.getData()).pipe(
                map((data: FclData) => (new tracingActions.LoadFclDataSuccess(data))),
                catchError(() => of(this.alertService.error('error loading FCL data')))
            );
        })
    );
}
