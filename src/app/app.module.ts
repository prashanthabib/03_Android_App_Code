import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';
import { BatteryStatus } from '@awesome-cordova-plugins/battery-status/ngx';
import { CameraPreview } from '@awesome-cordova-plugins/camera-preview/ngx';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { HttpClientModule } from '@angular/common/http';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule

  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    Insomnia,
    BatteryStatus,
    CameraPreview,
    Camera,
    AndroidPermissions,
    BluetoothSerial,
    FileTransfer,
    File
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
