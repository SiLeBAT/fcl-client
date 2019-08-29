import { Injectable }    from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable }    from 'rxjs';
import { GraphEditorContainerComponent } from '../container/graph-editor-container/graph-editor-container.component';

export interface CanComponentDeactivate {
    canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CanDeactivateGraphEditorGuard implements CanDeactivate<GraphEditorContainerComponent> {

    canDeactivate(component: GraphEditorContainerComponent): Observable<boolean> | boolean {
        return (component.routerEventIsPopstate() ? component.canDeactivate() : true);
    }
}
