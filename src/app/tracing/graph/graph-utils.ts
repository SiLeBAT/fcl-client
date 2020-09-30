import { SelectedGraphElements, GraphElementData } from './graph.model';
import { Utils } from '../util/non-ui-utils';
import { SelectedElements } from '../data.model';

export function mapGraphSelectionToFclElementSelection(
    selectedGraphElements: SelectedGraphElements,
    graphData: GraphElementData): SelectedElements {
    const nodeSel = Utils.createSimpleStringSet(selectedGraphElements.nodes);
    const edgeSel = Utils.createSimpleStringSet(selectedGraphElements.edges);

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
