import {
    Component,
    ElementRef,
    OnInit,
    ViewChild,
    OnDestroy,
} from "@angular/core";
import { MatSidenav } from "@angular/material/sidenav";
import { Router } from "@angular/router";
import * as _ from "lodash";

import { GraphType } from "../data.model";
import { environment } from "../../../environments/environment";
import { MainPageService } from "../../main-page/services/main-page.service";
import { Store } from "@ngrx/store";
import * as fromTracing from "../state/tracing.reducers";
import * as tracingSelectors from "../state/tracing.selectors";
import * as tracingActions from "../state/tracing.actions";
import { map } from "rxjs/operators";
import * as roaActions from "@app/tracing/visio/visio.actions";
import * as ioActions from "@app/tracing/io/io.actions";
import { Subscription } from "rxjs";

@Component({
    selector: "fcl-main-tracing",
    templateUrl: "./main-tracing.component.html",
    styleUrls: ["./main-tracing.component.scss"],
    standalone: false,
})
export class MainTracingComponent implements OnInit, OnDestroy {
    @ViewChild("mainContainer", { read: ElementRef, static: true })
    mainContainer: ElementRef;
    @ViewChild("rightSidenav", { static: true }) rightSidenav: MatSidenav;
    @ViewChild("rightSidenav", { read: ElementRef, static: true })
    rightSidenavElement: ElementRef;
    @ViewChild("sidenavSlider", { static: true }) sidenavSlider: ElementRef;

    appName: string = environment.appName;
    private subscriptions: Subscription[] = [];

    isModelLoaded$ = this.store.select(tracingSelectors.selectIsModelLoaded);
    isModelLoading$ = this.store.select(tracingSelectors.selectIsModelLoading);
    graphType$ = this.store.select(tracingSelectors.selectGraphType);
    showGisGraph$ = this.graphType$.pipe(
        map((graphType) => graphType === GraphType.GIS),
    );
    showSchemaGraph$ = this.graphType$.pipe(
        map((graphType) => graphType === GraphType.GRAPH),
    );

    showConfigurationSideBar$ = this.store.select(
        tracingSelectors.selectShowConfigurationSideBar,
    );

    constructor(
        private router: Router,
        private mainPageService: MainPageService,
        private store: Store<fromTracing.State>,
    ) {
        this.store.dispatch(
            new tracingActions.TracingActivated({ isActivated: true }),
        );
    }

    ngOnInit() {
        this.subscriptions.push(
            this.mainPageService.doSaveImage.subscribe(
                () => this.onSaveImage(),
                (error) => {
                    throw new Error(`error saving image: ${error}`);
                },
            ),
        );
        this.subscriptions.push(
            this.mainPageService.doROALayout.subscribe(
                () => this.onROALayout(),
                (error) => {
                    throw new Error(`error creating ROA style: ${error}`);
                },
            ),
        );
        this.subscriptions.push(
            this.mainPageService.doOnSave.subscribe(
                (fileNameWoExt: string) => this.onSave(fileNameWoExt),
                (error) => {
                    throw new Error(`error saving: ${error}`);
                },
            ),
        );
    }

    onHome() {
        this.router.navigate(["/"]).catch((err) => {
            throw new Error(`Unable to navigate: ${err}`);
        });
    }

    onSave(fileNameWoExt: string) {
        this.store.dispatch(
            new ioActions.SaveFclDataMSA({ fileName: fileNameWoExt }),
        );
    }

    onSaveImage() {
        this.store.dispatch(new ioActions.SaveGraphImageMSA());
    }

    onROALayout() {
        this.store.dispatch(new roaActions.OpenROAReportConfigurationMSA());
    }

    onConfigurationSideBarOpened() {
        this.store.dispatch(
            new tracingActions.SetConfigurationSideBarOpenedSOA(),
        );
    }

    ngOnDestroy() {
        this.store.dispatch(
            new tracingActions.TracingActivated({ isActivated: false }),
        );
        _.forEach(this.subscriptions, (subscription) =>
            subscription.unsubscribe(),
        );
    }
}
