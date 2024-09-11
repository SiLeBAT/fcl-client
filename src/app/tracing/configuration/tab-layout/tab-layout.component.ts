import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ChangeDetectorRef,
} from '@angular/core';
import {Observable} from 'rxjs';

export interface TabConfig {
  tabLabel: string;
  tabTemplate?: TemplateRef<any>;
}

@Component({
  selector: 'fcl-tab-layout',
  templateUrl: './tab-layout.component.html',
  styleUrls: ['./tab-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TabLayoutComponent {
  animatingTabIndex: number | null = null;

  @Input() activeTabIndex$: Observable<number>;
  @Input() tabGroupId: string;
  @Input() tabConfigs: TabConfig[];
  @Output() tabGroupIndex = new EventEmitter<number>();
  @Output() animationDone = new EventEmitter<void>();

  constructor(private cdRef: ChangeDetectorRef) {}

  onSelectedIndexChange(selectedIndex: number): void {
    this.animatingTabIndex = selectedIndex;
    this.cdRef.markForCheck();
    this.tabGroupIndex.emit(selectedIndex);
  }

  onAnimationDone(): void {
    this.animationDone.emit();
    this.cdRef.markForCheck();
    // in firefox the activability of the next tab is not prevented before
    // a active tab is ready
    setTimeout(() => {
      this.animatingTabIndex = null;
      this.cdRef.markForCheck();
    }, 50);
  }
}
