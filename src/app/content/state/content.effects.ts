import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';

import * as contentActions from './content.actions';
import * as fromContent from './content.reducer';

import {map, exhaustMap, withLatestFrom, filter} from 'rxjs/operators';
import {ContentService} from '../services/content.service';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';

@Injectable()
export class ContentEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<fromContent.ContentState>,
    private contentService: ContentService
  ) {}

  loadGDPRDateRequested: Observable<contentActions.UpdateGDPRDateSOA> =
    createEffect(() =>
      this.actions$.pipe(
        ofType(contentActions.ContentActionTypes.LoadGDPRDateSSA),
        withLatestFrom(this.store$.select(fromContent.getGDPRDate)),
        filter(([_, loaded]) => loaded === ''),
        exhaustMap(() =>
          this.contentService
            .getGDPRDate()
            .pipe(
              map(
                (gdprDate: string) =>
                  new contentActions.UpdateGDPRDateSOA({gdprDate: gdprDate})
              )
            )
        )
      )
    );
}
