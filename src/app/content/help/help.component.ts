import { Component, OnInit } from "@angular/core";
import { environment } from "../../../environments/environment";

@Component({
    selector: "fcl-help",
    templateUrl: "./help.component.html",
    styleUrls: ["./help.component.scss"],
})
export class HelpComponent implements OnInit {
    supportContact: string;

    ngOnInit() {
        this.supportContact = environment.supportContact;
    }
}
