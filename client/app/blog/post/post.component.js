import { Component } from '@angular/core';
import Raven from 'raven-js';

import moment from 'moment';
import { Converter } from 'showdown';
const converter = new Converter();

@Component({
    selector: 'post',
    template: require('./post.html'),
    styles: [require('!!raw!sass!./post.scss'), require('!!raw!sass!../blog.scss')]
})
export class PostComponent {
    error;
    post = {author: {}};

    static parameters = ['$rootScope', '$stateParams', '$http', '$sce'];
    constructor($rootScope, $stateParams, $http, $sce) {
        this.postId = $stateParams.postId;

        this.$http = $http;
        this.$rootScope = $rootScope;
        this.$sce = $sce;
    }

    ngOnInit() {
        return this.$http.get(`api/posts/${this.postId}`)
            .then(({data: post}) => {
                this.post = post;

                this.$rootScope.title += ` | ${post.title}`;

                this.post.content = this.$sce.trustAsHtml(converter.makeHtml(this.post.content));
                this.post.date = moment(this.post.date).format('LL');
            })
            .catch(err => {
                Raven.captureException(new Error(JSON.stringify(err)));
                console.log(err);
                this.error = err;
            });
    }
}
