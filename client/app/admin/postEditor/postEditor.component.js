'use strict';
import { Component } from '@angular/core';
import { Response, Headers } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { StateService } from 'ui-router-ng2';
import { FileUploader } from 'ng2-file-upload';
import { AuthService } from '../../../components/auth/auth.service';

import {
    wrapperLodash as _,
    mixin,
    map,
    trim
} from 'lodash-es';
mixin(_, {
    map,
    trim
});
import { Converter } from 'showdown';
const converter = new Converter();

function jsonToURI(json) {
    return encodeURIComponent(JSON.stringify(json));
}

@Component({
    selector: 'post-editor',
    template: require('./postEditor.html'),
    styles: [require('!!raw!sass!./postEditor.scss')]
})
export class PostEditorComponent {
    loadingPost = true;
    submitted = false;
    post = {author: {}};

    static parameters = [AuthHttp, StateService, AuthService, FileUploader];
    constructor(authHttp: AuthHttp, stateService: StateService, authService: AuthService, fileUploader: FileUploader) {
        this.AuthHttp = authHttp;
        this.StateService = stateService;
        this.AuthService = authService;
        // this.fileUploadService = fileUploader;
        this.params = this.StateService.params;

        // this.$sce = $sce;
        // this.Upload = Upload;
        // this.Auth = Auth;
    }

    async ngOnInit() {
        this.currentUser = await this.AuthService.getCurrentUser(true);

        if(!this.params.postId || this.params.postId === 'new') {
            this.post = {
                title: 'Untitled Post',
                subheader: undefined,
                alias: undefined,
                hidden: false,
                author: {
                    name: this.currentUser.name,
                    id: this.currentUser._id,
                    imageId: this.currentUser.imageId,
                    smallImageId: this.currentUser.smallImageId
                },
                date: new Date(),
                imageId: undefined,
                content: undefined,
                categories: []
            };
            this.loadingPost = false;
            this.newPost = true;
        } else {
            this.AuthHttp.get(`/api/posts/${this.params.postId}`)
                .toPromise()
                .then(function(res: Response) {
                    if(!res.text()) return {};
                    return res.json() || {};
                })
                .then(data => {
                    console.log(data);
                    this.post = data;
                    this.post.categories = this.post.categories.join(', ');
                    this.filename = this.post.imageId;
                    if(this.post.hidden !== true && this.post.hidden !== false) {
                        this.post.hidden = false;
                    }
                })
                .catch(({data, status}) => {
                    this.error = {data, status};
                })
                .then(() => {
                    this.loadingPost = true;
                });
        }
        // this.fileUploadService.setOptions({
        //     autoUpload: false
        // });
    }

    markedContent() {
        try {
            return converter.makeHtml(this.post.content || '');
        } catch(e) {
            return '<h1 class=\"text-danger\">Parsing Error</h1>';
        }
    }

    cancel() {
        if(this.upload) this.upload.abort();
        this.$state.go('admin.blog');
    }

    onFileSelect($files) {
        //$files: an array of files selected, each file has name, size, and type.
        var file = $files[0];

        if(!file) {
            this.filename = null;
            this.fileToUpload = null;
        } else {
            this.filename = file.name;
            this.fileToUpload = file;
        }
    }

    savePost(form) {
        // if(!form.$valid) return;

        this.submitted = true;

        var options = {
            url: this.newPost ? 'api/posts/' : `api/posts/${this.post._id}`,
            method: this.newPost ? 'POST' : 'PUT',
            fields: {
                title: this.post.title,
                subheader: this.post.subheader,
                alias: this.post.alias,
                author: this.post.author,
                date: this.post.date,
                content: this.post.content,
                categories: this.post.categories,
                hidden: this.post.hidden,
                newImage: false,
            }
        };

        this.AuthHttp.request(options.url, {
            method: options.method,
            body: options.fields,
        })
            .toPromise()
            .then(console.log);

        return;

        // Uploading image
        if(this.fileToUpload && !(this.filename === this.post.imageId || this.filename === null)) {
            if(!this.newPost) {
                options.fields.newImage = true;
            }

            options.file = this.fileToUpload;
            options.headers = {
                'Content-Type': this.fileToUpload.type
            };
        }

        // convert categories string to array of strings
        if(typeof options.fields.categories === 'string') {
            options.fields.categories = _.map(options.fields.categories.split(','), _.trim);
        }

        this.upload = this.Upload.upload(options);

        this.upload
            .progress(evt => {
                this.progress = (100.0 * (evt.loaded / evt.total)).toFixed(1);
            })
            .then(({data, status}) => {
                this.progress = undefined;
                console.log(status);
                console.log(data);
                this.$state.go('admin.blog');
            })
            .catch(({data, status}) => {
                this.progress = undefined;
                console.log(status);
                console.log(data);
            });

        this.upload
            .xhr(xhr => {
                this.abort = function() {
                    xhr.abort();
                };
            });
    }
}
