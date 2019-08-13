import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AlertService } from '../../shared/services/alert.service';

import * as visioActions from './visio.actions';
import * as tracingStoreActions from './../state/tracing.actions';
import * as fromTracing from './../state/tracing.reducers';
import * as tracingSelectors from './../state/tracing.selectors';

import { map, catchError, mergeMap, withLatestFrom } from 'rxjs/operators';
import { from, EMPTY } from 'rxjs';
import { DataService } from '../services/data.service';
import { Store, select } from '@ngrx/store';
import { generateVisioReport } from './visio.service';
import { Router } from '@angular/router';

@Injectable()
export class VisioEffects {
    constructor(
        private actions$: Actions,
        private alertService: AlertService,
        private store: Store<fromTracing.State>,
        private dataService: DataService,
        private router: Router
    ) {}

    @Effect()
    generateVisioReport$ = this.actions$.pipe(
        ofType<visioActions.GenerateVisioReportMSA>(visioActions.VisioActionTypes.GenerateVisioReport),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getBasicGraphData))),
        mergeMap(([action, state]) => {
            const data = this.dataService.getData(state);
            const nodeLayoutInfo = action.payload.nodeLayoutInfo;
            return from(generateVisioReport(
                {
                    ...data,
                    samples: state.fclElements.samples
                },
                nodeLayoutInfo
            )).pipe(
                catchError((error) => {
                    this.alertService.error(`Visio layout creation failed!, error: ${error}`);
                    return EMPTY;
                })
            );
        }),
        map(
            visioReport => {
                if (visioReport !== null) {
                    this.router.navigate(['/graph-editor']).catch(err => {
                        this.alertService.error(`Unable to navigate to graph editor: ${err}`);
                    });
                    return new tracingStoreActions.GenerateVisioLayoutSuccess(visioReport);
                } else {
                    return EMPTY;
                }
            }
        )
    );
}
