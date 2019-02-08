import { Component, OnInit, OnDestroy } from '@angular/core';
import { VisioReport } from '../../../visio/layout-engine/datatypes';
import * as fromTracing from '../../../state/tracing.reducers';
import { Store, select } from '@ngrx/store';
import { VisioToMxGraphService } from '../../services/visio-to-mxgraph.service';
import { takeWhile } from 'rxjs/operators';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'app-graph-editor-container',
    template: '<app-graph-editor [graph]="graph"></app-graph-editor>'
})
export class GraphEditorContainerComponent implements OnInit, OnDestroy {
    graph: mxGraph;
    private componentActive = true;

    constructor(private store: Store<fromTracing.State>, private converter: VisioToMxGraphService) {}

    ngOnInit() {
        this.store
            .pipe(
                select(fromTracing.getVisioReport),
                takeWhile(() => this.componentActive)
            )
            .subscribe((visioReport: VisioReport) => {
                this.graph = visioReport ? this.converter.createGraph(visioReport) : null;
            });
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
