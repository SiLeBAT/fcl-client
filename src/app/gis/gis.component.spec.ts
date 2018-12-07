import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatMenuModule, MatSliderModule } from '@angular/material';
import { TracingService } from '../tracing/tracing.service';

import { GisComponent } from './gis.component';

describe('GisComponent', () => {
    let component: GisComponent;
    let fixture: ComponentFixture<GisComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [MatDialogModule, MatMenuModule, MatSliderModule],
            declarations: [GisComponent],
            providers: [TracingService]
        }).compileComponents().then().catch();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GisComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
