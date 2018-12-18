import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainDashComponent } from './main-dash.component';

describe('MainDashComponent', () => {
    let component: MainDashComponent;
    let fixture: ComponentFixture<MainDashComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ MainDashComponent ]
        })
          .compileComponents()
          .catch();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MainDashComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
