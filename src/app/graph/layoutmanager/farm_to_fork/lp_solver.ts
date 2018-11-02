import * as Solver from 'javascript-lp-solver';

export function lpSolve(model: LPModel): LPResult {
  //var solver = require("javascript-lp-solver");
  const tmp = Solver;
  /*for(let prop of Solver) {
    console.log(prop);
  }*/
  let result: any = tmp.Solve(model.getModel());
  //const result: any = solver.solve(model);
  //const result = null;
  return new LPResult(result, model);
}

export class LPModel {
  private variables: string[] = [];
  private model: any = {'variables': {}, 'constraints': {}, 'optimize': 'objective'};
  private constraintCount: number = 0;
  private constraintsLabelMap: Map<string,string> = new Map();
  private constraintIds: string[] = [];

  constructor() {}
  
  addConstraint(constraintLabel: string, min: number, max: number, constraint: Object) {
    //const constId = (++this.constraintCount).toString();
    const constraintId: string = 'C' + (++this.constraintCount).toString();
    this.constraintsLabelMap.set(constraintLabel, constraintId);
    this.constraintIds.push(constraintId);
    this.model['constraints'][constraintId] = {}; //{'max': b};
    if(min!=null) this.model['constraints'][constraintId]['min'] = min;
    if(max!=null) this.model['constraints'][constraintId]['max'] = max;
    for (const varName of Object.getOwnPropertyNames(constraint)) {
      if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {};
      this.model['variables'][varName][constraintId] = constraint[varName];
    }
  }
  setObjective(opType: String, objective: Object) {
    //this.model['optimize'] = 'objective';
    this.model['opType'] = opType;
    for (const varName of Object.getOwnPropertyNames(objective)) {
      if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {};
      this.model['variables'][varName]['objective'] = objective[varName];
    }
  }
  setBinaryVariables(vars: string[]) {
    const binaries = {};
    for(const varName of vars) binaries[varName] = 1;
    this.model['binaries'] = binaries;
  }
  setObjectiveCoefficient(varName: string, coeff: number) {
    if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {};
    this.model['variables'][varName]['objective'] = coeff;
  }
  

  getModel(): any {
    return this.model;
  }

  getVariableNames(): String[] {
   return  Object.getOwnPropertyNames(this.model['variables']);
  }

  printConstraints(lpResult: LPResult) {
    //let text: string = '';
    const varNames: string[] = Object.getOwnPropertyNames(this.model['variables']);
    for(const conName of Object.getOwnPropertyNames(this.model['constraints'])) {
      let text: string = conName + ': ';
      let conValue: number = (lpResult?0.0:null);
      for(const varName of varNames) {
        if(this.model['variables'][varName].hasOwnProperty(conName)) {
          if(this.model['variables'][varName][conName]<0) text+= ' ' + this.model['variables'][varName][conName].toString() + ' ' + varName;
          else text+= ' +' + this.model['variables'][varName][conName].toString() + ' ' + varName; 
          if(lpResult) conValue+= this.model['variables'][varName][conName] * lpResult.vars.get(varName);
        }
      }
      text+= (lpResult?' = ' + conValue.toString():'') + ' <= ' + this.model['constraints'][conName]['max'].toString();
      console.log(text);
    }
  }
  printObjective() {
    const objectiveName: string = this.model['optimize'];
    const objectiveType: string = this.model['opType'];
    let text: string = objectiveType + ': ';
    for(const varName of Object.getOwnPropertyNames(this.model['variables'])) {
      if(this.model['variables'][varName].hasOwnProperty(objectiveName)) {
        if(this.model['variables'][varName][objectiveName]<0) text+= ' ' + this.model['variables'][varName][objectiveName] + ' ' + varName;
        else text+= ' +' + this.model['variables'][varName][objectiveName] + ' ' + varName;
      }
    }
    console.log(text);
  }


}

export class LPResult {
  feasible: boolean;
  bounded: boolean;
  objective: number;
  vars: Map<String, number>;
  constructor(result: any, lpModel: LPModel) {
    this.feasible = result['feasible'];
    this.bounded = result['bounded'];
    this.objective = result['result'];
    this.vars = new Map();
    for(const varName of lpModel.getVariableNames()) {
      this.vars.set(varName, result[varName.toString()]);
      if(isNaN(result[varName.toString()])) {
        const tmp = result[varName.toString()];
        console.log('LP result yielded NaN for var ' + varName + '. Reset to 0.');
        this.vars.set(varName, 0);
      }
    }
  }
}