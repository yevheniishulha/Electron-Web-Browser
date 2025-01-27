import { observable, computed, action } from 'mobx';
import * as React from 'react';
import { ipcRenderer } from 'electron';
// @ts-ignore
import * as Vibrant from 'node-vibrant';

import store from '~/renderer/app/store/SitesStore';
import {
  TABS_PADDING,
  TOOLBAR_HEIGHT,
  defaultTabOptions,
  TAB_ANIMATION_DURATION,
} from '~/renderer/app/constants';
import { getColorBrightness } from '../utils';
import { makeId } from '~/shared/utils/string';
import {title} from "fuse-box/cli/log";
import sitesStore from "~/renderer/app/store/SitesStore";
import {Site} from "~/renderer/app/constants/sites";
import SitesStore from "~/renderer/app/store/SitesStore";

const isColorAcceptable = (color: string) => {
  if (store.activeStore.theme['tab.allowLightBackground']) {
    return getColorBrightness(color) > 120;
  }

  return getColorBrightness(color) < 170;
};

export class Tab {
  @observable
  public id: number;

  @observable
  public isDragging: boolean = false;

  @observable
  public title: string = 'Account';

  @observable
  public loading: boolean = false;

  @observable
  public favicon: string = '';

  @observable
  public tabGroupId: number;

  @observable
  public width: number = 0;

  @observable
  public background: string = store.activeStore.theme.accentColor;

  @observable
  public url = '';

  @observable
  public findOccurrences = '0/0';

  @observable
  public isHighlighted = false;

  @observable
  public findText = '';

  @observable
  public blockedAds = 0;

  @computed
  public get isSelected() {
    return store.activeStore.tabGroups.currentGroup.selectedTabId === this.id;
  }

  @computed
  public get isHovered() {
    return store.activeStore.tabs.hoveredTabId === this.id;
  }

  @computed
  public get borderVisible() {
    const tabs = this.tabGroup.tabs;

    const i = tabs.indexOf(this);
    const nextTab = tabs[i + 1];

    if (
      (nextTab && (nextTab.isHovered || nextTab.isSelected)) ||
      this.isSelected ||
      this.isHovered
    ) {
      return false;
    }

    return true;
  }

  @computed
  public get isExpanded() {
    return this.isHovered || this.isSelected || !store.activeStore.tabs.scrollable;
  }

  @computed
  public get isIconSet() {
    return this.favicon !== '' || this.loading;
  }

  public left = 0;
  public lastUrl = '';
  public isClosing = false;
  public ref = React.createRef<HTMLDivElement>();
  public lastHistoryId: string;
  public hasThemeColor = false;
  public findRequestId: number;
  public removeTimeout: any;
  public storageId: string;
  public isWindow: boolean = false;

  public site: Site = sitesStore.activeSite

  constructor(
    { active } = defaultTabOptions,
    id: number,
    tabGroupId: number,
    isWindow: boolean,
    storageId: string,
    title: string
  ) {
    this.id = id;
    this.isWindow = isWindow;
    this.tabGroupId = tabGroupId;
    this.storageId = storageId
    if (title) {
      this.title = title;
    }

    if (active) {
      requestAnimationFrame(() => {
        this.select();
      });
    }

    if (isWindow) return;

    ipcRenderer.on(
      `browserview-data-updated-${this.id}`,
      async (e: any, { title, url }: any) => {
        let updated = null;

        if (url !== this.url) {

          updated = {
            url,
          };
        }

        if (title !== this.title) {
          updated = {
            title,
          };
        }

        if (updated) {
          this.emitOnUpdated(updated);
        }

        this.title = title;
        this.url = url;

        this.updateData();
      },
    );

    ipcRenderer.on(`highlight-tab-${this.id}`, () => {
      if (!SitesStore.settings.muted) {
        const sound = new Audio('http://testplug.help-chat.com.ua/assets/HCApp_prod/my-app/public/burp.mp3')
        sound.play().then(e => console.log(e))
      }

      this.isHighlighted = true
      sitesStore.tabs.list.find(x => x.site.alias === this.site.alias).isHighlighted = true;
    })

    ipcRenderer.on(
      `load-commit-${this.id}`,
      (
        e: any,
        event: any,
        url: string,
        isInPlace: boolean,
        isMainFrame: boolean,
      ) => {
        if (isMainFrame) {
          this.blockedAds = 0;
        }
      },
    );

    ipcRenderer.on(
      `browserview-favicon-updated-${this.id}`,
      async (e: any, favicon: string) => {
        try {
          this.favicon = favicon;

          const fav = await store.activeStore.favicons.addFavicon(favicon);
          const buf = Buffer.from(fav.split('base64,')[1], 'base64');

          if (!this.hasThemeColor) {
            const palette = await Vibrant.from(buf).getPalette();

            if (!palette.Vibrant) return;

            if (isColorAcceptable(palette.Vibrant.hex)) {
              this.background = palette.Vibrant.hex;
            } else {
              this.background = store.activeStore.theme.accentColor;
            }
          }
        } catch (e) {
          this.favicon = '';
          console.error(e);
        }
        this.updateData();
      },
    );

    ipcRenderer.on(`blocked-ad-${this.id}`, () => {
      this.blockedAds++;
    });

    ipcRenderer.on(
      `browserview-theme-color-updated-${this.id}`,
      (e: any, themeColor: string) => {
        if (themeColor && isColorAcceptable(themeColor)) {
          this.background = themeColor;
          this.hasThemeColor = true;
        } else {
          this.background = store.activeStore.theme.accentColor;
          this.hasThemeColor = false;
        }
      },
    );

    ipcRenderer.on(`view-loading-${this.id}`, (e: any, loading: boolean) => {
      this.loading = loading;

      this.emitOnUpdated({
        status: loading ? 'loading' : 'complete',
      });
    });

  }

  @action
  public updateData() {
    if (this.lastHistoryId) {
      const { title, url, favicon } = this;

      const item = store.activeStore.history.getById(this.lastHistoryId);

      if (item) {
        item.title = title;
        item.url = url;
        item.favicon = favicon;
      }

      store.activeStore.history.db.update(
        {
          _id: this.lastHistoryId,
        },
        {
          $set: {
            title,
            url,
            favicon,
          },
        },
      );
    }
  }

  public get tabGroup() {
    return store.activeStore.tabGroups.getGroupById(this.tabGroupId);
  }

  @action
  public select() {
    this.isHighlighted = false;
    if (!this.isClosing) {
      store.activeStore.canToggleMenu = this.isSelected;

      this.tabGroup.selectedTabId = this.id;

      if (this.isWindow) {
        ipcRenderer.send('browserview-hide');
        ipcRenderer.send('select-window', this.id);
      } else {
        ipcRenderer.send('hide-window');
        ipcRenderer.send('browserview-show');
        ipcRenderer.send('view-select', this.id);

        store.activeStore.tabs.emitEvent('onActivated', {
          tabId: this.id,
          windowId: 0,
        });
      }

      requestAnimationFrame(() => {
        store.activeStore.tabs.updateTabsBounds(true);
      });
    }

  }

  public getWidth(containerWidth: number = null, tabs: Tab[] = null) {
    if (containerWidth === null) {
      containerWidth = store.activeStore.tabs.containerWidth;
    }

    if (tabs === null) {
      tabs = store.activeStore.tabs.list.filter(
        x => x.tabGroupId === this.tabGroupId && !x.isClosing,
      );
    }

    const width =
      containerWidth / (tabs.length + store.activeStore.tabs.removedTabs) - TABS_PADDING;

    if (width > 200) {
      return 200;
    }
    if (width < 72) {
      return 72;
    }

    return width;
  }

  public getLeft(calcNewLeft: boolean = false) {
    const tabs = this.tabGroup.tabs.slice();

    const index = tabs.indexOf(this);

    let left = 0;
    for (let i = 0; i < index; i++) {
      left += (calcNewLeft ? this.getWidth() : tabs[i].width) + TABS_PADDING;
    }

    return left;
  }

  @action
  public setLeft(left: number, animation: boolean) {
    store.activeStore.tabs.animateProperty('x', this.ref.current, left, animation);
    this.left = left;
  }

  @action
  public setWidth(width: number, animation: boolean) {
    store.activeStore.tabs.animateProperty('width', this.ref.current, width, animation);
    this.width = width;
  }

  @action
  public duplicate() {
    store.activeStore.tabs.addTab({
      url: store.activeSite.url,
      active: true
    }, this.storageId, this.title)
  }

  @action
  public close() {
    const tabGroup = this.tabGroup;
    const { tabs } = tabGroup;

    store.activeStore.tabs.closedUrl = this.url;

    const selected = tabGroup.selectedTabId === this.id;

    if (this.isWindow) {
      ipcRenderer.send('detach-window', this.id);
    } else {
      ipcRenderer.send('view-destroy', this.id);
    }

    const notClosingTabs = tabs.filter(x => !x.isClosing);
    let index = notClosingTabs.indexOf(this);

    store.activeStore.tabs.resetRearrangeTabsTimer();

    this.isClosing = true;
    if (notClosingTabs.length - 1 === index) {
      const previousTab = tabs[index - 1];
      if (previousTab) {
        this.setLeft(previousTab.getLeft(true) + this.getWidth(), true);
      }
      store.activeStore.tabs.updateTabsBounds(true);
    } else {
      store.activeStore.tabs.removedTabs++;
    }

    this.setWidth(0, true);
    store.activeStore.tabs.setTabsLefts(true);

    if (selected) {
      index = tabs.indexOf(this);

      if (
        index + 1 < tabs.length &&
        !tabs[index + 1].isClosing &&
        !store.activeStore.tabs.scrollable
      ) {
        const nextTab = tabs[index + 1];
        nextTab.select();
      } else if (index - 1 >= 0 && !tabs[index - 1].isClosing) {
        const prevTab = tabs[index - 1];
        prevTab.select();
      }
    }


    this.removeTimeout = setTimeout(() => {
      store.activeStore.tabs.removeTab(this.id);
    }, TAB_ANIMATION_DURATION * 1000);
  }

  public emitOnUpdated = (data: any) => {
    store.activeStore.tabs.emitEvent('onUpdated', this.id, data, this.getApiTab());
  };

  callViewMethod = (scope: string, ...args: any[]): Promise<any> => {
    return new Promise(resolve => {
      const callId = makeId(32);
      ipcRenderer.send('browserview-call', {
        args,
        scope,
        tabId: this.id,
        callId,
      });

      ipcRenderer.once(
        `browserview-call-result-${callId}`,
        (e: any, result: any) => {
          resolve(result);
        },
      );
    });
  };

  public getApiTab(): chrome.tabs.Tab {
    const selected = this.isSelected;

    return {
      id: this.id,
      index: this.tabGroup.tabs.indexOf(this),
      title: this.title,
      pinned: false,
      favIconUrl: this.favicon,
      url: this.url,
      status: this.loading ? 'loading' : 'complete',
      width: this.width,
      height: TOOLBAR_HEIGHT,
      active: selected,
      highlighted: selected,
      selected,
      windowId: 0,
      discarded: false,
      incognito: false,
      autoDiscardable: false,
    };
  }
}
