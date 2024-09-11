import {
    Component,
    ElementRef,
    ViewChild,
    Output,
    EventEmitter,
} from "@angular/core";
import { MatLegacyMenuTrigger as MatMenuTrigger } from "@angular/material/legacy-menu";
import { Action } from "@ngrx/store";
import { Position } from "../../../data.model";
import { MenuItemData } from "../../menu-item-data.model";
import { Utils } from "../../../util/ui-utils";

@Component({
    selector: "fcl-context-menu-view",
    templateUrl: "./context-menu-view.component.html",
})
export class ContextMenuViewComponent {
    @ViewChild("graphMenuTrigger", { static: true })
    graphMenuTrigger: MatMenuTrigger;
    @ViewChild("graphMenuTrigger", { read: ElementRef, static: true })
    graphMenuTriggerElement: ElementRef;

    @Output() itemSelected = new EventEmitter<Action>();

    open(pos: Position, menuData: MenuItemData[]): void {
        this.graphMenuTrigger.menuData = { menuItems: menuData };
        Utils.openMenu(
            this.graphMenuTrigger,
            this.graphMenuTriggerElement,
            pos,
        );
    }

    onItemSelected(action: Action) {
        this.itemSelected.emit(action);
    }
}
