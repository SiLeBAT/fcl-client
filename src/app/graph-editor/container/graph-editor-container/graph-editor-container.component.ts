import { DialogService } from './../../services/dialog.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { VisioReport } from '../../../tracing/visio/layout-engine/datatypes';
import * as fromTracing from '../../../tracing/state/tracing.reducers';
import * as TracingSelectors from '../../../tracing/state/tracing.selectors';
import { Store, select } from '@ngrx/store';
import { VisioToMxGraphService } from '../../services/visio-to-mxgraph.service';
import { takeWhile, filter } from 'rxjs/operators';
import { GuardedUnloadComponent } from '../../../shared/container/guarded-unload.component';
import { Router, Event as NavigationEvent, NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
    selector: 'fcl-graph-editor-container',
    templateUrl: './graph-editor-container.component.html',
    styleUrls: ['./graph-editor-container.component.scss']

})
export class GraphEditorContainerComponent extends GuardedUnloadComponent implements OnInit, OnDestroy {
    graph: mxGraph;
    private componentActive = true;
    private isPopstate: boolean = false;

    constructor(
        private store: Store<fromTracing.State>,
        private converter: VisioToMxGraphService,
        private router: Router,
        private dialogService: DialogService
    ) {
        super();

        router.events
            .pipe(
                filter((event: NavigationEvent) => {
                    return (event instanceof NavigationStart);
                }),
                takeWhile(() => this.componentActive)
            )
            .subscribe(
                (event: NavigationStart) => this.isPopstate = (event.navigationTrigger === 'popstate'),
                (error) => {
                    throw new Error(`cannot catch router event: ${error}`);
                }
            );
    }

    ngOnInit() {
        this.store.pipe(
          select(TracingSelectors.getVisioReport),
          takeWhile(() => this.componentActive)
        ).subscribe(
            (visioReport: VisioReport) => {
                this.graph = visioReport ? this.converter.createGraph(visioReport) : null;
            },
            (error) => {
                throw new Error(`error loading ROA style report: ${error}`);
            }
        );
    }

    unloadGuard(): boolean {
        return false;
    }

    canDeactivate(): Observable<boolean> {
        const message = 'Leave Site? \nChanges you made may not be saved.';
        return this.dialogService.confirm(message);
    }

    routerEventIsPopstate() {
        return this.isPopstate;
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
