import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import {SortableHeaderCellViewComponent} from '../../sortable-header-cell-view.component';

@Component({
  selector: 'fcl-visibilityfilter-header-cell-view',
  templateUrl: './visibilityfilter-header-cell-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisibilityFilterHeaderCellViewComponent extends SortableHeaderCellViewComponent {
  @Input() showVisibleElements = true;
  @Input() showInvisibleElements = true;

  @Output() toggleFilterState = new EventEmitter<void>();

  onToggleFilterState(): void {
    this.toggleFilterState.emit();
  }
}
