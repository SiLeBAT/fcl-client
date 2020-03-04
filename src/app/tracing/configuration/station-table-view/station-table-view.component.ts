import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'fcl-station-table-view',
    templateUrl: './station-table-view.component.html',
    styleUrls: ['./station-table-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class StationTableViewComponent implements OnInit {

    rows = [
        { ID: 'S1', name: 'Heckmair Andreas', score: '0' },
        { ID: 'S3', name: 'Voggel Anton', score: '0' },
        { ID: 'S4', name: 'Schaich Peter', score: '0' },
        { ID: '...', name: '...', score: '...' }
    ];
    columns = [
        { prop: 'ID' },
        { name: 'Name' },
        { name: 'Score' }
    ];

    constructor() { }

    ngOnInit() {
    }
}
