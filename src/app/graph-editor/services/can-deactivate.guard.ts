import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GraphEditorContainerComponent } from "../container/graph-editor-container/graph-editor-container.component";

@Injectable({
    providedIn: "root",
})
export class CanDeactivateGraphEditorGuard {
    canDeactivate(
        component: GraphEditorContainerComponent,
    ): Observable<boolean> | boolean {
        return component.canDeactivate();
    }
}
