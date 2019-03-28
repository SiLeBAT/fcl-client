
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GraphEditorContainerComponent } from './container/graph-editor-container/graph-editor-container.component';

const graphEditorRoutes: Routes =
    [{
        path: 'graph-editor',
        component: GraphEditorContainerComponent
    }];

@NgModule({
    imports: [
        RouterModule.forChild(graphEditorRoutes)
    ],
    exports: [
        RouterModule
    ]
})

export class GraphEditorRoutingModule {}
