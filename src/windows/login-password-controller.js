﻿(function () {
    keylolApp.controller("LoginPasswordController", [
        "$scope", "close", "$http", "utils", "union", "apiEndpoint", "window", "notification", "$element", "$timeout", "$route",
        ($scope, close, $http, utils, union, apiEndpoint, window, notification, $element, $timeout, $route) => {
            $scope.error = {};
            $scope.errorDetect = utils.modelErrorDetect;

            $scope.vm = {
                EmailOrIdCode: "",
                Password: "",
                GeetestChallenge: "",
                GeetestSeccode: "",
                GeetestValidate: "",
            };

            let geetestResult;
            const geetest = utils.createGeetest("float");
            $scope.geetestId = geetest.id;
            geetest.ready.then(gee => {
                $timeout(() => {
                    const geetestDom = $(`#geetest-${geetest.id}`, $element);
                    gee.appendTo(geetestDom);
                });
            });
            function useGeetestResult (gee) {
                geetestResult = gee.getValidate();
                $scope.vm.GeetestChallenge = geetestResult.geetest_challenge;
                $scope.vm.GeetestSeccode = geetestResult.geetest_seccode;
                $scope.vm.GeetestValidate = geetestResult.geetest_validate;
            }
            geetest.success.then(useGeetestResult);

            $scope.cancel = function () {
                close();
            };

            $scope.switchToLoginSteamWindow = function () {
                window.show({
                    templateUrl: "src/windows/login-steam.html",
                    controller: "LoginSteamController",
                });
                close();
            };

            $scope.submitLock = false;
            $scope.submit = function () {
                if ($scope.submitLock)
                    return;
                $scope.submitLock = true;
                $scope.error = {};
                $timeout(() => {
                    if (!$scope.vm.EmailOrIdCode) {
                        $scope.error["vm.EmailOrIdCode"] = "Email or UIC cannot be empty.";
                    }
                    if (!$scope.vm.Password) {
                        $scope.error["vm.Password"] = "Password cannot be empty.";
                    }
                    if (!geetestResult) {
                        $scope.error.authCode = true;
                    }
                    if (!$.isEmptyObject($scope.error)) {
                        $scope.submitLock = false;
                        return;
                    }
                    $http.post(`${apiEndpoint}login`, $scope.vm)
                        .then(response => {
                            union.$localStorage.login = response.data;
                            notification.success("登录成功，欢迎回到其乐");
                            close();
                        }, response => {
                            switch (response.status) {
                                case 400:
                                    $scope.error = response.data.ModelState;
                                    geetestResult = null;
                                    geetest.refresh().then(useGeetestResult);
                                    break;
                                default:
                                    notification.error("发生未知错误，请重试或与站务职员联系", response);
                            }
                            $scope.submitLock = false;
                        });
                });
            };
        },
    ]);
}());
