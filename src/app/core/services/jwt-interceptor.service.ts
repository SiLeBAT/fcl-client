import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AlertService } from '../../shared/services/alert.service';
import * as fromUser from './../../user/state/user.reducer';
import * as userActions from './../../user/state/user.actions';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private alertService: AlertService,
                private store: Store<fromUser.State>) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((errorResponse: Error) => {
                if (errorResponse instanceof HttpErrorResponse) {
                    if ((errorResponse.status === 401) || (errorResponse.status === 500)) {
                        this.alertService.error(
                            `Not authorized or not activated.
                            If already registered please check your Email for an activation link.`
                        );
                        this.store.dispatch(new userActions.LogoutUser());
                    }
                }
                throw HttpErrorResponse;
            })
        );
    }
}
