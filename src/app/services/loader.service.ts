import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  currentLoading = null;

  constructor(public loadingController: LoadingController) { }

  async simpleLoader() {
    if (this.currentLoading != null) {
      this.currentLoading.dismiss();
    }

  this.currentLoading = await this.loadingController.create({
    message: 'Loading...',
    cssClass:'loader-css-class',
    spinner: 'bubbles'
  });

  return await this.currentLoading.present();

}

async dismissLoader() {

  if (this.currentLoading != null) {

    await this.loadingController.dismiss();
    this.currentLoading = null;
}
return;
}

}
