import { Injectable, OnDestroy } from "@angular/core";
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { AlertService } from "../../shared/services/alert.service";
import { Store, select } from "@ngrx/store";
import * as fromUser from "../state/user.reducer";
import * as userActions from "../state/user.actions";
import { TokenizedUser } from "../models/user.model";
import { JwtHelperService } from "@auth0/angular-jwt";
import { map, takeWhile } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class AuthGuard  implements OnDestroy {
    private componentActive: boolean = true;

    constructor(
        private alertService: AlertService,
        private router: Router,
        private store: Store<fromUser.State>,
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.store
            .pipe(
                select(fromUser.getCurrentUser),
                takeWhile(() => this.componentActive),
            )
            .pipe(
                map((currentUser: TokenizedUser | null) => {
                    if (currentUser) {
                        const helper = new JwtHelperService();
                        const isExpired = helper.isTokenExpired(
                            currentUser.token,
                        );

                        if (isExpired) {
                            this.alertService.error(
                                "Not authorized, please login.",
                            );
                            this.store.dispatch(
                                new userActions.LogoutUserMSA(),
                            );
                        }
                        return !isExpired;
                    }
                    return false;
                }),
            );
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
