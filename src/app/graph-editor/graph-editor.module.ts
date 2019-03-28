import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphEditorComponent } from './presentation/graph-editor/graph-editor.component';
import { GraphEditorContainerComponent } from './container/graph-editor-container/graph-editor-container.component';
import { GraphEditorRoutingModule } from './graph-editor.routing.module';

@NgModule({
    imports: [
        CommonModule,
        GraphEditorRoutingModule
    ],
    declarations: [
        GraphEditorComponent,
        GraphEditorContainerComponent
    ],
    exports: [
    ]
})
export class GraphEditorModule { }
