import {Vertex} from './data_structures';
import * as _ from 'lodash';

export interface LayeredComponent {
  layerIndices: number[];
  layers: Vertex[][];
}

function traverseComponent(vertex: Vertex, marked: boolean[], members: Vertex[]) {
  if(!marked[vertex.index]) {
    marked[vertex.index] = true;
    members.push(vertex);
    for(const edge of vertex.inEdges) traverseComponent(edge.source, marked, members);
    for(const edge of vertex.outEdges) traverseComponent(edge.target, marked, members);
  }
}

export function splitUnconnectedComponents(layers: Vertex[][]): LayeredComponent[] {
  const result: LayeredComponent[] = [];
  const marked: boolean[] = [];
  let maxLayerSize: number  = Math.max(...layers.map(layer=>layer.length));
  for(const layer of layers) for(const vertex of layer) marked[vertex.index] = false;
  for(const layer of layers) for(const vertex of layer) {
    if(!marked[vertex.index]) {
      const members: Vertex[] = [];
      //const newLayers: Vertex[][] = [];
      traverseComponent(vertex, marked, members);
      
      const layerIndices: number[] = _.uniq(members.map(v=>v.layerIndex));
      layerIndices.sort();
      const layeredComponent: LayeredComponent = {
        layerIndices: layerIndices,
        layers: []
      };
      
      const oldIndexToNewIndexMap: number[] = [];
      for(let i: number = layerIndices.length-1; i>=0; i--) {
        layeredComponent.layers[i] = [];
        oldIndexToNewIndexMap[layerIndices[i]] = i;
      }

      for(const vertex of members) layeredComponent.layers[oldIndexToNewIndexMap[vertex.layerIndex]].push(vertex);
      
      result.push(layeredComponent);
    }
    for(const layeredComponent of result) {
      for(let iLayer: number = layeredComponent.layers.length-1; iLayer>=0; iLayer--) {
        const layer: Vertex[] = layeredComponent.layers[iLayer];
        for(let iVertex: number = layer.length-1; iVertex>=0; iVertex--) {
          layer[iVertex].layerIndex = iLayer;
          layer[iVertex].indexInLayer = iVertex;
        }
      }
    }
  }
  console.log('Graph was splitted to ' + result.length.toString() + ' components.');
  console.log('MaxLayerSize (wo virtual vertices) was reduced from ' + maxLayerSize + ' to ' + Math.max(...result.map(lC=>Math.max(...lC.layers.map(l=>l.length)))).toString() + '.');
  return result;
}

export function mergeUnconnectedComponents(layeredComponents: LayeredComponent[], componentDistance: number): Vertex[][] {
  const result: Vertex[][] = [];
  const nLayers: number = Math.max(...layeredComponents.map(layeredComponent => layeredComponent.layerIndices[layeredComponent.layerIndices.length-1]))+1;
  for(let iLayer: number = nLayers-1; iLayer>=0; iLayer--) result[iLayer] = [];

  let offset: number = 0;
  //const ComponentDistance: number = 10;
  for(const layeredComponent of layeredComponents) {
    let maxComponentSize: number = 0;
    for(let iLayer: number = layeredComponent.layers.length-1; iLayer>=0; iLayer--) {
      const layer: Vertex[] = result[layeredComponent.layerIndices[iLayer]];
      //const lastVertexInComponentLayer: Vertex =  layeredComponent.layers[iLayer][layer.length-1]
      //maxComponentSize = Math.max(maxComponentSize, layeredComponent.layers[iLayer][layer.length-1].y + layer[layer.length-1].size/2);
      for(const vertex of layeredComponent.layers[iLayer]) {
        layer.push(vertex);
        vertex.y+= offset;
      }
      maxComponentSize = Math.max(maxComponentSize, layer[layer.length-1].y - offset + layer[layer.length-1].size/2 );
    }
    offset+= componentDistance + maxComponentSize;
  }
  for(let iLayer: number = nLayers-1; iLayer>=0; iLayer--) {
    const layer: Vertex[] = result[iLayer];
    for(let iVertex: number = layer.length-1; iVertex>=0; iVertex--) {
      layer[iVertex].layerIndex = iLayer;
      layer[iVertex].indexInLayer = iVertex;
    }
  }
  return result;
}

