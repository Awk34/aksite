import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { AUTH_PROVIDERS } from 'angular2-jwt';
// import { AppComponent } from './app.component';
import { MainModule } from './main/main.ng2module';
import { DirectivesModule } from '../components/common.directives.ng2module';
import { AuthModule } from '../components/auth/auth.ng2module';
import { AccountModule } from './account/account.ng2module';
import { ProjectsModule } from './projects/projects.ng2module';
import { GalleriesModule } from './galleries/galleries.ng2module';
import { BlogModule } from './blog/blog.ng2module';

@NgModule({
    providers: [AUTH_PROVIDERS],
    imports: [
        BrowserModule,
        HttpModule,
        MaterialModule.forRoot(),
        MainModule,
        DirectivesModule,
        AuthModule,
        AccountModule,
        ProjectsModule,
        GalleriesModule,
        BlogModule,
    ],
    // declarations: [
    //     AppComponent,
    // ],
    // bootstrap: [AppComponent]
})
export class AppModule {}
