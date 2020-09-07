import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Import Containers
import { DefaultLayoutComponent } from './containers';

import { P404Component } from './views/error/404.component';
import { P500Component } from './views/error/500.component';
import { LoginComponent } from './views/login/login.component';


import { AngularFireAuthGuard } from '@angular/fire/auth-guard';
import { UserComponent } from './views/user/user.component';
import { OrganizationComponent } from './views/organization/organization.component';
import { NewannotationComponent } from './views/newannotation/newannotation.component';
import { FaqComponent } from './components/faq/faq.component';
import { ListComponent } from './views/list/list.component';
import { DetailComponent } from './views/detail/detail.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/newannotation/empty',
    pathMatch: 'full'
  },
  {
    path: '404',
    component: P404Component,
    data: {
      title: 'Page 404'
    }
  },
  {
    path: '500',
    component: P500Component,
    data: {
      title: 'Page 500'
    }
  },
  {
    path: 'login',
    component: LoginComponent,
    data: {
      title: 'Login Page'
    }
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'BAT'
    },
    children: [
      {
        path: 'list',
        data: {
          title: 'List'
        },
        component: ListComponent
      },
      {
        path: 'release-notes',
        data: {
          title: 'List'
        },
        component: ListComponent
      },
      {
        path: 'faq',
        data: {
          title: 'FAQ'
        },
        component: FaqComponent
      },
      {
        path: 'user',
        data: {
          title: 'User Details'
        },
        component: UserComponent
      },
      {
        path: 'organization',
        data: {
          title: 'Organization Details'
        },
        component: OrganizationComponent
      },
      {
        path: 'detail/:name',
        data: {
          title: 'Detail'
        },
        component: DetailComponent
      },
      {
        path: 'newannotation/:mode',
        data: {
          title: 'New'
        },
        component: NewannotationComponent
      },
      {
        path: 'newannotation/:mode/:name',
        data: {
          title: 'Edit'
        },
        canActivate: [AngularFireAuthGuard],
        component: NewannotationComponent
      }
    ]
  },
  { path: '**', component: P404Component }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
