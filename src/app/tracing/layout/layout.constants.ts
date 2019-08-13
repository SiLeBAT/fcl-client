interface Info {
    displayName: string;
    toolTip?: string;
    name: string;
}

export class LayoutManagerInfo {
    static readonly fruchtermanReingold: Info = {
        displayName: 'Fruchterman-Reingold',
        name: 'fruchterman'
    };

    static readonly farmToFork: Info = {
        displayName: 'Farm-to-fork',
        name: 'farm_to_fork'
    };

    static readonly constraintBased: Info = {
        displayName: 'Constraint-Based',
        name: 'cola'
    };

    static readonly random: Info = {
        displayName: 'Random',
        name: 'random'
    };

    static readonly grid: Info = {
        displayName: 'Grid',
        name: 'grid'
    };

    static readonly circle: Info = {
        displayName: 'Circle',
        name: 'circle'
    };

    static readonly concentric: Info = {
        displayName: 'Concentric',
        name: 'concentric'
    };

    static readonly breadthFirst: Info = {
        displayName: 'Breadth-first',
        name: 'breadthfirst'
    };

    static readonly spread: Info = {
        displayName: 'Spread',
        name: 'spread'
    };

    static readonly directedAcyclicGraph: Info = {
        displayName: 'Directed acyclic graph',
        name: 'dagre'
    };
}

export class LayoutStrings {
    static readonly layoutRunning: string = 'Layout running ...';
    static readonly stopLayouting: string = 'Stop';

}
