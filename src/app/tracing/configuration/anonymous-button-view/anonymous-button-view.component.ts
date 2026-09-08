import { Component, Input } from "@angular/core";

@Component({
    selector: "fcl-anonymous-button-view",
    templateUrl: "./anonymous-button-view.component.html",
    styleUrls: ["./anonymous-button-view.component.scss"],
    standalone: false,
})
export class AnonymousButtonViewComponent {
    @Input() tooltip = "";

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onAnonymize() {}
}
