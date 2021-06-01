import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { DataRequestService } from '../../core/services/data-request.service';
import { GDPRDateDTO } from '../models/content.model';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ContentService {

    private URL = {
        gdprdate: '/info/gdpr-date'
    };

    constructor(
        private dataService: DataRequestService
    ) { }

    getGDPRDate(): Observable<string> {
        return this.dataService.get<GDPRDateDTO>(this.URL.gdprdate).pipe(
            map((gdprDate: GDPRDateDTO) => {
                return gdprDate.gdprDate;
            }));
    }

}
