import * as _ from 'lodash';
import { Graph, Vertex, Edge } from './data-structures';
import { BusinessTypeRanker } from './business-type-ranker';

class LayerAssignment {
    private vertexOutEdgeCounts: number[];

    private getForkVertices(graph: Graph): Vertex[] {
        const result: Vertex[] = [];
        for (
            // eslint-disable-next-line one-var
            let i: number = 0, n: number = this.vertexOutEdgeCounts.length;
            i < n;
            ++i
        ) {
            if (this.vertexOutEdgeCounts[i] < 1) { result.push(graph.vertices[i]); }
        }
        return result;
    }

    getIncomingEdges(vertices: Vertex[]): Edge[] {
        return _.flatten(vertices.map(v => v.inEdges));
    }

    init(graph: Graph) {
        this.vertexOutEdgeCounts = [];
        for (const vertex of graph.vertices) {
            this.vertexOutEdgeCounts[vertex.index] = vertex.outEdges.length;
        }
    }

    assignLayers(graph: Graph, typeRanker: BusinessTypeRanker): Vertex[][] {

        this.init(graph);

        const layers: Vertex[][] = [];
        let sinks: Vertex[] = this.getForkVertices(graph);

        while (sinks.length > 0) {
            const sinkInEdges = this.getIncomingEdges(sinks);
            for (const edge of sinkInEdges) {
                this.vertexOutEdgeCounts[edge.source.index]--;
            }

            for (let i: number = sinks.length - 1; i >= 0; i--) {
                sinks[i].layerIndex = layers.length;
                sinks[i].indexInLayer = i;
            }
            layers.push(sinks);

            sinks = [];
            // get new sinks
            for (const edge of sinkInEdges) {
                if (this.vertexOutEdgeCounts[edge.source.index] < 1) {
                    sinks.push(edge.source);
                }
            }

            sinks = Array.from(new Set(sinks));
        }
        graph.layers = layers;

        return layers;
    }
}

export function assignLayers(graph: Graph, typeRanker): Vertex[][] {
    const layerAssignment = new LayerAssignment();
    return layerAssignment.assignLayers(graph, typeRanker);
}
