import { Component, OnDestroy, OnInit } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { ActivatedRoute, NavigationStart, Router } from "@angular/router";

import { UserService } from "../../services/user.service";
import { AlertService } from "../../../shared/services/alert.service";
import { SpinnerLoaderService } from "../../../shared/services/spinner-loader.service";
import { ActivationResponseDTO } from "@app/user/models/user.model";
import { Subscription } from "rxjs";
import { GuardedUnloadDirective } from "@app/shared/container/guarded-unload.directive";
import { filter } from "rxjs/operators";

@Component({
    selector: "fcl-activate-container",
    templateUrl: "./activate-container.component.html",
})
export class ActivateContainerComponent
    extends GuardedUnloadDirective
    implements OnInit, OnDestroy
{
    tokenValid: boolean;
    appName: string = environment.appName;

    private routerSubscription_: Subscription | undefined;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private userService: UserService,
        private alertService: AlertService,
        private spinnerService: SpinnerLoaderService,
    ) {
        super();
    }

    ngOnInit() {
        const token = this.activatedRoute.snapshot.params["id"];

        this.spinnerService.show();

        this.routerSubscription_ = this.router.events
            .pipe(filter((event) => event instanceof NavigationStart))
            .subscribe((event) => this.replaceHistoryState());

        this.userService.activateAccount(token).subscribe(
            (activationResponse: ActivationResponseDTO) => {
                this.spinnerService.hide();
                const message = "Account activation successful!";
                this.alertService.success(message);
                this.tokenValid = true;
            },
            () => {
                this.spinnerService.hide();
                this.alertService.error("Your account activation failed!");
                this.tokenValid = false;
            },
        );
    }

    ngOnDestroy(): void {
        this.cleanRouterSubscription();
    }

    unloadGuard(): boolean {
        this.replaceHistoryState();
        return true;
    }

    private replaceHistoryState(): void {
        history.replaceState(null, "", "/users/login");
        this.cleanRouterSubscription();
    }

    private cleanRouterSubscription(): void {
        if (this.routerSubscription_) {
            this.routerSubscription_.unsubscribe();
            this.routerSubscription_ = undefined;
        }
    }
}
