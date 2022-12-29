import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { Router } from '@angular/router';
import { FCM } from 'cordova-plugin-fcm-with-dependecy-updated/ionic';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private androidPermissions: AndroidPermissions,
    private router: Router
  ) {

    this.initializeApp();

  }

  initializeApp(){

    this.platform.ready().then(() => {

      const list = [
        this.androidPermissions.PERMISSION.CAMERA,
        this.androidPermissions.PERMISSION.BLUETOOTH,
        this.androidPermissions.PERMISSION.BLUETOOTH_ADMIN,
        this.androidPermissions.PERMISSION.BLUETOOTH_ADVERTISE,
        this.androidPermissions.PERMISSION.BLUETOOTH_CONNECT,
        this.androidPermissions.PERMISSION.BLUETOOTH_SCAN,
        this.androidPermissions.PERMISSION.INTERNET,
        this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE,
        this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE
      ];

      for(const permission of list){
        this.androidPermissions.checkPermission(permission).then(
          result => {
            if(!result.hasPermission){
              this.androidPermissions.requestPermission(permission);
            }
          },
          err => {
            this.androidPermissions.requestPermission(permission);
          }
        );
      }

      if('customerId' in localStorage){
        this.router.navigateByUrl('/home');
     } else {
        this.router.navigateByUrl('/');
     }

    });
  }

}
