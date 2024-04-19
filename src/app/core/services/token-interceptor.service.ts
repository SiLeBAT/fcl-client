import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>,
        next: HttpHandler): Observable<HttpEvent<any>> {

        const token = this.getToken();

        if (token) {
            req = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(req);
    }

    private getToken() {
        const currentUserJson = localStorage.getItem('currentUser');

        if (currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);

            if (currentUser && currentUser.token) {
                return currentUser.token;
            }
        }

        return null;
    }

}
