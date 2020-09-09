import { CyNodeData, CyEdgeData } from './graph.model';
import { SelectedGraphElements } from './components/graph-view/cy-graph';

export interface GraphData {
    nodeData: CyNodeData[];
    edgeData: CyEdgeData[];
}

export function mapGraphSelectionToFclElementSelection(selectedGraphElements: SelectedGraphElements, graphData: GraphData) {
    const nodeSel = selectedGraphElements.nodeSel;
    const edgeSel = selectedGraphElements.edgeSel;
    return {
        stations: graphData.nodeData.filter(n => nodeSel[n.id]).map(n => n.station.id),
        deliveries: [].concat(
            ...graphData.edgeData
                .filter(e => edgeSel[e.id])
                .map(e =>
                    e.deliveries.some((d) => d.selected) ?
                    e.deliveries.filter(d => d.selected).map(d => d.id) :
                    e.deliveries.map(d => d.id)
                )
        )
    };
}
