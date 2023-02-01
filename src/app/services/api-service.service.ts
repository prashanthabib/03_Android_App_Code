/* eslint-disable quote-props */
/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError  } from 'rxjs';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@awesome-cordova-plugins/file-transfer/ngx';

import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  //  endpoint = 'https://122ml6xqdd.execute-api.ap-south-1.amazonaws.com/testing/file-upload-ionic/';

  // Office Server Connection
  // endpoint = 'http://202.131.150.79:9091/';
  // Cloud Server Connection
  // endpoint = 'http://65.2.35.215:9091/';
  // endpoint = 'http://3.112.125.233:9091/';
  endpoint = 'http://15.206.69.52:9091/';

   httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT',
      'enctype': 'multipart/form-data;',
    })
  };


  constructor(private httpClient: HttpClient,private transfer: FileTransfer,) { }

  createCustomerFolder(customerFolderName: any): Observable<any>{

    return this.httpClient.post(this.endpoint+'createCustomerFolder',
    JSON.stringify(customerFolderName), this.httpOptions);
  }

  uploadImage(date: any, imagePath: any, filename: any){

    const path = this.endpoint+'uploadImage/'+localStorage.getItem('customerId')+'/'+date+'/'+filename;

    const fileTransfer: FileTransferObject = this.transfer.create();

    const options: FileUploadOptions = {
      fileKey: 'file',
      fileName: filename,
      chunkedMode: false,
      httpMethod: 'POST',
      mimeType: 'multipart/form-data',
   };

  return fileTransfer.upload(imagePath,path,options);

  }

  uploadStartStopImage(imagePath: any, filename: any){

    const path = this.endpoint+'uploadStartStopImage/'+filename;

    const fileTransfer: FileTransferObject = this.transfer.create();

    const options: FileUploadOptions = {
      fileKey: 'file',
      fileName: filename,
      chunkedMode: false,
      httpMethod: 'POST',
      mimeType: 'multipart/form-data',
   };

  return fileTransfer.upload(imagePath,path,options);

  }

  uploadFCMToken(filePath: any){

    const path = this.endpoint+'uploadFCMToken/'+localStorage.getItem('customerId');

    const fileTransfer: FileTransferObject = this.transfer.create();

    const options: FileUploadOptions = {
      fileKey: 'file',
      fileName: 'token.txt',
      chunkedMode: false,
      httpMethod: 'POST',
      mimeType: 'multipart/form-data',
   };

  return fileTransfer.upload(filePath,path,options);

  }


  handleError(error: HttpErrorResponse) {
    return throwError(
      error.error.message);
  };

}
