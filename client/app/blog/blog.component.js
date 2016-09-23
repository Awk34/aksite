import {Component} from '@angular/core';
import {NgModel} from '@angular/forms';
import {CORE_DIRECTIVES, FORM_DIRECTIVES} from '@angular/common';
import {PAGINATION_DIRECTIVES} from 'ng2-bootstrap';
import {
    wrapperLodash as _,
    mixin,
    forEach
} from 'lodash-es';
mixin(_, {
    forEach
});
import moment from 'moment';
import { Converter } from 'showdown';
const converter = new Converter();

@Component({
    selector: 'blog',
    template: require('./blog.html'),
    styles: [require('!!raw!sass!./blog.scss')],
    directives: [PAGINATION_DIRECTIVES, CORE_DIRECTIVES, FORM_DIRECTIVES, NgModel]
})
export class BlogComponent {
    loadingItems = true;
    noItems = false;
    currentPage;
    pagesize = 10;
    collectionSize = 0;
    posts = [];

    static parameters = ['$http', '$stateParams', '$state'];
    constructor($http, $stateParams, $state) {
        this.$http = $http;
        this.$stateParams = $stateParams;
        this.$state = $state;

        $state.reloadOnSearch = false;

        this.currentPage = parseInt($stateParams.page, 10) || 1;
        this.pagesize = $stateParams.pagesize || 10;
    }

    ngOnInit() {
        return this.getPageData();
    }

    pageChanged({page}) {
        this.currentPage = page;
        this.$state.transitionTo('blog', {page, pagesize: this.pagesize}, { notify: false, reload: false });

        return this.getPageData();
    }

    getPageData() {
        return this.$http.get(`api/posts?page=${this.currentPage}&pagesize=${this.pagesize}`)
            .then(({data}) => {
                this.pages = data.pages;
                this.collectionSize = data.numItems;
                this.posts = data.items;
                _.forEach(this.posts, post => {
                    post.date = moment(post.date).format('LL');
                    post.subheader = converter.makeHtml(post.subheader);
                });
                this.noItems = data.items.length <= 0;
                document.body.scrollTop = document.documentElement.scrollTop = 0;
            })
            .catch(function(err) {
                console.log(err);
            });
    }

    sref(id: string) {
        this.$state.go('post', {postId: id});
    }
}
