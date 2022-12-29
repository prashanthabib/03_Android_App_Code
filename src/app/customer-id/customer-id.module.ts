import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CustomerIdPageRoutingModule } from './customer-id-routing.module';

import { CustomerIdPage } from './customer-id.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CustomerIdPageRoutingModule
  ],
  declarations: [CustomerIdPage]
})
export class CustomerIdPageModule {}
