import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { VisioReport } from '../../../tracing/visio/layout-engine/datatypes';
import * as fromTracing from '../../../tracing/state/tracing.reducers';
import * as TracingSelectors from '../../../tracing/state/tracing.selectors';
import { Store, select } from '@ngrx/store';
import { VisioToMxGraphService } from '../../services/visio-to-mxgraph.service';
import { takeWhile } from 'rxjs/operators';
import { GuardedUnloadDirective } from '../../../shared/container/guarded-unload.directive';
import { Observable } from 'rxjs';
import { GraphEditorComponent } from '@app/graph-editor/presentation/graph-editor/graph-editor.component';

@Component({
    selector: 'fcl-graph-editor-container',
    templateUrl: './graph-editor-container.component.html',
    styleUrls: ['./graph-editor-container.component.scss']

})
export class GraphEditorContainerComponent extends GuardedUnloadDirective implements OnInit, OnDestroy {

    @ViewChild(GraphEditorComponent, { static: true }) graphEditorComponent;

    graph: mxGraph | null = null;
    private componentActive = true;

    constructor(
        private store: Store<fromTracing.State>,
        private converter: VisioToMxGraphService
    ) {
        super();
    }

    ngOnInit() {
        this.store.pipe(
            select(TracingSelectors.getVisioReport),
            takeWhile(() => this.componentActive)
        ).subscribe(
            (visioReport: VisioReport | null) => {
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
        return this.graphEditorComponent.canDeactivate();
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
