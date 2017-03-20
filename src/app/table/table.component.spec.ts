import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';

import {TableComponent} from './table.component';

describe('TableComponent', () => {
  let component: TableComponent;
  let fixture: ComponentFixture<TableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NgxDatatableModule],
      declarations: [TableComponent]
    }).compileComponents().then();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
