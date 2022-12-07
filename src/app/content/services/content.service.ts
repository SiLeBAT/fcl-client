import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { DataRequestService } from '../../core/services/data-request.service';
import { FaqResponseDTO, GDPRDateDTO } from '../models/content.model';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ContentService {

    private URL = {
        gdprdate: '/v1/info/gdpr-date',
        faqs: './assets/faq.json'
    };

    constructor(
        private dataService: DataRequestService
    ) { }

    getGDPRDate(): Observable<string> {
        return this.dataService.get<GDPRDateDTO>(this.URL.gdprdate).pipe(
            map((gdprDate: GDPRDateDTO) => gdprDate.gdprDate));
    }

    getFaq(): Observable<FaqResponseDTO> {
        return this.dataService.get<FaqResponseDTO>(this.URL.faqs).pipe(
            map((data) => data));
    }

}
