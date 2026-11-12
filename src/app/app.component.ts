import { Component } from "@angular/core";

@Component({
    selector: "fcl-root",
    templateUrl: "./app.component.html",
    standalone: false,
})
export class AppComponent {
    constructor() {
        // Disables all default context menus in webapp
        document.oncontextmenu = (e) => e.preventDefault();
    }
}
