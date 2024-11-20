import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";

import { SpinnerLoaderService } from "../services/spinner-loader.service";

export interface LoaderState {
    show: boolean;
}

@Component({
    selector: "fcl-spinner-loader",
    templateUrl: "spinner-loader.component.html",
    styleUrls: ["spinner-loader.component.scss"],
})
export class SpinnerLoaderComponent implements OnInit, OnDestroy {
    show = false;

    private subscription: Subscription;

    constructor(private spinnerService: SpinnerLoaderService) {}

    ngOnInit() {
        this.subscription = this.spinnerService.loaderState.subscribe(
            (state: LoaderState) => {
                this.show = state.show;
            },
            (error) => {
                throw new Error(`error loading spinner: ${error}`);
            },
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
