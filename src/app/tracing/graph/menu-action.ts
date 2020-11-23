export interface MenuAction {
    displayName: string;
    disabled?: boolean;
    toolTip?: string;
    action?: (event: MouseEvent) => void;
    children: MenuAction[];
}
