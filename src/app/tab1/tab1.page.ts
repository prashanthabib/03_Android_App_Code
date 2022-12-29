import { Component, OnInit  } from '@angular/core';
import { ToastController } from '@ionic/angular';

import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';
import { BatteryStatus } from '@awesome-cordova-plugins/battery-status/ngx';
import { LoaderService } from '../services/loader.service';
import { CameraPreview, CameraPreviewOptions, CameraPreviewPictureOptions } from '@awesome-cordova-plugins/camera-preview/ngx';

import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

import { FileTransfer, FileUploadOptions, FileTransferObject } from '@awesome-cordova-plugins/file-transfer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';

import { ApiServiceService } from '../services/api-service.service';

import { FCM } from 'cordova-plugin-fcm-with-dependecy-updated/ionic';
import { Platform } from '@ionic/angular';

export interface FILES {
  name: string;
  filepath: string;
  size: number;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  batteryStatusLevel = 0;
  isPlugged: any;
  isLoading = false;
  hideButton = false;
  cameraMode = 'front';
  cameraModeDisplay = 'Front';

  menuTypes: any = [];

  // eslint-disable-next-line @typescript-eslint/naming-convention
  IMAGE_PATH: any;
  isCameraStarted = false;
  imageURI: any;

  ngFireUploadTask: AngularFireUploadTask;

  progressNum: Observable<number>;

  progressSnapshot: Observable<any>;

  fileUploadedPath: Observable<string>;

  files: Observable<FILES[]>;

  FileName: string;
  FileSize: number;

  isImgUploading: boolean;
  isImgUploaded: boolean;

  interval: any;
  timeIntervalInMin = 1;
  timeIntervalInSecs = 0;
  timeInterval = 60000;

  token: any;

  private ngFirestoreCollection: AngularFirestoreCollection<FILES>;

  constructor(
    private insomnia: Insomnia,
    private batteryStatus: BatteryStatus,
    private loader: LoaderService,
    private cameraPreview: CameraPreview,
    private angularFirestore: AngularFirestore,
    private angularFireStorage: AngularFireStorage,
    public toastCtrl: ToastController,
    private apiService: ApiServiceService,
    private transfer: FileTransfer,
    private file: File,
    public plt: Platform,
  ) {
      this.isImgUploading = false;
      this.isImgUploaded = false;
      this.ngFirestoreCollection = angularFirestore.collection<FILES>('filesCollection');
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
          if (data.wasTapped) {
            console.log('Notification Data was Tapped');
          } else {
            console.log('Notification Data was not Tapped');
          }
        });

      });

  }

  ngOnInit() {
  }

  ionViewWillEnter(){

    this.isLoading = true;
    this.loader.simpleLoader();

    setTimeout(() => {
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
        this.checkAndCreateDir();
      this.loader.dismissLoader();
      this.isLoading = false;
    },1000);


  this.startAutoCapture();

  }

  checkAndCreateDir(){
    this.file.checkDir(this.file.externalApplicationStorageDirectory, 'FalaTech').then(
      response => {
        console.log('Folder Exits');
      }, error => {
        console.log('Folder Dosenot Exits');
        this.file.createDir(this.file.externalApplicationStorageDirectory, 'FalaTech', false).then(
          response1 => {
            console.log('Folder Created');
        }).catch(err => {
          console.log('Folder Dosenot Created');
        });
      }
    );
   }

  startAutoCapture(){
    this.interval = setInterval(this.autoCapture, this.timeInterval);
  }

  ionViewDidLeave(){
    clearInterval(this.interval);
  }

  setTimeIntervalInMin(timeIntervalInMin: any){
    this.timeIntervalInMin = timeIntervalInMin.detail.value;
  }

  setTimeIntervalInSecs(timeIntervalInSecs: any){
    this.timeIntervalInSecs = timeIntervalInSecs.detail.value;
  }

  updateTimeInterval(){

    this.isLoading = true;
    this.loader.simpleLoader();

    setTimeout(() => {
    const min = Number(this.timeIntervalInMin) * 60;
    const totalSec = min + Number(this.timeIntervalInSecs);
    this.timeInterval = totalSec * 1000;
    clearInterval(this.interval);
    this.startAutoCapture();
    this.showMessage('Time Interval Updated');
    this.loader.dismissLoader();
      this.isLoading = false;
  },1000);

  }

  autoCapture(){

      this.isCameraStarted = false;
      this.IMAGE_PATH = '';


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
        });
  }

  switchCamera(){
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

    this.cameraPreview.takePicture(pictureOpts).then(
      (imageData) => {
      this.imageURI = imageData;
      this.IMAGE_PATH = 'data:image/jpeg;base64,' + imageData;

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

    }, (err) => {
      this.showMessage('Error in Uploading file to FireBase = '+err);
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
    this.cameraPreview.stopCamera();
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
        });
      }),
      tap(snap => {
          this.FileSize = snap.totalBytes;
      })
    );
}

fileStorage(image: FILES) {
  const ImgId = this.angularFirestore.createId();

  this.ngFirestoreCollection.doc(ImgId).set(image).then(data => {
  }).catch(error => {
    // console.log(error);

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
        },
        (err) => {
          console.log('Error Uploading Image = ',err);
        });


  }).catch((err) => {
      console.log('Error Occured While Writing File', err);
  });
}

getContentType(base64Data: any) {
  const block = base64Data.split(';');
  const contentType = block[0].split(':')[1];
  return contentType;
}

public base64toBlob(b64Data, contentType) {
  contentType = contentType || '';
  const sliceSize = 512;
  const fileDate = b64Data.split(',');
  const byteCharacters = atob(fileDate);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, {
      type: contentType
  });
  return blob;
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
