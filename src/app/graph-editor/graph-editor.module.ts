import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GraphEditorComponent } from "./presentation/graph-editor/graph-editor.component";
import { GraphEditorContainerComponent } from "./container/graph-editor-container/graph-editor-container.component";
import { GraphEditorRoutingModule } from "./graph-editor.routing.module";
import { StoreModule } from "@ngrx/store";
import { STATE_SLICE_NAME, reducer } from "./state/graph-editor.reducer";

@NgModule({
    imports: [
        CommonModule,
        GraphEditorRoutingModule,
        StoreModule.forFeature(STATE_SLICE_NAME, reducer),
    ],
    declarations: [GraphEditorComponent, GraphEditorContainerComponent],
    exports: [],
})
export class GraphEditorModule {}
