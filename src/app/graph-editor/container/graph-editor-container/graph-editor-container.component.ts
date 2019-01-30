import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VisioReport } from '../../../visio/layout-engine/datatypes';
import * as fromTracing from '../../../state/tracing.reducers';
import { Store, select } from '@ngrx/store';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'app-graph-editor-container',
    template: '<app-graph-editor [visioReport]="visioReport"></app-graph-editor>'
})
export class GraphEditorContainerComponent implements OnInit {
    visioReport: VisioReport;

    constructor(private store: Store<fromTracing.State>) { }

    // input JSON or XML from webapp
    ngOnInit() {
        this.store.pipe(
          select(fromTracing.getVisioReport)
        ).subscribe(
          (visioReport: VisioReport) => {
              if (visioReport) {
                  this.visioReport = visioReport;
              }
          }
        );

        if (this.visioReport) {
            this.start();
        }

      // console.log('GraphEditorContainerComponent, ngOnInit, this.visioReport: ', this.visioReport);
    }

    private start() {
        // console.log('GraphEditorContainer, start() entered');
    }
}
