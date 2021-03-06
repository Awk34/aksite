import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GalleryListComponent } from './galleryList.component';
import { GalleryComponent } from './gallery/gallery.component';

const routes: Routes = [{
    path: '',
    component: GalleryListComponent,
}, {
    path: ':id',
    component: GalleryComponent,
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class GalleriesRoutingModule {}
