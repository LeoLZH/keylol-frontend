(function () {
    "use strict";

    keylolApp.factory("window", [
        "$compile", "$controller", "$rootScope", "$q", "$window", "$templateRequest", "$timeout", "$animate",
        function ($compile, $controller, $rootScope, $q, $window, $templateRequest, $timeout, $animate) {

            function WindowService() {
                var self = this;

                var bodyOriginalPaddingRight;
                var scrollBarWidth = function () {
                    var scrollDiv = document.createElement("div");
                    scrollDiv.className = "scrollbar-measure";
                    $(document.body).append(scrollDiv);
                    var width = scrollDiv.offsetWidth - scrollDiv.clientWidth;
                    $(scrollDiv).remove();
                    return width;
                };

                var adjustScrollBar = function () {
                    var $body = $(document.body);
                    if ($body.find("main[ng-view] > window").length > 0) {
                        if (!$body.hasClass("body-window-open")) {
                            bodyOriginalPaddingRight = document.body.style.paddingRight || "";

                            // Test if body is overflowing
                            var fullWindowWidth = $window.innerWidth;
                            if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
                                var documentElementRect = document.documentElement.getBoundingClientRect();
                                fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
                            }
                            if (document.body.clientWidth < fullWindowWidth) { // Body is overflowing
                                // Set body padding-right
                                var bodyPaddingRight = parseInt(($body.css("padding-right") || 0), 10);
                                $body.css("padding-right", bodyPaddingRight + scrollBarWidth() + "px");
                            }

                            $body.addClass("body-window-open");
                        }
                    } else {
                        if ($body.hasClass("body-window-open")) {
                            $body.css("padding-right", bodyOriginalPaddingRight);
                            $body.removeClass("body-window-open");
                        }
                    }
                };

                self.show = function (options) {
                    options = $.extend({
                        adjustScrollBar: true,
                        global: false,
                        delayAppend: false
                    }, options);

                    //  Create a deferred we'll resolve when the window is ready.
                    var deferred = $q.defer();

                    //  If a 'controllerAs' option has been provided, we change the controller
                    //  name to use 'as' syntax. $controller will automatically handle this.
                    var controllerName = options.controller;
                    if (options.controllerAs) {
                        controllerName = controllerName + " as " + options.controllerAs;
                    }

                    var create = function (template) {
                        var scope = $rootScope.$new();
                        var linkFn = $compile(template);
                        var $element = linkFn(scope);

                        if (options.styles) {
                            $element.css(options.styles);
                        }

                        var closeDeferred = $q.defer();
                        var close = function (result) {
                            //  Resolve the 'close' promise.
                            closeDeferred.resolve(result);
                            $animate.leave($element).then(function () {
                                //  We can now clean up the scope and remove the element from the DOM.
                                scope.$destroy();
                                if (options.adjustScrollBar)
                                    adjustScrollBar();
                            });
                        };

                        var inputs = {
                            $scope: scope,
                            $element: $element,
                            close: close
                        };

                        //  If we have provided any inputs, pass them to the controller.
                        if (options.inputs) {
                            $.extend(inputs, options.inputs);
                        }

                        //  Create the controller, explicitly specifying the scope to use.
                        var controller;
                        if (controllerName)
                            controller = $controller(controllerName, inputs);

                        // Append
                        var appendWindow = function () {
                            var main = options.global ? document.body : $("main[ng-view]")[0];
                            $animate.enter($element, main, main.lastChild);
                            if (options.adjustScrollBar)
                                adjustScrollBar();

                            deferred.resolve({
                                controller: controller,
                                scope: scope,
                                $element: $element,
                                close: closeDeferred.promise,
                                closeNow: close
                            });
                        };

                        if (options.delayAppend)
                            $timeout(appendWindow);
                        else
                            appendWindow();
                    };

                    if (options.template) {
                        create(options.template)
                    } else if (options.templateUrl) {
                        $templateRequest(options.templateUrl).then(function (result) {
                            create(result);
                        });
                    }

                    return deferred.promise;
                };
            }

            return new WindowService();
        }
    ]);
})();