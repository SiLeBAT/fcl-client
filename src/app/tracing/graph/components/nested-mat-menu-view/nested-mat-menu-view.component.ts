import { Component, ViewChild, EventEmitter, Output } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { MenuItemData } from '../../menu-item-data.model';
import { Action } from '@ngrx/store';

@Component({
    selector: 'fcl-nested-mat-menu-view',
    templateUrl: './nested-mat-menu-view.component.html'
})
export class NestedMatMenuViewComponent {

    @ViewChild('menu', { static: true }) matMenu: MatMenu;
    @Output() actionSelected = new EventEmitter<Action>();

    itemSelected(item: MenuItemData) {
        if (item.action) {
            this.actionSelected.emit(item.action);
        }
    }

    forwardAction(action: Action) {
        this.actionSelected.emit(action);
    }
}
