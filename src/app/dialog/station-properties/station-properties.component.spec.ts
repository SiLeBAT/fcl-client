import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material';

import {
  StationPropertiesComponent,
  StationPropertiesData
} from './station-properties.component';

describe('StationPropertiesComponent', () => {
    let component: StationPropertiesComponent;
    let fixture: ComponentFixture<StationPropertiesComponent>;

    beforeEach(async(() => {
        const data: StationPropertiesData = {
            station: {
                id: null,
                name: null,
                lat: null,
                lon: null,
                incoming: [],
                outgoing: [],
                connections: [],
                invisible: null,
                contained: null,
                contains: null,
                groupType: null,
                selected: null,
                observed: null,
                forward: null,
                backward: null,
                outbreak: null,
                crossContamination: null,
                score: null,
                commonLink: null,
                position: null,
                positionRelativeTo: null,
                properties: []
            },
            deliveries: new Map(),
            connectedStations: new Map(),
            hoverDeliveries: null
        };

        TestBed.configureTestingModule({
            imports: [MatDialogModule],
            declarations: [StationPropertiesComponent],
            providers: [
        { provide: MatDialogRef, useValue: { updatePosition: () => void 0 } },
        { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        })
      .compileComponents()
          .then()
          .catch();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(StationPropertiesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
