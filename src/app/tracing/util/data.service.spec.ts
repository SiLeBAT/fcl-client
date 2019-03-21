import { inject, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { DataService } from './data.service';

describe('DataService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [DataService]
        });
    });

    it('should ...', inject([DataService], (service: DataService) => {
        expect(service).toBeTruthy();
    }));
});
