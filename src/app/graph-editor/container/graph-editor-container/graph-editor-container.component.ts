import { Component, OnInit } from '@angular/core';
import { VisioReport } from '../../../visio/layout-engine/datatypes';
import * as fromTracing from '../../../state/tracing.reducers';
import { Store, select } from '@ngrx/store';
import { VisioToMxGraphService } from '../../services/visio-to-mxgraph.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'app-graph-editor-container',
    template: '<app-graph-editor [graph]="graph"></app-graph-editor>'
})
export class GraphEditorContainerComponent implements OnInit {
    graph: mxGraph;

    constructor(private store: Store<fromTracing.State>,
                private converter: VisioToMxGraphService) { }

    ngOnInit() {
        this.store.pipe(
          select(fromTracing.getVisioReport)
        ).subscribe(
          (visioReport: VisioReport) => {
              this.graph = this.converter.createGraph(visioReport);
          }
        );
    }
}
