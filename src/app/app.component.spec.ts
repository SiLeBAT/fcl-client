import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
    let fixture: ComponentFixture<AppComponent>;
    let component: AppComponent;

    beforeEach(async(() => {
        // tslint:disable-next-line: no-floating-promises
        TestBed.configureTestingModule({
            declarations: [
                AppComponent
            ],
            schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
        }).compileComponents();
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.debugElement.componentInstance;
    }));

    it('should create the component', async () => {
        expect(component).toBeTruthy();
    });

    it('should render correctlu', () => {
        expect(fixture).toMatchSnapshot();
    })
});
