import { Component, OnInit, NgZone } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { ToastController } from '@ionic/angular';

import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';
import { BatteryStatus } from '@awesome-cordova-plugins/battery-status/ngx';
import { LoaderService } from '../services/loader.service';
import { CameraPreview, CameraPreviewOptions, CameraPreviewPictureOptions } from '@awesome-cordova-plugins/camera-preview/ngx';

import { FileTransfer, FileUploadOptions, FileTransferObject } from '@awesome-cordova-plugins/file-transfer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';

import { ApiServiceService } from '../services/api-service.service';

import { FCM } from 'cordova-plugin-fcm-with-dependecy-updated/ionic';
import { Platform, AlertController } from '@ionic/angular';

export interface FILE {
  name: string;
  filepath: string;
  size: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  result = false;
  isBluetoothEnabled = false;
  isBluetoothDeviceConnected = false;
  bluetoothDeviceConnectedName: any;
  devices: any;
  statusMessage: string;
  customerId: any;
  batteryStatusLevel = 0;
  isPlugged: any;
  isLoading = false;
  hideButton = false;
  cameraMode = 'front';
  cameraModeDisplay = 'Front';
  success = '1';
  failure = '0';
  autoConnect = false;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  IMAGE_PATH: any;
  isCameraStarted = false;

  private blob: Blob;

  constructor(
    private bluetoothSerial: BluetoothSerial,
    public toastCtrl: ToastController,
    private insomnia: Insomnia,
    private batteryStatus: BatteryStatus,
    private loader: LoaderService,
    private cameraPreview: CameraPreview,
    private ngZone: NgZone,
    private apiService: ApiServiceService,
    private transfer: FileTransfer,
    private file: File,
    public plt: Platform,
    public alertController: AlertController,
  ) {

    this.plt.ready().then(
      () => {

        FCM.onNotification().subscribe(data => {
          this.bluetoothSerial.write(data.body).then(
            (success) => {
              FCM.clearAllNotifications().then();
            },
            (failure) => {
              FCM.clearAllNotifications().then();
            }
          );
        });

        FCM.onTokenRefresh().subscribe(token => {
          this.uploadFCMToken(token);
        });

      });

  }

  ngOnInit() {

  }

  ionViewDidEnter(){
    this.isLoading = true;
    this.loader.simpleLoader();

    setTimeout(() => {
      this.customerId = localStorage.getItem('customerId');
      console.log(localStorage.getItem('autoConnect'));

      if(localStorage.getItem('autoConnect') === '1'){
        this.ngZone.run(() => {
          this.autoConnect = true;
        });
      }else{
        this.ngZone.run(() => {
          this.autoConnect = false;
        });
      }
      this.checkBluetoothEnabled();
      this.insomnia.keepAwake().then(
        (success) => {},
        (failure) => {this.showMessage('Screen Will not be Awake');}
      );

        this.batteryStatus.onChange().subscribe(
          (status) => {
            this.ngZone.run(() => {
              this.batteryStatusLevel = status.level;
            this.isPlugged = status.isPlugged;
            });
          },
          (error) => {
            this.showMessage('Battery Status Reading Error = '+error);
          }
        );

        this.checkAndCreateDir();
        this.getToken();
      this.loader.dismissLoader();
      this.isLoading = false;
    },1000);
  }

  getToken(){
    FCM.getToken().then(
      (token) => {this.uploadFCMToken(token);},
      (err) => {}
    );
  }

  uploadFCMToken(token: any){

    this.file.checkFile(this.file.externalApplicationStorageDirectory+'/Falatech', 'token.txt').then(
      (res) => {

        this.blob = new Blob([token], { type: 'text/plain' });
        this.file.writeFile(this.file.externalApplicationStorageDirectory+'/Falatech', 'token.txt',
        this.blob, {replace: true, append: false}).then(
          (success) => {
            const filePath = success.nativeURL.toString();
            this.apiService.uploadFCMToken(filePath).then(
              (fileUploadSuccess) => {},
              (fileUploadFailure) => {}
            );

          },
          (failure) => {}
        );

      },
      (err) => {
        this.file.createFile(this.file.externalApplicationStorageDirectory+'/Falatech', 'token.txt',true).then(
        res => {
          this.blob = new Blob([token], { type: 'text/plain' });
          this.file.writeFile(this.file.externalApplicationStorageDirectory+'/Falatech', 'token.txt',
          this.blob, {replace: true, append: false}).then(
            (success) => {
              const filePath = success.nativeURL.toString();
              this.apiService.uploadFCMToken(filePath).then(
                (fileUploadSuccess) => {},
                (fileUploadFailure) => {}
              );
            },
            (failure) => {}
          );
        },
        error => {}
        );
      }
    );

  }

  checkAndCreateDir(){
    this.file.checkDir(this.file.externalApplicationStorageDirectory, 'FalaTech').then(
      response => {
      }, error => {
        this.file.createDir(this.file.externalApplicationStorageDirectory, 'FalaTech', false).then(
          response1 => {
        }).catch(err => {
        });
      }
    );
   }

  openBluetoothSettings(){
    this.bluetoothSerial.showBluetoothSettings().then(
      (success) => {this.showMessage('BluetoothSettings Opened');},
      (error) => {this.showMessage('Can\'t Open Bluetooth Settings, Error = '+error);}
    );
  }

  checkBluetoothEnabled() {
    this.bluetoothSerial.isEnabled().then(success => {
      this.isBluetoothEnabled = true;
      this.showMessage('Bluetooth is Enabled');
      this.listPairedDevices();
    }, error => {
      this.isBluetoothEnabled = false;
      this.showMessage('Please Enable Bluetooth');
    });
  }

  setAutoConnect(){
    console.log('AutoConnect Status = '+this.autoConnect);
    this.autoConnect = !this.autoConnect;
    if(this.autoConnect){
      localStorage.setItem('autoConnect','1');
    }else{
      localStorage.setItem('autoConnect','0');
    }
  }

  listPairedDevices() {
    this.bluetoothSerial.list().then(success => {
      this.devices = success;
    }, error => {
      this.showMessage('Connected Devices Listing Error = '+error);
    });
  }

  disconnectDevice() {

    this.alertController.create({
      header: 'Disconnect Bluetooth Device',
      message: 'You are about to disconnect the bluetoth device. Do you want to continue?',
      backdropDismiss: false,
      buttons: [{
        text: 'No',
        role: 'cancel',
        handler: () => {
        }
      }, {
        text: 'Yes',
        handler: () => {
          this.bluetoothSerial.disconnect();
          this.isBluetoothDeviceConnected = false;
          this.showMessage('Device Disconnected');
        }
      }]
    })
      .then(alert => {
        alert.present();
      });
  }

  connectDevice(address,name){

    this.isLoading = true;
    this.loader.simpleLoader();
    setTimeout(() => {

    this.bluetoothSerial.connect(address).subscribe(
      (connectRes) => {
        localStorage.setItem('lasConnectedDeviceAdress',address);
        localStorage.setItem('lasConnectedDeviceName',name);
        this.isBluetoothDeviceConnected = true;
        this.bluetoothDeviceConnectedName = name;
        this.loader.dismissLoader();
        this.isLoading = false;

        this.bluetoothSerial.write('START').then(
          (success) => {},
          (failure) => {}
        );

        this.bluetoothSerial.subscribeRawData().subscribe(
          (readData) => {
            this.bluetoothSerial.read().then(
              (data) => {
                  if(data === 'Camera On'){
                      this.isCameraStarted = false;
                      this.IMAGE_PATH = '';

                      setTimeout(() => {
                      this.startCamera();
                    this.isCameraStarted = true;
                    },1000);

                      setTimeout(() => {
                        if(this.isCameraStarted){
                          this.takePicture();
                        }
                      },3000);

                      setTimeout(() => {
                        if(this.isCameraStarted){
                          this.stopCamera();
                          this.isCameraStarted = false;
                        }
                      },5000);
                  }
                  else if(data === 'Camera Change'){
                       this.switchCamera();
                  }
                  else if(data === 'Battery Status'){
                    this.bluetoothSerial.write(''+this.batteryStatusLevel).then(
                      (success) => {},
                      (failure) => {}
                    );
                  }
                  else if(data === 'START'){
                    this.startStopImageUpload('Start');
                  }
                  else if(data === 'STOP'){
                    this.startStopImageUpload('Stop');
                  }
                  else if(data === 'TIME'){

                    const currentdate = new Date();
                    const time = 'TIME : ' + currentdate.getDay() + ':'
                                + currentdate.getHours()  + ':'
                                + currentdate.getMinutes() + ' $';

                    this.bluetoothSerial.write(time).then(
                      (success) => {},
                      (failure) => {}
                    );

                  }
                  else{
                    this.showMessage('Data Received is not in correct Format. Received Data = '+data);
                  }
              },
              (dataErr) => {
                this.showMessage('Read Data Error = '+dataErr);
              }
            );
          },
          (dataErr) => {
            this.showMessage('Data Reading Err = '+dataErr);
          }
        );
      },
      (connectErr) => {
        this.ngZone.run(() => {
          this.isBluetoothDeviceConnected = false;
        });
        this.showMessage('Device Connect Error = '+connectErr);
          if(localStorage.getItem('autoConnect') === '1'){
            localStorage.setItem('lasConnectedDeviceAdress',address);
            localStorage.setItem('lasConnectedDeviceName',name);
            this.connectDevice(localStorage.getItem('lasConnectedDeviceAdress'),localStorage.getItem('lasConnectedDeviceName'));
          }
      }
    );
  });
  }

startCamera() {

  const cameraPreviewOpts: CameraPreviewOptions = {
      x: 2,
      y: 240,
      width: window.screen.width - 4,
      height: 400,
      camera: this.cameraMode,
      toBack: false,
      previewDrag: true,
      tapPhoto: true,
      tapFocus: true,
      alpha: 1,
      storeToFile: false
    };

    this.cameraPreview.startCamera(cameraPreviewOpts).then(
      (res) => {
      },
      (err) => {
        this.showMessage('Error in Opening Camera '+ err);
        this.bluetoothSerial.write(this.failure).then(
          (success) => {},
          (failure) => {}
        );
      });
}

startCameraManaul() {

  this.isCameraStarted = true;

  const cameraPreviewOpts: CameraPreviewOptions = {
      x: 2,
      y: 240,
      width: window.screen.width - 4,
      height: 400,
      camera: this.cameraMode,
      toBack: false,
      previewDrag: true,
      tapPhoto: true,
      tapFocus: true,
      alpha: 1,
      storeToFile: false
    };

    this.cameraPreview.startCamera(cameraPreviewOpts).then(
      (res) => {
      },
      (err) => {
        this.showMessage('Error in Opening Camera '+ err);
      });
}

switchCamera(){
  if(this.cameraMode === 'front'){
    this.ngZone.run(() => {
      this.cameraMode = 'back';
    this.cameraModeDisplay = 'Back';
    this.bluetoothSerial.write(this.success).then(
      (success) => {},
      (failure) => {}
    );
    });
  }else{
    this.ngZone.run(() => {
      this.cameraMode = 'front';
    this.cameraModeDisplay = 'Front';
    this.bluetoothSerial.write(this.success).then(
      (success) => {},
      (failure) => {}
    );
    });
  }
}


switchCameraManaul(){
  if(this.cameraMode === 'front'){
      this.cameraMode = 'back';
    this.cameraModeDisplay = 'Back';
  }else{
      this.cameraMode = 'front';
    this.cameraModeDisplay = 'Front';
  }
}

takePicture() {

  const pictureOpts: CameraPreviewPictureOptions = {
    // width: 1280,
    // height: 1280,
    quality: 100
  };

  this.cameraPreview.takePicture(pictureOpts).then((imageData) => {

    this.ngZone.run(() => {
      this.IMAGE_PATH = 'data:image/jpeg;base64,' + imageData;
    });

    const currentdate = new Date();
    const date = currentdate.getDate() + '-'
              + (currentdate.getMonth()+1)  + '-'
              + currentdate.getFullYear();

    const filename = currentdate.getHours() + '-'
    + currentdate.getMinutes() + '-'
    + currentdate.getSeconds() + '.jpeg';

   this.writeFile(this.IMAGE_PATH, 'FalaTech', filename, date);

   if(!this.result){
    this.showMessage('Image not Uploaded');
    this.bluetoothSerial.write(this.failure).then(
      (success) => {},
      (failure) => {}
    );
   }else{
    this.showMessage('Image Uploaded');
   }

  }, (err) => {
    this.showMessage('Error in Taking Picture = '+err);
    this.bluetoothSerial.write(this.failure).then(
      (success) => {},
      (failure) => {}
    );
  });
}

takePictureManaul() {

  const pictureOpts: CameraPreviewPictureOptions = {
    // width: 1280,
    // height: 1280,
    quality: 100
  };

  this.cameraPreview.takePicture(pictureOpts).then((imageData) => {

    this.ngZone.run(() => {
      this.IMAGE_PATH = 'data:image/jpeg;base64,' + imageData;
    });

    const currentdate = new Date();
    const date = currentdate.getDate() + '-'
              + (currentdate.getMonth()+1)  + '-'
              + currentdate.getFullYear();

    const filename = currentdate.getHours() + '-'
    + currentdate.getMinutes() + '-'
    + currentdate.getSeconds() + '.jpeg';

   this.writeFile(this.IMAGE_PATH, 'FalaTech', filename, date);

   if(!this.result){
    this.showMessage('Image not Uploaded');
   }else{
    this.showMessage('Image Uploaded');
   }

  }, (err) => {
    this.showMessage('Error in Taking Picture = '+err);
  });
}

base64ToImage(dataURI) {
  const fileDate = dataURI.split(',');
  // const mime = fileDate[0].match(/:(.*?);/)[1];
  const byteString = atob(fileDate[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const int8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    int8Array[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
  return blob;
}

stopCamera() {
  this.cameraPreview.stopCamera().then(
    (success) => {},
    (error) => {}
  );
}

stopCameraManaul() {

  if(this.isCameraStarted){
    this.cameraPreview.stopCamera().then(
      (success) => { this.isCameraStarted = false;},
      (error) => {}
    );

  }
}

  writeFile(base64Data: any, folderName: string, fileName: any, date: any) {

    const contentType = this.getContentType(base64Data);
    const dataBlob = this.base64ToImage(base64Data);
    const filePath = this.file.externalApplicationStorageDirectory + '/'+ folderName;

    this.file.writeFile(filePath, fileName, dataBlob, contentType).then((success) => {

        const imagePath = success.nativeURL.toString();

        this.apiService.uploadImage(date,imagePath,fileName).then(
          (response) => {
            this.result = true;
            this.file.removeFile(filePath,fileName).then((res) => {},(err) => {});
          },
          (error) => {
            this.result =  false;
          }
        );


    }).catch((err) => {
        this.showMessage('Error Occured While Writing File, Error = '+err);
        this.result = false;
    });
  }


  startStopImageUpload(filename: any){

    const imagePath = this.file.applicationDirectory + 'public/assets/'+filename+'.jpeg';

    this.apiService.uploadStartStopImage(imagePath,filename).then(
      (data) => {
        this.bluetoothSerial.write(this.success).then(
          (success) => {},
          (failure) => {}
        );
      },
      (err) => {
        this.bluetoothSerial.write(this.failure).then(
          (success) => {},
          (failure) => {}
        );
      }
    );

  }

  getContentType(base64Data: any) {
    const block = base64Data.split(';');
    const contentType = block[0].split(':')[1];
    return contentType;
  }

  async showMessage(message: any) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'middle',
      cssClass: 'toast-custom-class',
    });
    toast.present();
  }


}
