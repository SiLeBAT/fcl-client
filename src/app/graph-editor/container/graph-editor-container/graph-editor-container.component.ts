import { Component, OnInit, OnDestroy } from '@angular/core';
import { VisioReport } from '../../../tracing/visio/layout-engine/datatypes';
import * as fromTracing from '../../../tracing/state/tracing.reducers';
import { Store, select } from '@ngrx/store';
import { VisioToMxGraphService } from '../../services/visio-to-mxgraph.service';
import { takeWhile } from 'rxjs/operators';

@Component({
    selector: 'fcl-graph-editor-container',
    templateUrl: './graph-editor-container.component.html',
    styleUrls: ['./graph-editor-container.component.scss']

})
export class GraphEditorContainerComponent implements OnInit, OnDestroy {
    graph: mxGraph;
    private componentActive = true;

    constructor(private store: Store<fromTracing.State>,
                private converter: VisioToMxGraphService) { }

    ngOnInit() {
        this.store.pipe(
          select(fromTracing.getVisioReport),
          takeWhile(() => this.componentActive)
        ).subscribe(
            (visioReport: VisioReport) => {
                this.graph = visioReport ? this.converter.createGraph(visioReport) : null;
            }
        );
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
