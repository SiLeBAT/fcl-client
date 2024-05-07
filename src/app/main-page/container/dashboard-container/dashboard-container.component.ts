import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as fromMainPage from '../../state/main-page.reducer';
import * as mainPageActions from '../../state/main-page.actions';
import { Store, select } from '@ngrx/store';
import * as fromUser from '../../../user/state/user.reducer';
import * as userActions from '../../../user/state/user.actions';
import { TokenizedUser, TokenizedUserDTO } from '../../../user/models/user.model';
import { map, filter, exhaustMap, take, takeWhile } from 'rxjs/operators';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Observable, EMPTY } from 'rxjs';
import { UserService } from '../../../user/services/user.service';
import { isNotNullish } from '@app/tracing/util/non-ui-utils';

@Component({
    selector: 'fcl-dashboard-container',
    templateUrl: './dashboard-container.component.html'
})
export class DashboardContainerComponent implements OnInit, OnDestroy {
    private componentActive: boolean = true;

    constructor(
        private router: Router,
        private store: Store<fromMainPage.MainPageState>,
        public dialog: MatDialog,
        private userService: UserService
    ) {
        this.store.dispatch(new mainPageActions.DashboardActivated({ isActivated: true }));
    }

    ngOnInit() {

        const currentUser$: Observable<TokenizedUser> = this.store.pipe(select(fromUser.getCurrentUser)).pipe(
            filter(isNotNullish),
            filter(currentUser => currentUser.gdprAgreementRequested),
            take(1),
            takeWhile(() => this.componentActive)
        );

        currentUser$.pipe(
            takeWhile(() => this.componentActive),
            exhaustMap((currentUser: TokenizedUser) => this.userService.openGDPRDialog().pipe(
                takeWhile(() => this.componentActive),
                exhaustMap((gdprConfirmed: boolean) => {
                    if (gdprConfirmed) {
                        return this.userService.updateGDPRAgreement({
                            email: currentUser.email,
                            token: currentUser.token,
                            gdprConfirmed: gdprConfirmed
                        }).pipe(
                            takeWhile(() => this.componentActive),
                            map((mapResult: TokenizedUserDTO) => {
                                this.userService.setCurrentUser(mapResult);
                                this.store.dispatch(new userActions.UpdateUserSOA({ currentUser: mapResult }));
                            }),
                            take(1)
                        );
                    } else {
                        this.store.dispatch(new userActions.LogoutUserMSA());
                        return EMPTY;
                    }
                }),
                take(1)
            )),
            take(1)
        ).subscribe();

    }

    onTracingView() {
        this.router.navigate(['/tracing']).catch(err => {
            throw new Error(`Unable to navigate: ${err}`);
        });

    }

    ngOnDestroy() {
        this.componentActive = false;
        this.store.dispatch(new mainPageActions.DashboardActivated({ isActivated: false }));
    }
}
