'use strict';

class SignupController {
    user = {};
    errors = {};
    submitted = false;

    constructor(Auth, $location, $window) {
        this.Auth = Auth;
        this.$location = $location;
        this.$window = $window;
    }

    register() {
        this.submitted = true;

        this.Auth.createUser({
                name: this.user.name,
                email: this.user.email,
                password: this.user.password
            })
            .then(() => {
                this.$location.path('/');
            })
            .catch(err => {
                this.errors = err;
            });
    };

    loginOauth(provider) {
        this.$window.location.href = '/auth/' + provider;
    };
}

angular.module('aksiteApp')
    .controller('SignupController', SignupController);
