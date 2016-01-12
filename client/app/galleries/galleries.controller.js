'use strict';

export default class GalleriesController {
    /*@ngInject*/
    constructor($http, Gallery, $state) {
        this.$state = $state;

        this.galleries = Gallery.query(() => {
            _.forEach(this.galleries, gallery => {
                $http.get('/api/photos/' + gallery.featuredId)
                    .success(photo => {
                        gallery.featuredImgId = photo.thumbnailId;
                    });
            });
        });
    }

    goToGallery(id) {
        this.$state.go('gallery', {galleryId: id});
    }
}