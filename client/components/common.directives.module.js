import angular from 'angular';
import {upgradeAdapter} from '../app/upgrade_adapter';

import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';

export default angular.module('directives', [])
    .directive('navbar', upgradeAdapter.downgradeNg2Component(NavbarComponent))
    .directive('footer', upgradeAdapter.downgradeNg2Component(FooterComponent))
    .name;
