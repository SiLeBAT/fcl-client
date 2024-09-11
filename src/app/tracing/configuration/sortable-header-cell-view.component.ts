import {Component, Input, Output, EventEmitter} from '@angular/core';
import {TableColumn} from '@app/tracing/data.model';
import {SortDirection} from '@swimlane/ngx-datatable';

@Component({
  template: '',
})
export class SortableHeaderCellViewComponent {
  @Input() column: TableColumn | null = null;
  @Input() sortDir: SortDirection | undefined = undefined;

  @Output() sort = new EventEmitter<void>();

  onSort(): void {
    this.sort.emit();
  }
}
