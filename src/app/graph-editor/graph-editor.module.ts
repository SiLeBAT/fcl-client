import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GraphEditorComponent } from './presentation/graph-editor/graph-editor.component';
import { GraphEditorContainerComponent } from './container/graph-editor-container/graph-editor-container.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([{
            path: 'graph-editor',
            component: GraphEditorContainerComponent
        }])
    ],
    declarations: [
        GraphEditorComponent,
        GraphEditorContainerComponent
    ],
    exports: [
    ]
})
export class GraphEditorModule { }
