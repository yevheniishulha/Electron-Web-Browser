import * as React from 'react';
import { observable } from 'mobx';

import { TabsStore } from './tabs';
import { TabGroupsStore } from './tab-groups';
import { AddTabStore } from './add-tab';
import { ipcRenderer, IpcMessageEvent, remote } from 'electron';

import { extname } from 'path';
import { readFileSync, writeFile } from 'fs';
import { getPath } from '~/shared/utils/paths';
import { Settings } from '../models/settings';
import { lightTheme, darkTheme } from '~/renderer/constants/themes';
import {FaviconsStore} from "~/renderer/app/store/favicons";
import {HistoryStore} from "~/renderer/app/store/history";


export class Store {

  public history = new HistoryStore();
  public favicons = new FaviconsStore();
  public addTab = new AddTabStore();
  public tabGroups:TabGroupsStore
  public tabs = new TabsStore();

  @observable
  public theme = lightTheme;

  @observable
  public isAlwaysOnTop = false;

  @observable
  public isFullscreen = false;

  @observable
  public isHTMLFullscreen = false;

  @observable
  public updateInfo = {
    available: false,
    version: '',
  };

  @observable
  public navigationState = {
    canGoBack: false,
    canGoForward: false,
  };

  @observable
  public settings: Settings = {
    dialType: 'top-sites',
    isDarkTheme: false,
    isShieldToggled: true,
  };

  public findInputRef = React.createRef<HTMLInputElement>();

  public canToggleMenu = false;

  public mouse = {
    x: 0,
    y: 0,
  };

  constructor() {
    ipcRenderer.on(
      'update-navigation-state',
      (e: IpcMessageEvent, data: any) => {
        this.navigationState = data;
      },
    );

    ipcRenderer.on('fullscreen', (e: any, fullscreen: boolean) => {
      this.isFullscreen = fullscreen;
    });

    ipcRenderer.on('html-fullscreen', (e: any, fullscreen: boolean) => {
      this.isHTMLFullscreen = fullscreen;
    });

    ipcRenderer.on(
      'update-available',
      (e: IpcMessageEvent, version: string) => {
        this.updateInfo.version = version;
        this.updateInfo.available = true;
      },
    );

    ipcRenderer.on(
      'api-tabs-query',
      (e: IpcMessageEvent, webContentsId: number) => {
        const sender = remote.webContents.fromId(webContentsId);

        sender.send(
          'api-tabs-query',
          this.tabs.list.map(tab => tab.getApiTab()),
        );
      },
    );

    ipcRenderer.send('update-check');

    requestAnimationFrame(() => {
      if (remote.process.argv.length > 1 && remote.process.env.ENV !== 'dev') {
        const path = remote.process.argv[1];
        const ext = extname(path);

        if (ext === '.html') {
          this.tabs.addTab({ url: `file:///${path}`, active: true });
        }
      }
    });

    this.settings = {
      ...this.settings,
      ...JSON.parse(readFileSync(getPath('settings.json'), 'utf8')),
    };

    this.theme = this.settings.isDarkTheme ? darkTheme : lightTheme;

    ipcRenderer.send('settings', this.settings);
  }

  public saveSettings() {
    ipcRenderer.send('settings', this.settings);

    writeFile(getPath('settings.json'), JSON.stringify(this.settings), err => {
      if (err) console.error(err);
    });
  }
}

export default Store;
