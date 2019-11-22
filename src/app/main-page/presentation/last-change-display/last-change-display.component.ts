import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'fcl-last-change-display',
    templateUrl: './last-change-display.component.html',
    styleUrls: ['./last-change-display.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class LastChangeDisplayComponent implements OnInit {
    tooltipPosition: string = 'above';
    tooltipInfo: string;
    private lastChangeSub$: BehaviorSubject<string>;
    lastChange$: Observable<string>;
    clientVersion: string;
    private dateParseString = 'YYYY-MM-DD HH:mm:ss +-HHmm';
    private dateFormatString = 'MMMM D, YYYY';
    private clientLastChange: string;

    constructor() { }

    ngOnInit() {
        moment.locale('en');
        this.clientLastChange = moment(environment.lastChange, this.dateParseString).format(this.dateFormatString);
        this.lastChangeSub$ = new BehaviorSubject(this.clientLastChange);
        this.lastChange$ = this.lastChangeSub$.asObservable();

        this.lastChangeSub$.next(this.clientLastChange);

        this.clientVersion = environment.version;
        this.tooltipInfo = `client version@${this.clientVersion}`;
    }

}
