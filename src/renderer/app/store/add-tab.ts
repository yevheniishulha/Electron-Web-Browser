import * as React from 'react';

import store from '~/renderer/app/store/SitesStore';
import {observable} from "mobx";
let i = 1
export class AddTabStore {
  public id:number = i++
  @observable
  public left = 0;

  public ref: HTMLDivElement;

  public setLeft(left: number, animation: boolean) {
    console.log('|||||||||||||||',store.activeStore.tabs.list.length)
    store.activeStore.tabs.animateProperty('x', this.ref, left, animation);
    this.left = left;
  }
}
