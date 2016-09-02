'use strict';
import angular from 'angular';
import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {AuthHttp} from 'angular2-jwt';
// import {Observable} from 'rxjs/Rx';
// import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import {upgradeAdapter} from '../../app/upgrade_adapter';

type UserType = {
    // TODO: use Mongoose model
    name: string;
    email: string;
}

@Injectable()
export class User {
    static parameters = [Http, AuthHttp];
    constructor(http, authHttp) {
        this.http = http;
        this.authHttp = authHttp;
    }

    handleError(err) {
        throw err;
    }

    query() {
        return this.authHttp.get('/api/users/')
            .toPromise()
            .then(extractData)
            .catch(this.handleError);
    }
    get(user = {id: 'me'}) {
        return this.http.get(`/api/users/${user.id}`)
            .toPromise()
            .then(extractData)
            .catch(this.handleError);
    }
    create(user: UserType) {
        return this.http.post('/api/users/', user)
            .toPromise()
            .then(extractData)
            .catch(this.handleError);
    }
    changePassword(user, oldPassword, newPassword) {
        return this.authHttp.put(`/api/users/${user.id}/password`, {oldPassword, newPassword})
            .toPromise()
            .then(extractData)
            .catch(this.handleError);
    }
    remove(user) {
        return this.authHttp.delete(`/api/users/${user.id}`)
            .toPromise()
            .then(extractData)
            .catch(this.handleError);
    }
}

function extractData(res: Response) {
    if(!res.text()) return {};
    return res.json() || { };
}

upgradeAdapter.addProvider(User);

export default angular.module('factories.User', [])
    .factory('User', upgradeAdapter.downgradeNg2Provider(User))
    .name;
