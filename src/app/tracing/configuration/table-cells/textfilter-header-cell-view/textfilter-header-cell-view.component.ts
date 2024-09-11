import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import {SortableHeaderCellViewComponent} from '../../sortable-header-cell-view.component';

@Component({
  selector: 'fcl-textfilter-header-cell-view',
  templateUrl: './textfilter-header-cell-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFilterHeaderCellViewComponent extends SortableHeaderCellViewComponent {
  @Input() filterText: string | null = '';

  @Output() filterChange = new EventEmitter<string>();

  onFilterTextChange(filterText: string): void {
    this.filterChange.emit(filterText);
  }
}
