import { NgModule } from "@angular/core";
import { Routes, RouterModule, mapToCanDeactivate } from "@angular/router";
import { GraphEditorContainerComponent } from "./container/graph-editor-container/graph-editor-container.component";
import { CanDeactivateGraphEditorGuard } from "./services/can-deactivate.guard";

const graphEditorRoutes: Routes = [
    {
        path: "graph-editor",
        component: GraphEditorContainerComponent,
        canDeactivate: mapToCanDeactivate([CanDeactivateGraphEditorGuard]),
    },
];

@NgModule({
    imports: [RouterModule.forChild(graphEditorRoutes)],
    exports: [RouterModule],
})
export class GraphEditorRoutingModule {}
