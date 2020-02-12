import { Component, ElementRef, OnInit, ViewChild, OnDestroy, QueryList, ViewChildren, ContentChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { SchemaGraphComponent } from '../graph/components/schema-graph.component';
import { TableComponent } from './table.component';
import { GraphType } from '../data.model';
import { GisGraphComponent } from '../graph/components/gis-graph.component';
import { environment } from '../../../environments/environment';
import { MainPageService } from '../../main-page/services/main-page.service';
import { NodeLayoutInfo } from '../visio/layout-engine/datatypes';
import { Store } from '@ngrx/store';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingSelectors from '../state/tracing.selectors';
import * as tracingActions from '../state/tracing.actions';
import { map, first } from 'rxjs/operators';
import * as visioActions from '@app/tracing/visio/visio.actions';
import * as ioActions from '@app/tracing/io/io.actions';
import { Subscription } from 'rxjs';
import { AlertService } from '@app/shared/services/alert.service';
import { Cy } from '../graph/graph.model';

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
    @ViewChild('table', { static: true }) table: TableComponent;
    @ViewChild('rightSidenav', { static: true }) rightSidenav: MatSidenav;
    @ViewChild('rightSidenav', { read: ElementRef, static: true }) rightSidenavElement: ElementRef;
    @ViewChild('sidenavSlider', { static: true }) sidenavSlider: ElementRef;

    appName: string = environment.appName;
    private subscriptions: Subscription[] = [];

    graphType$ = this.store.select(tracingSelectors.getGraphType);
    showGisGraph$ = this.graphType$.pipe(map(graphType => graphType === GraphType.GIS));
    showSchemaGraph$ = this.graphType$.pipe(map(graphType => graphType === GraphType.GRAPH));

    showGraphSettings$ = this.store.select(tracingSelectors.getShowGraphSettings);
    showDataTable$ = this.store.select(tracingSelectors.getShowDataTable);

    private componentActive = true;

    constructor(
        private alertService: AlertService,
        private router: Router,
        private mainPageService: MainPageService,
        private store: Store<fromTracing.State>
    ) {
        document.body.oncontextmenu = e => e.preventDefault();
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
            this.mainPageService.doVisioLayout.subscribe(
                () => this.onVisioLayout(),
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

        const hammer = new Hammer.Manager(this.sidenavSlider.nativeElement, { recognizers: [[Hammer.Pan]] });
        hammer.on('pan', event => {
            const newWidth = 1 - event.center.x / (this.mainContainer.nativeElement as HTMLElement).offsetWidth;

            if (newWidth > 0 && newWidth < 1) {
                this.changeDataTableWidth(newWidth);
            }
        });
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

    getNodeLayoutInfo(): Promise<Map<string, NodeLayoutInfo>> {
        return this.getCurrentGraph().then(
            currentGraph => {
                const view = currentGraph;

                if (view !== null && view.hasOwnProperty('cy') && (view as any).cy !== null) {
                    const result: Map<string, NodeLayoutInfo> = new Map();

                    ((view as any).cy as Cy).nodes().forEach(node => {
                        const position = node.position();
                        result.set(node.data().station.id, {
                            size: node.height(),
                            position: {
                                x: position.x,
                                y: position.y
                            }
                        });
                    });
                    return result;
                } else {
                    return null;
                }
            }
        ).catch((err) => {
            throw new Error(`Unable to retrieve node layout info: ${err}`);
        });
    }

    onVisioLayout() {
        this.getNodeLayoutInfo().then(
            nodeLayoutInfo => this.store.dispatch(new visioActions.GenerateVisioReportMSA({ nodeLayoutInfo: nodeLayoutInfo }))
        ).catch((err) => {
            throw new Error(`Roa report creation failed: ${err}`);
        });
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
