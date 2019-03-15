import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AlertService } from './alert.service';
import * as fromUser from './../../user/state/user.reducer';
import * as userActions from './../../user/state/user.actions';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private router: Router,
                private alertService: AlertService,
                private store: Store<fromUser.State>) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            tap(
                (event: HttpEvent<any>) => {
                    // doing nothing
                },
                (err: any) => {
                    if (err instanceof HttpErrorResponse) {
                        if (err.status === 401) {
                            this.alertService.error(
                                ` Nicht authorisiert oder nicht aktiviert.
                                Wenn bereits registriert, überprüfen Sie bitte Ihre Email auf einen Aktivierungslink.`
                            );
                            this.store.dispatch(new userActions.LogoutUser());
                        }
                    }
                }
            )
        );
    }
}
