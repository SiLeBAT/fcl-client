import { AfterViewInit, Component, ElementRef, ViewChild, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromEditor from '../../state/graph-editor.reducer';
import * as editorActions from '../../state/graph-editor.actions';
import { Observable, of } from 'rxjs';
import { DialogService } from '@app/graph-editor/services/dialog.service';

declare const EditorUi: any;
declare const Editor: any;
declare const mxUtils: any;
declare const mxResources: any;
declare const Graph: any;
declare const RESOURCE_BASE: string;
declare const STYLE_PATH: string;
declare const mxLanguage: string;
declare const OPEN_URL: string;

@Component({
    selector: 'fcl-graph-editor',
    templateUrl: './graph-editor.component.html'
})
export class GraphEditorComponent implements AfterViewInit, OnDestroy {

    @ViewChild('editorContainer', { static: true }) editorContainer: ElementRef;
    @Input() graph: mxGraph;
    private editorUi: any;

    constructor(
        private store: Store<fromEditor.GraphEditorState>,
        private dialogService: DialogService
    ) {
        this.store.dispatch(new editorActions.GraphEditorActivated({ isActivated: true }));
    }

    ngAfterViewInit() {
        const that = this;
        const graphModel = that.graph ? that.graph.getModel() : null;
        const editorUiInit = EditorUi.prototype.init;

        EditorUi.prototype.init = function () {
            editorUiInit.apply(this, arguments);
            this.actions.get('export').setEnabled(false);
            // Updates action states which require a backend
            if (!Editor.useLocalStorage) {
                this.actions.get('open').setEnabled(true);
                this.actions.get('import').setEnabled(false);
                this.actions.get('save').setEnabled(true);
                this.actions.get('saveAs').setEnabled(true);
                this.actions.get('export').setEnabled(false);
            }
        };

        // Adds required resources (disables loading of fallback properties, this can only
        // be used if we know that all keys are defined in the language specific file)
        mxResources.loadDefaultBundle = false;
        const bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) ||
            mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);
        // Fixes possible asynchronous requests
        mxUtils.getAll([bundle, STYLE_PATH + '/default.xml'], (xhr: any) => {
            // Adds bundle text to resources
            mxResources.parse(xhr[0].getText());

            // Configures the default graph theme
            const themes: any = new Object();
            themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();

            // Main
            const editor = new Editor(false, themes, graphModel);

            // tslint:disable-next-line
            this.editorUi = new EditorUi(editor, that.editorContainer.nativeElement);
            if (graphModel) {
                graphModel.endUpdate();
            }
        }, function () {
            document.body.innerHTML =
                '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
        });

    }

    ngOnDestroy() {
        this.store.dispatch(new editorActions.GraphEditorActivated({ isActivated: false }));
    }

    canDeactivate(): Observable<boolean> {
        const diagramIsEmpty = this.editorUi ? this.editorUi.isDiagramEmpty() : true;
        if (!diagramIsEmpty) {
            const message = 'Leave Site? \nChanges you made may not be saved.';
            return this.dialogService.confirm(message);
        } else {
            return of(true);
        }
    }
}
