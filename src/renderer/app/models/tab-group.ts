import { observable, computed, action } from 'mobx';

import store from '~/renderer/app/store/SitesStore';
import { colors } from '~/renderer/constants';
import {lightBlue} from "@material-ui/core/colors";

let id = 0;

export class TabGroup {
  @observable
  public id: number = 0;

  @observable
  public name: string = 'New group';

  @observable
  public selectedTabId: number;

  @observable
  public color: string = colors.lightBlue['500'];

  @observable
  public editMode = false;



  @computed
  public get isSelected() {
    return store.activeStore.tabGroups.currentGroupId === this.id;
  }

  public get tabs() {
    return store.activeStore.tabs.list.filter(x => x.tabGroupId === this.id);
  }

  @action
  public select() {
    store.activeStore.tabGroups.currentGroupId = this.id;

    setTimeout(() => {
      store.tabs.updateTabsBounds(false);
    }, 1);
  }
}
