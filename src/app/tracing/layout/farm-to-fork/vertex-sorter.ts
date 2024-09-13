import { Graph, Vertex, Edge, VertexCounter } from "./data-structures";

class VertexSorter {
    sortVertices(graph: Graph, timeLimit: number) {
        if (timeLimit === undefined) {
            timeLimit = Number.POSITIVE_INFINITY;
        }
        const startTime = new Date().getTime();
        this.createVirtualVertices(graph);
        if (Math.max(...graph.layers.map((l) => l.length)) <= 1) {
            return;
        }

        const layers: Vertex[][] = graph.layers;

        const layerCopy = (arr: Vertex[][]) => {
            const layerBackup: Vertex[][] = [];
            let i: number = arr.length;
            while (i--) {
                layerBackup[i] = arr[i].map((v) => v);
            }
            return layerBackup;
        };

        let bestSolution: Vertex[][] = layerCopy(layers);
        let bestCrossing: number = this.layerCrossing(layers);

        const ITERATION_LIMIT = 24;
        const temperatures: number[] = [];

        for (
            // eslint-disable-next-line one-var
            let iIteration = 0,
                maxIterationIndex = ITERATION_LIMIT + 2 * temperatures.length;
            iIteration <= maxIterationIndex;
            iIteration++
        ) {
            const iIterationRound: number = Math.floor(iIteration / 2);
            const temperature: number =
                iIterationRound >= temperatures.length
                    ? 0
                    : temperatures[iIterationRound];
            this.sortVerticesInLayers(layers, iIteration);

            this.transpose(layers, temperature);

            const currentCrossing: number = this.layerCrossing(layers);
            if (currentCrossing < bestCrossing) {
                bestSolution = layerCopy(layers);
                bestCrossing = currentCrossing;
            }
            if (timeLimit - (new Date().getTime() - startTime) < 0) {
                break;
            }
        }

        graph.layers = bestSolution;
        graph.resetVertexIndicesInLayers();
    }

    private transpose(layers: Vertex[][], temperature: number) {
        let improved: boolean = true;
        const maxRank: number = layers.length - 1;
        while (improved) {
            improved = false;
            for (let iL: number = 0; iL <= maxRank; iL++) {
                for (
                    // eslint-disable-next-line one-var
                    let iV: number = 0, maxiV: number = layers[iL].length - 2;
                    iV <= maxiV;
                    iV++
                ) {
                    const v: Vertex = layers[iL][iV];
                    const w: Vertex = layers[iL][iV + 1];
                    const vwCrossing: number = this.pairCrossing(v, w);
                    const wvCrossing: number = this.pairCrossing(w, v);

                    if (
                        vwCrossing > wvCrossing ||
                        (temperature > 0 && Math.random() < temperature)
                    ) {
                        improved = vwCrossing > wvCrossing;
                        layers[iL][iV] = w;
                        layers[iL][iV + 1] = v;
                        w.indexInLayer = iV;
                        v.indexInLayer = iV + 1;
                    }
                }
            }
        }
    }

    private pairCrossing(v: Vertex, w: Vertex): number {
        let crossCount: number = 0;

        const numberComparator = (a: number, b: number) =>
            a < b ? -1 : b < a ? 1 : 0;

        const fA: ((a: Vertex) => number[])[] = [
            (a) => a.inEdges.map((e) => e.source.indexInLayer),
            (a) => a.outEdges.map((e) => e.target.indexInLayer),
        ];
        for (const f of fA) {
            const vNeighbourIndices = f(v);
            const wNeighbourIndices = f(w);
            const nV: number = vNeighbourIndices.length;
            const nW: number = wNeighbourIndices.length;
            let iV: number = 0;
            let iW: number = 0;

            vNeighbourIndices.sort(numberComparator); // ToDo: make faster by preventing this step
            wNeighbourIndices.sort(numberComparator); // ToDo: make faster by preventing this step
            while (iV < nV && iW < nW) {
                while (
                    iV < nV &&
                    wNeighbourIndices[iW] >= vNeighbourIndices[iV]
                ) {
                    iV++;
                }
                while (
                    iW < nW &&
                    wNeighbourIndices[iW] < vNeighbourIndices[iV]
                ) {
                    crossCount += nV - iV;
                    iW++;
                }
            }
        }
        return crossCount;
    }

    private layerCrossing(layers: Vertex[][]): number {
        let totalCrossing: number = 0;

        // eslint-disable-next-line one-var
        for (let iL: number = 0, nL = layers.length; iL < nL - 1; iL++) {
            const vertexCounter = new VertexCounter();
            for (const vertex of layers[iL]) {
                for (const edge of vertex.inEdges) {
                    totalCrossing += vertexCounter.getVertexCountAbovePosition(
                        edge.source.indexInLayer,
                    );
                }
                for (const edge of vertex.inEdges) {
                    vertexCounter.insertVertex(edge.source.indexInLayer);
                }
            }
        }
        return totalCrossing;
    }

    sortVerticesInLayers(layers: Vertex[][], iIteration: number) {
        const compareNumbers = (a: number, b: number) =>
            a < b ? -1 : a === b ? 0 : 1;

        if (iIteration % 2 === 0) {
            // eslint-disable-next-line one-var
            for (let iL: number = 1, nL = layers.length; iL < nL; iL++) {
                for (const vertex of layers[iL]) {
                    vertex.weight = this.getWeight(vertex, iL - 1);
                }
                layers[iL] = layers[iL].sort((a, b) =>
                    compareNumbers(a.weight, b.weight),
                );
            }
        } else {
            for (let iL: number = layers.length - 2; iL >= 0; iL--) {
                for (const vertex of layers[iL]) {
                    vertex.weight = this.getWeight(vertex, iL + 1);
                }
                layers[iL] = layers[iL].sort((a, b) =>
                    compareNumbers(a.weight, b.weight),
                );
            }
        }
        for (const layer of layers) {
            let indexInLayer: number = -1;
            for (const vertex of layer) {
                vertex.indexInLayer = ++indexInLayer;
            }
        }
    }

    getWeight(vertex: Vertex, rank: number): number {
        const adjacentPositions: number[] =
            rank < vertex.layerIndex
                ? vertex.outEdges.map((e) => e.target.indexInLayer)
                : vertex.inEdges.map((e) => e.source.indexInLayer);
        const pCount = adjacentPositions.length;

        if (pCount === 0) {
            return -1.0;
        } else if (pCount % 2 === 1) {
            return adjacentPositions[(pCount - 1) / 2];
        } else if (pCount === 2) {
            return (adjacentPositions[0] + adjacentPositions[1]) / 2;
        } else {
            const halfCount: number = pCount / 2;
            const left: number =
                adjacentPositions[halfCount - 1] - adjacentPositions[0];
            const right: number =
                adjacentPositions[pCount - 1] - adjacentPositions[halfCount];
            return (
                (adjacentPositions[halfCount - 1] * right +
                    adjacentPositions[halfCount] * left) /
                (left - right)
            );
        }
    }

    private createVirtualVertices(graph: Graph) {
        for (const layer of graph.layers) {
            for (const vertex of layer) {
                for (const edge of vertex.inEdges) {
                    if (
                        Math.abs(
                            edge.source.layerIndex - edge.target.layerIndex,
                        ) > 1
                    ) {
                        this.splitEdge(graph, edge);
                    }
                }
            }
        }
    }

    private splitEdge(graph: Graph, edge: Edge) {
        const layerSpan = edge.source.layerIndex - edge.target.layerIndex;
        const maxVertexIndex: number = graph.vertices.length - 1;
        const layers: Vertex[][] = graph.layers;

        // add new virtual nodes
        for (let i: number = 1; i < layerSpan; ++i) {
            const iL: number = edge.source.layerIndex - i;
            const vertex: Vertex = new Vertex();
            graph.insertVertex(vertex);
            vertex.isVirtual = true;

            layers[iL].push(vertex);
            vertex.indexInLayer = layers[iL].length - 1;
            vertex.layerIndex = iL;
        }

        const edgeOutIndex: number = edge.source.outEdges.findIndex(
            (e) => e.target.index === edge.target.index,
        );
        const edgeInIndex: number = edge.target.inEdges.findIndex(
            (e) => e.source.index === edge.source.index,
        );
        const newSpanStartEdge: Edge = new Edge(
            graph.vertices[edge.source.index],
            graph.vertices[maxVertexIndex + 1],
            true,
        );
        newSpanStartEdge.weight = edge.weight;
        graph.vertices[edge.source.index].outEdges[edgeOutIndex] =
            newSpanStartEdge; // replacing old edge
        graph.vertices[maxVertexIndex + 1].inEdges = [newSpanStartEdge];
        const newSpanEndEdge: Edge = new Edge(
            graph.vertices[maxVertexIndex + layerSpan - 1],
            graph.vertices[edge.target.index],
            true,
        );
        newSpanEndEdge.weight = edge.weight;
        graph.vertices[edge.target.index].inEdges[edgeInIndex] = newSpanEndEdge;
        graph.vertices[maxVertexIndex + layerSpan - 1].outEdges = [
            newSpanEndEdge,
        ];

        for (let i: number = 1; i < layerSpan - 1; ++i) {
            const newSpanInBetweenEdge: Edge = new Edge(
                graph.vertices[maxVertexIndex + i],
                graph.vertices[maxVertexIndex + i + 1],
                true,
            );
            newSpanInBetweenEdge.weight = edge.weight;
            graph.vertices[maxVertexIndex + i].outEdges = [
                newSpanInBetweenEdge,
            ];
            graph.vertices[maxVertexIndex + i + 1].inEdges = [
                newSpanInBetweenEdge,
            ];
        }
    }
}

export function sortVertices(graph: Graph, timeLimit?: number) {
    if (timeLimit === undefined) {
        timeLimit = Number.POSITIVE_INFINITY;
    } else {
        timeLimit = Math.max(timeLimit, 1000);
    }
    const vertexSorter = new VertexSorter();
    vertexSorter.sortVertices(graph, timeLimit);
}
