import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';

import * as tracingActions from './tracing.actions';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { generateVisioReport } from '../visio/visio.service';
import { VisioReport } from '../visio/layout-engine/datatypes';

@Injectable()
export class TracingEffects {

    constructor(private actions$: Actions,
      private router: Router
    ) { }

    @Effect()
    generateVisioLayout$ = this.actions$.pipe(
        ofType(tracingActions.TracingActionTypes.GenerateVisioLayout),
      map((action: tracingActions.GenerateVisioLayout) => {
          const visioReport: VisioReport = generateVisioReport(action.payload);
          this.router.navigate(['/graph-editor']).catch(err => {
              throw new Error(`Unable to navigate to graph editor: ${err}`);
          });
          return new tracingActions.GenerateVisioLayoutSuccess(visioReport);
      })
    );
}
