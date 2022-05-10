import { Component, AfterViewInit } from '@angular/core';

@Component({
    selector: 'fcl-data-protection-notice',
    templateUrl: './data-protection-notice.component.html',
    styleUrls: ['./data-protection-notice.component.scss']
})
export class DataProtectionNoticeComponent implements AfterViewInit {

    ngAfterViewInit() {
        let top = document.getElementById('fcl-notice-top');
        if (top !== null) {
            top.scrollIntoView();
            top = null;
        }
    }
}
