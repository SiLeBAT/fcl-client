import {
    Component,
    ElementRef,
    ViewChild,
    Output,
    EventEmitter,
    OnDestroy,
    ChangeDetectionStrategy,
} from "@angular/core";
import { MatLegacyMenuTrigger as MatMenuTrigger } from "@angular/material/legacy-menu";
import { Action } from "@ngrx/store";
import { Subscription } from "rxjs";
import { Position } from "../../data.model";
import { MenuItemData } from "../menu-item-data.model";
import { Utils } from "../../util/ui-utils";

@Component({
    selector: "fcl-context-menu-view",
    templateUrl: "./context-menu-view.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuViewComponent implements OnDestroy {
    @ViewChild("graphMenuTrigger", { static: true })
    graphMenuTrigger: MatMenuTrigger;
    @ViewChild("graphMenuTrigger", { read: ElementRef, static: true })
    graphMenuTriggerElement: ElementRef;

    @Output() itemSelected = new EventEmitter<Action>();

    get isOpen(): boolean {
        return this.graphMenuTrigger.menuOpen;
    }

    private menuClosedSubscription_: Subscription | undefined;

    ngOnDestroy(): void {
        this.cleanSubscription();
    }

    open(
        pos: Position,
        menuData: MenuItemData[],
        onClosedCallback?: () => void,
    ): void {
        this.graphMenuTrigger.menuData = { menuItems: menuData };
        if (onClosedCallback) {
            this.menuClosedSubscription_ =
                this.graphMenuTrigger.menuClosed.subscribe(() => {
                    this.cleanSubscription();
                    onClosedCallback();
                });
        }
        Utils.openMenu(
            this.graphMenuTrigger,
            this.graphMenuTriggerElement,
            pos,
        );
    }

    onItemSelected(action: Action) {
        this.itemSelected.emit(action);
    }

    private cleanSubscription(): void {
        if (this.menuClosedSubscription_) {
            this.menuClosedSubscription_.unsubscribe();
            this.menuClosedSubscription_ = undefined;
        }
    }
}
