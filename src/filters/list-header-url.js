(function () {
    keylolApp.filter('listHeaderUrl', ['$filter', $filter => {
        return input => {
            return $filter('uriRelocate')(input, '/both/875x225');
        };
    }]);
}());
