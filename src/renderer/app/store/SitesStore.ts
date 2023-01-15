import * as React from 'react';
import {computed, observable} from 'mobx';

import { TabsStore } from './tabs';
import { TabGroupsStore } from './tab-groups';
import { AddTabStore } from './add-tab';
import { ipcRenderer, IpcMessageEvent, remote } from 'electron';
import { OverlayStore } from './overlay';
import { HistoryStore } from './history';
import { FaviconsStore } from './favicons';
import { SuggestionsStore } from './suggestions';
import { ExtensionsStore } from './extensions';
import { extname } from 'path';
import { BookmarksStore } from './bookmarks';
import { readFileSync, writeFile } from 'fs';
import { getPath } from '~/shared/utils/paths';
import { Settings } from '../models/settings';
import { DownloadsStore } from './downloads';
import { lightTheme, darkTheme } from '~/renderer/constants/themes';
import { LoginStore } from './login';
import { SignupStore } from './signup';
import {SiteTabsStore} from "~/renderer/app/store/sites-tabs";
import {SitesAddTabAddTabStore} from "~/renderer/app/store/sites-add-tab";
import Store from "~/renderer/app/store/index";
import {Site} from "~/renderer/app/constants/sites";

class SitesStore {
    public addTab = new SitesAddTabAddTabStore();
    public addTab1 = new AddTabStore();
    @observable
    public _sitesListVisible: boolean = true;
    @observable
    public selectedTabId: string
    public tabs = new SiteTabsStore();
    public isFullscreen = false;
    @observable
    public activeStore:Store|null = null


    public theme = lightTheme;

    @observable
    public isHTMLFullscreen = false;
    @observable
    public clicked1 = false;
    @observable
    public clicked2 = false;

    @observable
    public updateInfo = {
        available: false,
        version: '',
    };

    @observable
    public activeSite: Site|null = null;

    public mouse = {
        x: 0,
        y: 0,
    };

    public set sitesListVisible(val: boolean) {
        this._sitesListVisible = val
        if (val) {
            ipcRenderer.send('browserview-hide');
        }
    }
    @computed
    public get sitesListVisible() {
        return this._sitesListVisible
    }

    constructor() {

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

        ipcRenderer.send('update-check');

        // requestAnimationFrame(() => {
        //     if (remote.process.argv.length > 1 && remote.process.env.ENV !== 'dev') {
        //         const path = remote.process.argv[1];
        //         const ext = extname(path);
        //
        //         if (ext === '.html') {
        //             this.tabs.addTab({ url: `file:///${path}`, active: true });
        //         }
        //     }
        // });
    }

}

export default new SitesStore();
