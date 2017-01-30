'use strict';

/*global angular, document*/

angular.module('app').service('dialogService', function ($mdDialog, $mdPanel) {

    let _this = this;

    _this.init = function () {
        let panel = $mdPanel.create({
            template: '<md-content><dialog-menu></dialog-menu></md-content>',
            attachTo: angular.element(document.body),
            position: $mdPanel.newPanelPosition().relativeTo(angular.element(document.body))
                .addPanelPosition().left('0px').top('0px'),
            onDomAdded: function () {
                panel.close();
                panel.destroy();
            }
        });

        panel.open();
    };

    _this.showContextMenu = function (position, options) {
        $mdPanel.open({
            controller: function ($scope, mdPanelRef) {
                $scope.options = options;

                $scope.select = function (value) {
                    mdPanelRef.close();
                    mdPanelRef.destroy();
                    value.call();
                };
            },
            template: `
                <md-content>
                    <dialog-menu options="options" on-select="select(value)"></dialog-menu>
                </md-content>
            `,
            attachTo: angular.element(document.body),
            position: $mdPanel.newPanelPosition().relativeTo(angular.element(document.body))
                .addPanelPosition().left(position.x + 'px').top(position.y + 'px'),
            clickOutsideToClose: true,
            clickEscapeToClose: true,
            hasBackdrop: true
        });
    };

    _this.showDialogMenu = function (title, options, closable) {
        if (typeof closable === 'undefined') {
            closable = true;
        }

        $mdDialog.show({
            controller: function ($scope) {
                $scope.title = title;
                $scope.options = options;
                $scope.closable = closable;

                $scope.select = function (value) {
                    $mdDialog.hide();
                    value.call();
                };
            },
            template: `
                <md-dialog aria-label="{{title}}">
                    <md-toolbar>
                        <dialog-toolbar title="{{title}}" closable="closable"></dialog-toolbar>
                    </md-toolbar>
                    <md-dialog-content>
                        <dialog-menu options="options" on-select="select(value)"></dialog-menu>
                    </md-dialog-content>
                </md-dialog>
            `,
            parent: angular.element(document.body),
            clickOutsideToClose: closable,
            clickEscapeToClose: closable
        });
    };

    _this.hideDialogMenu = function () {
        $mdDialog.hide();
    };

    _this.showErrorAlert = function (text) {
        $mdDialog.show($mdDialog.alert({
            title: 'Error',
            textContent: text,
            ok: 'Close'
        }));
    };

    _this.showPrompt = function (text, placeholder, resultFunction, errorFunction) {
        $mdDialog.show($mdDialog.prompt({
            title: 'Input',
            ariaLabel: 'Input',
            textContent: text,
            placeholder: placeholder,
            ok: 'OK',
            cancel: 'Cancel'
        })).then(resultFunction, errorFunction);
    };
});
