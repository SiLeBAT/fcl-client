import { Component } from "@angular/core";
import * as fromUser from "../../../user/state/user.reducer";
import { Store, select } from "@ngrx/store";

@Component({
    selector: "fcl-profile-container",
    templateUrl: "./profile-container.component.html",
    styleUrls: ["./profile-container.component.scss"],
})
export class ProfileContainerComponent {
    currentUser$ = this.store.pipe(select(fromUser.getCurrentUser));

    constructor(private store: Store<fromUser.State>) {}
}
