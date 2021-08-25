import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AlertService } from '../../shared/services/alert.service';
import * as fromUser from './../../user/state/user.reducer';
import * as userActions from './../../user/state/user.actions';
import {
    HTML_ERROR_CODE_INTERNAL_SERVER_ERROR,
    HTML_ERROR_CODE_UNAUTHORIZED,
    HTML_ERROR_CODE_UNPROCESSABLE_ENTITY
} from '../html-error-codes.constants';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private alertService: AlertService,
                private store: Store<fromUser.State>) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((errorResponse: Error) => {
                if (errorResponse instanceof HttpErrorResponse) {
                    if (
                        (errorResponse.status === HTML_ERROR_CODE_UNAUTHORIZED) ||
                        (errorResponse.status === HTML_ERROR_CODE_INTERNAL_SERVER_ERROR)
                    ) {
                        this.alertService.error(
                            `Not authorized or not activated.
                            If already registered please check your Email for an activation link.`
                        );
                        this.store.dispatch(new userActions.LogoutUserMSA());
                    } else if (errorResponse.status === HTML_ERROR_CODE_UNPROCESSABLE_ENTITY) {
                        throw(errorResponse);
                    }
                }
                throw HttpErrorResponse;
            })
        );
    }
}
