import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'fcl-last-change-display',
    templateUrl: './last-change-display.component.html',
    styleUrls: ['./last-change-display.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class LastChangeDisplayComponent implements OnInit {
    private dateParseString = 'YYYY-MM-DD HH:mm:ss +-HHmm';
    private dateFormatString = 'MMMM D, YYYY';
    clientLastChange: string;
    clientVersion: string;
    tooltipPosition: string = 'above';
    tooltipInfo: string;

    ngOnInit() {
        moment.locale('en');
        this.clientLastChange = moment(environment.lastChange, this.dateParseString).format(this.dateFormatString);
        this.clientVersion = environment.version;
        this.tooltipInfo = `client version@${this.clientVersion}`;
    }

}
