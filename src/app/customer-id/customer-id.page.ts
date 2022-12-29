import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoaderService } from '../services/loader.service';
import { ApiServiceService } from '../services/api-service.service';

@Component({
  selector: 'app-customer-id',
  templateUrl: './customer-id.page.html',
  styleUrls: ['./customer-id.page.scss'],
})
export class CustomerIdPage implements OnInit {

  customerIdForm: FormGroup;
  isSubmitted = false;

  constructor(
    private router: Router,
    public formBuilder: FormBuilder,
    public toastCtrl: ToastController,
    private loader: LoaderService,
    private apiService: ApiServiceService,
  ) { }

  get errorControl() {
    return this.customerIdForm.controls;
  }

  ngOnInit() {
    this.customerIdForm = this.formBuilder.group({
      customerId: ['', [Validators.required, Validators.minLength(2), Validators.pattern('[^/]*')]],
    });
  }

  submitForm() {
    this.isSubmitted = true;
    if (!this.customerIdForm.valid) {
      this.openToast('Please provide Customer Id');
      return false;
    } else {
      this.loader.simpleLoader();
      setTimeout(() => {

        const registrationForm = {
          customerId : this.customerIdForm.value.customerId
        };


        this.apiService.createCustomerFolder(registrationForm)
        .subscribe((response) => {
          this.openToast('Customer Id Created');
          localStorage.setItem('customerId',this.customerIdForm.value.customerId);
          this.loader.dismissLoader();
          this.isSubmitted = false;
          this.customerIdForm.reset();
          this.router.navigateByUrl('/home', { replaceUrl: true });
        },
        (error) => {
          this.loader.dismissLoader();
          if(error.status.toString() === '409'){
            this.openToast('Customer Id Already Exists');
          }else{
            this.openToast('Something Went Wrong. Please try again later');
          }
        });

      },1000);
    }
  }

  async openToast(message: any) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'middle',
      cssClass: 'toast-custom-class',
    });
    toast.present();
  }

}
