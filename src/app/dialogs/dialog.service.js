'use strict';

/*global angular*/

angular.module('app').service('dialogService', function($mdDialog, $mdPanel) {

    var _this = this;

    _this.showContextMenu = function(position, options) {
        $mdPanel.open({
            controller: function($scope, mdPanelRef) {
                $scope.options = options;

                $scope.select = function(value) {
                    mdPanelRef.close();
                    mdPanelRef.destroy();
                    value.call();
                };
            },
            template: '<md-content><context-menu options="options" on-select="select(value)"></context-menu></md-content>',
            attachTo: angular.element(document.body),
            position: $mdPanel.newPanelPosition().absolute().left(position.x + 'px').top(position.y + 'px'),
            clickOutsideToClose: true,
            clickEscapeToClose: true,
            hasBackdrop: true
        });
    };

    _this.showDialogMenu = function(title, options) {
        $mdDialog.show({
            controller: function($scope) {
                $scope.title = title;
                $scope.options = options;

                $scope.select = function(value) {
                    $mdDialog.hide();
                    value.call();
                };
            },
            template: `
                <md-dialog aria-label="{{title}}">
                <md-toolbar><dialog-toolbar title="{{title}}"></dialog-toolbar></md-toolbar>
                <md-dialog-content><context-menu options="options" on-select="select(value)"></context-menu></md-dialog-content>
                </md-dialog>
            `,
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            clickEscapeToClose: true
        });
    };

    _this.showErrorAlert = function(text) {
        $mdDialog.show($mdDialog.alert({
            title: 'Error',
            textContent: text,
            ok: 'Close'
        }));
    };
});
