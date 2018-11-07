import {Graph, Vertex} from './data_structures';
import {BusinessTypeRanker} from './business_type_ranker';

export function positionVertices(layers: Vertex[][], vertexDistance: number) {
  let vertexPositioner: VertexPositionerSimple = new VertexPositionerSimple();
  vertexPositioner.positionVertices(layers, vertexDistance);
}

class VertexPositionerSimple {
   
  constructor() {}
  
  positionVertices(layers: Vertex[][], vertexDistance: number) {
    const nLayers: number = layers.length;
    const layerDistance: number = 1; //width/nLayers;
    //const vertexDistance: number = height*0.9/Math.max(...(layers.map(layer => {return layer.length})));
    const bottomMargin = vertexDistance; //height*0.05;
    const rightMargin = layerDistance/2;
    
    let x: number = rightMargin;
    for(let layer of layers) {
      let y: number = bottomMargin;
      for(let vertex of layer) {
        vertex.y = y;
        vertex.x = x;
        y+= vertexDistance;
      }
      x-=layerDistance;
    }
  }
}