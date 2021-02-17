import { Component, ElementRef, OnInit, ViewChild, OnDestroy, QueryList, ViewChildren, ContentChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { SchemaGraphComponent } from '../graph/components/schema-graph-old/schema-graph.component';
import { GraphType } from '../data.model';
import { GisGraphComponent } from '../graph/components/gis-graph/gis-graph.component';
import { environment } from '../../../environments/environment';
import { MainPageService } from '../../main-page/services/main-page.service';
import { Store } from '@ngrx/store';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingSelectors from '../state/tracing.selectors';
import * as tracingActions from '../state/tracing.actions';
import { map, first } from 'rxjs/operators';
import * as roaActions from '@app/tracing/visio/visio.actions';
import * as ioActions from '@app/tracing/io/io.actions';
import { Subscription } from 'rxjs';
import { AlertService } from '@app/shared/services/alert.service';

@Component({
    selector: 'fcl-main-tracing',
    templateUrl: './main-tracing.component.html',
    styleUrls: ['./main-tracing.component.scss']
})
export class MainTracingComponent implements OnInit, OnDestroy {
    @ViewChildren(SchemaGraphComponent) schemaGraphChildren: QueryList<SchemaGraphComponent>;
    @ViewChildren(GisGraphComponent) gisGraphChildren: QueryList<GisGraphComponent>;
    @ContentChild(SchemaGraphComponent, { static: true }) schemaGraphContentChild: SchemaGraphComponent;
    @ContentChild(GisGraphComponent, { static: true }) gisGraphContentChild: GisGraphComponent;

    @ViewChild('mainContainer', { read: ElementRef, static: true }) mainContainer: ElementRef;
    @ViewChild('schemaGraph', { static: true }) schemaGraph: SchemaGraphComponent;
    @ViewChild('gisGraph', { static: true }) gisGraph: GisGraphComponent;
    @ViewChild('rightSidenav', { static: true }) rightSidenav: MatSidenav;
    @ViewChild('rightSidenav', { read: ElementRef, static: true }) rightSidenavElement: ElementRef;
    @ViewChild('sidenavSlider', { static: true }) sidenavSlider: ElementRef;

    appName: string = environment.appName;
    private subscriptions: Subscription[] = [];

    graphType$ = this.store.select(tracingSelectors.getGraphType);
    showGisGraph$ = this.graphType$.pipe(map(graphType => graphType === GraphType.GIS));
    showSchemaGraph$ = this.graphType$.pipe(map(graphType => graphType === GraphType.GRAPH));

    showConfigurationSideBar$ = this.store.select(tracingSelectors.getShowConfigurationSideBar);

    private componentActive = true;

    constructor(
        private alertService: AlertService,
        private router: Router,
        private mainPageService: MainPageService,
        private store: Store<fromTracing.State>
    ) {
        this.store.dispatch(new tracingActions.TracingActivated({ isActivated: true }));
    }

    ngOnInit() {
        this.subscriptions.push(
            this.mainPageService.doSaveImage.subscribe(
                () => this.onSaveImage(),
                error => {
                    throw new Error(`error saving image: ${error}`);
                }
            )
        );
        this.subscriptions.push(
            this.mainPageService.doROALayout.subscribe(
                () => this.onROALayout(),
                error => {
                    throw new Error(`error creating ROA style: ${error}`);
                }
            )
        );
        this.subscriptions.push(
            this.mainPageService.doOnSave.subscribe(
                () => this.onSave(),
                error => {
                    throw new Error(`error saving: ${error}`);
                }
            )
        );

    }

    private changeDataTableWidth(newWidth: number) {
        (this.rightSidenavElement.nativeElement as HTMLElement).style.width = (newWidth * 100) + '%';
    }

    onHome() {
        this.router.navigate(['/']).catch(err => {
            throw new Error(`Unable to navigate: ${err}`);
        });
    }

    onSave() {
        this.store.dispatch(new ioActions.SaveFclDataMSA({}));
    }

    onSaveImage() {
        this.getCurrentGraph()
            .then(currentGraph => {
                return currentGraph.getCanvas();
            })
            .then(canvas => {
                this.store.dispatch(new ioActions.SaveGraphImageMSA({ canvas: canvas }));
            })
            .catch((err) => this.alertService.error(`Unable to save image: ${err}`));
    }

    onROALayout() {
        this.store.dispatch(new roaActions.OpenROAReportConfigurationMSA());
    }

    ngOnDestroy() {

        this.store.dispatch(new tracingActions.TracingActivated({ isActivated: false }));
        _.forEach(this.subscriptions, subscription => subscription.unsubscribe());

        this.componentActive = false;
    }

    private getCurrentGraph(): Promise<SchemaGraphComponent | GisGraphComponent> {
        return this.graphType$.pipe(
            map(graphType => {
                return (
                    graphType === GraphType.GRAPH ?
                    this.schemaGraphChildren.first || this.schemaGraphContentChild :
                    this.gisGraphChildren.first || this.gisGraphContentChild
                );
            }),
            first()
        ).toPromise();
    }
}
