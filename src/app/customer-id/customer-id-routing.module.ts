import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomerIdPage } from './customer-id.page';

const routes: Routes = [
  {
    path: '',
    component: CustomerIdPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerIdPageRoutingModule {}
