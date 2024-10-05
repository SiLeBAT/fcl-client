import { inject } from "@angular/core";
import {
    ActivatedRouteSnapshot,
    ResolveFn,
    RouterStateSnapshot,
} from "@angular/router";
import { catchError } from "rxjs/operators";
import { EMPTY } from "rxjs";
import { Faq } from "./faq.model";
import { FaqService } from "./faq.service";
import { AlertService } from "@app/shared/services/alert.service";

export const FaqResolverFn: ResolveFn<Faq> = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    const faqService = inject(FaqService);
    const alertService = inject(AlertService);

    return faqService.getFaq().pipe(
        catchError((error) => {
            alertService.error(error);
            return EMPTY;
        }),
    );
};
