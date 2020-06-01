import { Component, AfterViewInit } from '@angular/core';

@Component({
    selector: 'fcl-data-protection-declaration',
    templateUrl: './data-protection-declaration.component.html',
    styleUrls: ['./data-protection-declaration.component.scss']
})
export class DataProtectionDeclarationComponent implements AfterViewInit {

    constructor() { }

    ngAfterViewInit() {
        let top = document.getElementById('fcl-declaration-top');
        if (top !== null) {
            top.scrollIntoView();
            top = null;
        }
    }

}
