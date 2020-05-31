import { Cy, CyElementCollection, CyEdge, CyNode } from './graph.model';
import { Position } from '../data.model';

export class EdgeLabelOffsetUpdater {

    private draggedEdges: CyElementCollection<CyEdge>;
    private grabbedNode: CyNode;

    private cy: Cy;
    private dragListener: () => void;
    private freeOnListener: () => void;
    private grabOnListener: (e: any) => void;

    private addListener(): void {
        this.addGrabOnListener();
    }

    private addGrabOnListener(): void {
        this.grabOnListener = ((event: any) => {
            this.grabbedNode = event.target;
            this.addDragListener();
            this.addFreeOnListener();
        }).bind(this);
        this.cy.on('grabon', this.grabOnListener);
    }

    private removeGrabOnListener(): void {
        if (this.grabOnListener) {
            this.cy.removeListener('grabon', this.grabOnListener);
            this.grabOnListener = null;
        }
    }

    private addDragListener(): void {
        this.dragListener = (() => {
            if (!this.draggedEdges) {
                this.initDraggedEdges(
                    this.grabbedNode.selected() ?
                    this.cy.nodes(':selected').edgesWith(':unselected') :
                    this.grabbedNode.connectedEdges(':simple')
                );
                this.switchOffEdgeLabels(this.draggedEdges);
            }
        }).bind(this);

        this.grabbedNode.on('drag', this.dragListener);
    }

    private removeDragListener(): void {
        if (this.dragListener) {
            this.grabbedNode.removeListener('drag', this.dragListener);
            this.dragListener = null;
        }
        if (this.draggedEdges) {
            this.switchOnEdgeLabels(this.draggedEdges);
            this.draggedEdges = null;
        }
    }

    private addFreeOnListener(): void {
        this.freeOnListener = (() => {
            this.removeDragListener();
            this.removeFreeOnListener();
            this.grabbedNode = null;
        }).bind(this);
        this.grabbedNode.on('freeon', this.freeOnListener);
    }

    private switchOffEdgeLabels(edges: CyElementCollection<CyEdge>): void {
        edges.toggleClass('edge-label-disabled');
    }

    private switchOnEdgeLabels(edges: CyElementCollection<CyEdge>): void {
        edges.toggleClass('edge-label-disabled');
        this.updateEdgeLabelOffsets(edges);
    }

    private removeFreeOnListener(): void {
        if (this.freeOnListener) {
            this.grabbedNode.removeListener('freeon', this.freeOnListener);
            this.freeOnListener = null;
        }
    }

    private removeListener(): void {
        this.removeGrabOnListener();
        this.removeDragListener();
        this.removeFreeOnListener();
    }

    connectTo(cy: Cy): void {
        if (this.cy) {
            this.disconnect();
        }
        this.cy = cy;
        this.addListener();
        this.update(true);
    }

    disconnect() {
        if (this.cy) {
            this.removeListener();
            this.cy = null;
        }
    }

    update(useBatch: boolean) {
        if (this.cy) {
            if (useBatch) {
                this.cy.batch(() => this.updateEdgeLabelOffsets(this.cy.edges()));
            } else {
                this.updateEdgeLabelOffsets(this.cy.edges());
            }
        }
    }

    updateGhostEdges() {
        this.cy.batch(() => this.updateEdgeLabelOffsets(this.cy.edges('.ghost-element')));
    }

    private updateEdgeLabelOffsets(edges: CyElementCollection<CyEdge>) {
        if (edges.size() === 0) {
            return;
        }

        const strFontSize: string = edges.first().style('font-size') as string;
        const fontSize = +strFontSize.substr(0, strFontSize.length - 2);

        edges.forEach(edge => {
            const strWidth: string = edge.style('width') as string;
            const offset: number = fontSize / 2.0 + (+strWidth.substr(0, strWidth.length - 2)) / 2.0;
            this.updateEdgeLabelOffset(edge, offset);
        });
    }

    private initDraggedEdges(edges: CyElementCollection<CyEdge>): void {
        this.draggedEdges = edges;
    }

    private updateEdgeLabelOffset(edge: CyEdge, offset: number): void {
        const sourcePos: Position = edge['source']().position();
        const targetPos: Position = edge['target']().position();
        const dEy = targetPos.y - sourcePos.y;
        if (dEy === 0) {
            edge.style({
                'text-margin-y': ('-' + offset + 'px'),
                'text-margin-x': '0px'
            });
        } else {
            const dEx = targetPos.x - sourcePos.x;
            const a_eX_to_eY_ratio = Math.abs(dEx / dEy);
            const adTx = Math.sqrt(offset * offset / (1 + a_eX_to_eY_ratio * a_eX_to_eY_ratio));
            const adTy = a_eX_to_eY_ratio * adTx;
            const sign = dEx * dEy < 0 ? '-' : '';
            edge.style({
                'text-margin-y': '-' + adTy + 'px',
                'text-margin-x': sign + adTx + 'px'
            });
        }
    }
}
