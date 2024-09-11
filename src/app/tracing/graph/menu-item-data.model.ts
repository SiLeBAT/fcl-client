import {Action} from '@ngrx/store';

export interface MenuItemData {
  displayName: string;
  disabled?: boolean;
  toolTip?: string;
  iconName?: string;
  action?: Action;
  route?: string;
  children?: MenuItemData[];
}
