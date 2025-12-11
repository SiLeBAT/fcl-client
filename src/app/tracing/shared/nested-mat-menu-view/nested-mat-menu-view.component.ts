import { Component, ViewChild, EventEmitter, Output } from "@angular/core";
import { MatLegacyMenu as MatMenu } from "@angular/material/legacy-menu";
import { MenuItemData } from "../menu-item-data.model";
import { Action } from "@ngrx/store";

function isMenuItemGroupArray(
    items: MenuItemData[] | MenuItemData[][],
): items is MenuItemData[][] {
    if (items.length === 0) {
        return false;
    }
    return Array.isArray(items[0]);
}

@Component({
    selector: "fcl-nested-mat-menu-view",
    templateUrl: "./nested-mat-menu-view.component.html",
})
export class NestedMatMenuViewComponent {
    @ViewChild("menu", { static: true }) matMenu: MatMenu;
    @Output() actionSelected = new EventEmitter<Action>();

    itemSelected(item: MenuItemData) {
        if (item.action) {
            this.actionSelected.emit(item.action);
        }
    }

    forwardAction(action: Action) {
        this.actionSelected.emit(action);
    }

    enforceGroups(items: MenuItemData[] | MenuItemData[][]): MenuItemData[][] {
        if (isMenuItemGroupArray(items)) {
            return items;
        }
        return [items];
    }
}
