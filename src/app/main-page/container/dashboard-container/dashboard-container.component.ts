import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'fcl-dashboard-container',
    templateUrl: './dashboard-container.component.html',
    styleUrls: ['./dashboard-container.component.scss']
})
export class DashboardContainerComponent implements OnInit {

    constructor(private router: Router) { }

    ngOnInit() {
    }

    onTracingView() {
        this.router.navigate(['/tracing']).catch(err => {
            throw new Error(`Unable to navigate: ${err}`);
        });

    }
}
