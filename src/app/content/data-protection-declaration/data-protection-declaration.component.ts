import { Component, AfterViewInit, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import * as fromContent from "../state/content.reducer";
import * as contentActions from "../state/content.actions";

@Component({
    selector: "fcl-data-protection-declaration",
    templateUrl: "./data-protection-declaration.component.html",
    styleUrls: ["./data-protection-declaration.component.scss"],
})
export class DataProtectionDeclarationComponent
    implements OnInit, AfterViewInit
{
    gdprDate$: Observable<string> = this.store$.select(fromContent.getGDPRDate);

    constructor(private store$: Store<fromContent.ContentState>) {}

    ngOnInit() {
        this.store$.dispatch(new contentActions.LoadGDPRDateSSA());
    }

    ngAfterViewInit() {
        let top = document.getElementById("fcl-declaration-top");
        if (top !== null) {
            top.scrollIntoView();
            top = null;
        }
    }
}
