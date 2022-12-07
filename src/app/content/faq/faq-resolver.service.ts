import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Resolve } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { EMPTY, Observable } from 'rxjs';
import { Faq } from './faq.model';
import { FaqService } from './faq.service';
import { AlertService } from '@app/shared/services/alert.service';

@Injectable({
    providedIn: 'root'
})
export class FaqResolverService implements Resolve<Faq> {

    constructor(
        private faqService: FaqService,
        private alertService: AlertService
    ) { }

    resolve(_activatedRoute: ActivatedRouteSnapshot, _snap: RouterStateSnapshot): Observable<Faq> {
        return this.faqService.getFaq().pipe(
            catchError((error) => {
                this.alertService.error(error);
                return EMPTY;
            })
        );
    }
}
