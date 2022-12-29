import { Component, OnInit, NgZone } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { ToastController } from '@ionic/angular';

import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';
import { BatteryStatus } from '@awesome-cordova-plugins/battery-status/ngx';
import { LoaderService } from '../services/loader.service';
import { CameraPreview, CameraPreviewOptions, CameraPreviewPictureOptions } from '@awesome-cordova-plugins/camera-preview/ngx';

import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { WifiWizard2 } from '@awesome-cordova-plugins/wifi-wizard-2/ngx';

import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

import { FileTransfer, FileUploadOptions, FileTransferObject } from '@awesome-cordova-plugins/file-transfer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';

import { ApiServiceService } from '../services/api-service.service';

import { FCM } from 'cordova-plugin-fcm-with-dependecy-updated/ionic';
import { Platform } from '@ionic/angular';

export interface FILE {
  name: string;
  filepath: string;
  size: number;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

  result = false;
  isBluetoothEnabled = false;
  isBluetoothDeviceConnected = false;
  bluetoothDeviceConnectedName: any;
  devices: any;
  statusMessage: string;

  batteryStatusLevel = 0;
  isPlugged: any;
  isLoading = false;
  hideButton = false;
  cameraMode = 'front';
  cameraModeDisplay = 'Front';
  success = '1';
  failure = '0';

  // eslint-disable-next-line @typescript-eslint/naming-convention
  IMAGE_PATH: any;
  isCameraStarted = false;

  ngFireUploadTask: AngularFireUploadTask;

  progressNum: Observable<number>;

  progressSnapshot: Observable<any>;

  fileUploadedPath: Observable<string>;

  files: Observable<FILE[]>;

  FileName: string;
  FileSize: number;

  isImgUploading: boolean;
  isImgUploaded: boolean;

  token: any;

  private ngFirestoreCollection: AngularFirestoreCollection<FILE>;

  constructor(
    private bluetoothSerial: BluetoothSerial,
    public toastCtrl: ToastController,
    private insomnia: Insomnia,
    private batteryStatus: BatteryStatus,
    private loader: LoaderService,
    private cameraPreview: CameraPreview,
    private angularFirestore: AngularFirestore,
    private angularFireStorage: AngularFireStorage,
    private ngZone: NgZone,
    private wifiWizard2: WifiWizard2,
    private apiService: ApiServiceService,
    private transfer: FileTransfer,
    private file: File,
    public plt: Platform,
  ) {
    this.isImgUploading = false;
      this.isImgUploaded = false;
      this.ngFirestoreCollection = angularFirestore.collection<FILE>('filesCollection');
      this.files = this.ngFirestoreCollection.valueChanges();

      this.plt.ready()
      .then(() => {

        FCM.getToken().then(
          (token) => {
            console.log('FCM Token = '+token);
            this.token = token;
          },
          (err) => {
            console.log('FCM Token Error = '+err);
          }
        );

        FCM.onNotification().subscribe(data => {
          console.log('Notification Data = '+data);
          console.log('Notification Data Body = '+data.body);
          this.bluetoothSerial.write(data.body).then(
            (success) => {
              console.log('Notification Write Success = '+success);
            },
            (failure) => {
              console.log('Notification Write failure = '+failure);
            }
          );
        });

      });

  }

  ngOnInit() {
  }

  ionViewWillEnter(){
    this.isLoading = true;
    this.loader.simpleLoader();

    setTimeout(() => {
      this.checkBluetoothEnabled();
      this.insomnia.keepAwake().then(
        (success) => {},
        (failure) => {this.showMessage('Screen Will not be Awake');}
      );

        this.batteryStatus.onChange().subscribe(
          (status) => {
            this.batteryStatusLevel = status.level;
            this.isPlugged = status.isPlugged;
          },
          (error) => {
            this.showMessage('Battery Status Reading Error = '+error);
          }
        );

      this.loader.dismissLoader();
      this.isLoading = false;
    },1000);
  }

  ionViewDidLeave(){
    this.isBluetoothDeviceConnected = false;
    this.bluetoothSerial.disconnect().then(
      (success) => {},
      (error) => {}
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

  listPairedDevices() {
    this.bluetoothSerial.list().then(success => {
      this.devices = success;
    }, error => {
      this.showMessage('Connected Devices Listing Error = '+error);
    });
  }

  deviceDisconnected() {
    // Unsubscribe from data receiving
    this.bluetoothSerial.disconnect();
    this.showMessage('Device Disconnected');
  }

  connectDevice(address,name){

    this.isLoading = true;
    this.loader.simpleLoader();
    setTimeout(() => {

    this.bluetoothSerial.connect(address).subscribe(
      (connectRes) => {
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
                      this.startCameraAbove();
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
                  // else if(data === 'Hotspot on'){
                  //   console.log('Data = '+data);
                  //   this.bluetoothSerial.write(this.success).then(
                  //     (success) => {
                  //       console.log('Bluetooth write Success = '+success);
                  //     },
                  //     (failure) => {console.log('Bluetooth write Failure = '+failure);}
                  //   );
                  // }
                  // else if(data === 'Hotspot off'){
                  //   console.log('Data = '+data);
                  //   this.bluetoothSerial.write(this.success).then(
                  //     (success) => {
                  //       console.log('Bluetooth write Success = '+success);
                  //     },
                  //     (failure) => {console.log('Bluetooth write Failure = '+failure);}
                  //   );
                  // }
                  // else if(data === 'Hotspot status'){
                  //   console.log('Data = '+data);
                  //   this.bluetoothSerial.write(this.success).then(
                  //     (success) => {
                  //       console.log('Bluetooth write Success = '+success);
                  //     },
                  //     (failure) => {console.log('Bluetooth write Failure = '+failure);}
                  //   );
                  // }
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
      }
    );
  });
  }

  autoCapture(){

    this.isCameraStarted = false;

    this.ngZone.run(() => {
      this.IMAGE_PATH = '';
    });

    setTimeout(() => {
      const startCamera: HTMLElement = document.getElementById('start_camera') as HTMLElement;
    startCamera.click();
    this.isCameraStarted = true;
    },1000);

      setTimeout(() => {
        if(this.isCameraStarted){
          const takePicture: HTMLElement = document.getElementById('take_picture') as HTMLElement;
          takePicture.click();
        }
      },3000);

      setTimeout(() => {
        if(this.isCameraStarted){
          const stopCamera: HTMLElement = document.getElementById('stop_camera') as HTMLElement;
          stopCamera.click();
          this.isCameraStarted = false;
        }
      },5000);

}

startCameraAbove() {

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

    const file: any = this.base64ToImage(this.IMAGE_PATH);
    // this.fileUpload(file);

    const currentdate = new Date();
    const date = currentdate.getDate() + '-'
              + (currentdate.getMonth()+1)  + '-'
              + currentdate.getFullYear();

    // const fileStoragePath = `${new Date().getTime()}`;
    const filename = currentdate.getHours() + '-'
    + currentdate.getMinutes() + '-'
    + currentdate.getSeconds() + '.jpeg';

   this.writeFile(this.IMAGE_PATH, 'FalaTech', filename);

   if(this.result){
    // this.bluetoothSerial.write(this.success).then(
    //   (success) => {},
    //   (failure) => {}
    // );

    FCM.onNotification().subscribe(data => {
      console.log('Notification Data = '+data);
      console.log('Notification Data Body = '+data.body);
      this.bluetoothSerial.write(data.body).then(
        (success) => {
          console.log('Notification Write Success = '+success);
        },
        (failure) => {
          console.log('Notification Write failure = '+failure);
        }
      );
    });

   }else{
    this.bluetoothSerial.write(this.failure).then(
      (success) => {},
      (failure) => {}
    );
   }

  }, (err) => {
    this.showMessage('Error in Uploading file to FireBase = '+err);
    this.bluetoothSerial.write(this.failure).then(
      (success) => {},
      (failure) => {}
    );
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
    (success) => {
      this.bluetoothSerial.write(this.success).then(
        (writeSuccess) => {},
        (failure) => {}
      );
    },
    (error) => {
      this.bluetoothSerial.write(this.failure).then(
        (success) => {},
        (failure) => {}
      );
    }
  );
}

fileUpload(file: File) {

  this.isImgUploading = true;
  this.isImgUploaded = false;

  const currentdate = new Date();
  const datetime = currentdate.getDate() + '-'
            + (currentdate.getMonth()+1)  + '-'
            + currentdate.getFullYear() + '/'
            + currentdate.getHours() + ':'
            + currentdate.getMinutes() + ':'
            + currentdate.getSeconds();

  // const fileStoragePath = `${new Date().getTime()}`;
  const fileStoragePath = datetime+'.jpg';

  const imageRef = this.angularFireStorage.ref(fileStoragePath);

  this.ngFireUploadTask = this.angularFireStorage.upload(fileStoragePath, file);

  this.progressNum = this.ngFireUploadTask.percentageChanges();
  this.progressSnapshot = this.ngFireUploadTask.snapshotChanges().pipe(

    finalize(() => {
      this.fileUploadedPath = imageRef.getDownloadURL();

      this.fileUploadedPath.subscribe(resp=>{
        this.fileStorage({
          name: fileStoragePath,
          filepath: resp,
          size: this.FileSize
        });
        this.isImgUploading = false;
        this.isImgUploaded = true;
      },error => {
        this.showMessage('Error in uploading image to FireBase = '+error);
        this.bluetoothSerial.write(this.failure).then(
          (success) => {},
          (failure) => {}
        );
      });
    }),
    tap(snap => {
        this.FileSize = snap.totalBytes;
    })
  );
}

fileStorage(image: FILE) {
const ImgId = this.angularFirestore.createId();

this.ngFirestoreCollection.doc(ImgId).set(image).then(data => {
}).catch(error => {
  this.bluetoothSerial.write(this.failure).then(
    (success) => {},
    (failure) => {}
  );
});
}


writeFile(base64Data: any, folderName: string, fileName: any) {
  const contentType = this.getContentType(base64Data);
  const dataBlob = this.base64ToImage(base64Data);
  const filePath = this.file.externalApplicationStorageDirectory + '/'+ folderName;
  this.file.writeFile(filePath, fileName, dataBlob, contentType).then((success) => {
      console.log('File Writed Successfully', success);
      const imagePath = success.nativeURL.toString();

      const fileTransfer: FileTransferObject = this.transfer.create();

      const options: FileUploadOptions = {
        httpMethod: 'PUT',
        mimeType: 'image/jpeg',
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'Content-Type' : 'image/jpeg'
        }
     };

      fileTransfer.upload(imagePath,
        // 'https://122ml6xqdd.execute-api.ap-south-1.amazonaws.com/testing/file-upload-ionic/'+fileName, options).then(
        'https://oowc68d2o5.execute-api.ap-south-1.amazonaws.com/dev/fala-app-images/'+fileName, options).then(
        (data) => {
          console.log('Success Uploading Image = '+JSON.stringify(data));
          this.result = true;
        },
        (err) => {
          console.log('Error Uploading Image = ',err);
          this.result =  false;
        });


  }).catch((err) => {
      console.log('Error Occured While Writing File', err);
      this.result = false;
  });
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
