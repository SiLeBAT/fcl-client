import { Injectable } from '@angular/core';
import { VisioReport } from '../../visio/layout-engine/datatypes';

@Injectable({
    providedIn: 'root'
})
export class VisioToMxGraphService {

    createGraph(visioReport: VisioReport) {
        const graph = new mxGraph(null);
        const parent = graph.getDefaultParent();
        graph.getModel().beginUpdate();

        try {

            const vertex1 = graph.insertVertex(parent, '1', 'Vertex 1', 0, 0, 200, 80);
            const vertex2 = graph.insertVertex(parent, '2', 'Vertex 2', 0, 0, 200, 80);

            graph.insertEdge(parent, '', '', vertex1, vertex2);

            const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
            const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
            const e1 = graph.insertEdge(parent, null, '', v1, v2);

            // console.log('graph: ', graph);

        } finally {
            graph.getModel().endUpdate();
            new mxHierarchicalLayout(graph).execute(graph.getDefaultParent());
        }

        return graph;
    }
}
