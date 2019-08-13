import { Component, OnInit, ViewChild, EventEmitter, Output } from '@angular/core';
import { MatMenu } from '@angular/material';
import { MenuItemData } from '../menu-item-data.model';
import { Action } from '@ngrx/store';

@Component({
    selector: 'fcl-nested-mat-menu',
    templateUrl: './nested-mat-menu.component.html'
})
export class NestedMatMenuComponent implements OnInit {

    @ViewChild('menu') matMenu: MatMenu;
    @Output() actionSelected = new EventEmitter<Action>();

    constructor() { }

    ngOnInit() {
    }

    itemSelected(item: MenuItemData) {
        if (item.action) {
            this.actionSelected.emit(item.action);
        }
    }

    forwardAction(action: Action) {
        this.actionSelected.emit(action);
    }
}
