import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

customerId: any;

constructor() { }

  ngOnInit() {
    this.customerId = localStorage.getItem('customerId');
  }

}
