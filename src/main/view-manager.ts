import { ipcMain, session } from 'electron';
import { TOOLBAR_HEIGHT, ADDRESS_BAR_HEIGHT } from '~/renderer/app/constants/design';
import { appWindow, log } from '.';
import { View } from './view';

export class ViewManager {
  public views: View[] = [];
  public selectedId = 0;

  public muted = false;

  public mutedNotif = false
  public _fullscreen = false;

  public isHidden = false;

  public get fullscreen() {
    return this._fullscreen;
  }

  public set fullscreen(val: boolean) {
    this._fullscreen = val;
    this.fixBounds();
  }

  constructor() {

    ipcMain.on(
      'view-create',
      (e: Electron.IpcMessageEvent, details: chrome.tabs.CreateProperties) => {
        this.create(details);
      },
    );

    ipcMain.on(
      'view-select',
      (e: Electron.IpcMessageEvent, id: number, force: boolean) => {
        const view = this.views.find(x => x.webContents.id === id);
        this.select(id);
        view.updateNavigationState();

        if (force) this.isHidden = false;
      },
    );

    ipcMain.on(
      'setting-zoom-level',
      (e: Electron.IpcMessageEvent, details: any) => {
        appWindow.webContents.setZoomLevel(details)
      },
    );
    ipcMain.on(
      'setting-muted',
      (e: Electron.IpcMessageEvent, details: any) => {
        this.muted = details;
      },
    );
    ipcMain.on(
      'setting-notif-muted',
      (e: Electron.IpcMessageEvent, details: any) => {
        this.mutedNotif = details
      },
    );

    ipcMain.on('clear-browsing-data', () => {
      const ses = session.fromPartition('persist:view');
      ses.clearCache((err: any) => {
        if (err) log.error(err);
      });

      ses.clearStorageData({
        storages: [
          'appcache',
          'cookies',
          'filesystem',
          'indexdb',
          'localstorage',
          'shadercache',
          'websql',
          'serviceworkers',
          'cachestorage',
        ],
      });
    });

    ipcMain.on('view-destroy', (e: Electron.IpcMessageEvent, id: number) => {
      this.destroy(id);
    });

    ipcMain.on('browserview-call', async (e: any, data: any) => {
      const view = this.views.find(x => x.webContents.id === data.tabId);
      let scope: any = view;

      if (data.scope && data.scope.trim() !== '') {
        const scopes = data.scope.split('.');
        for (const s of scopes) {
          scope = scope[s];
        }
      }

      let result = scope.apply(view.webContents, data.args);

      if (result instanceof Promise) {
        result = await result;
      }

      if (data.callId) {
        appWindow.webContents.send(
          `browserview-call-result-${data.callId}`,
          result,
        );
      }
    });

    ipcMain.on('browserview-hide', () => {
      this.hideView();
    });

    ipcMain.on('browserview-show', () => {
      this.showView();
    });

    setInterval(() => {
      for (const view of this.views) {
        const url = view.webContents.getURL();

        if (!view.title.includes('Account')) {
          appWindow.webContents.send(
            `browserview-data-updated-${view.webContents.id}`,
            {
              title: view.title,
              url,
            },
          );
          view.url = url;
        }
      }
    }, 200);

    ipcMain.on('browserview-clear', () => {
      this.clear();
    });
  }

  public get selected() {
    return this.views.find(x => x.webContents.id === this.selectedId);
  }

  public create(details:any, isNext = false) {
    const view = new View(details.url, details.id, details.storageId, details.title);
    this.views.push(view);

    appWindow.webContents.send(
      'api-tabs-create' + details.id,
      { ...details },
      isNext,
      view.webContents.id, view.storageId, view.title
    );

    return view;
  }

  public clear() {
    appWindow.setBrowserView(null);
    for (const key in this.views) {
      this.destroy(parseInt(key, 10));
    }
  }

  public select(id: number) {
    const view = this.views.find(x => x.webContents.id === id);
    this.selectedId = id;

    if (!view || view.isDestroyed()) {
      this.destroy(id);
      appWindow.setBrowserView(null);
      return;
    }

    if (this.isHidden) return;

    appWindow.setBrowserView(view);

    this.fixBounds();
  }

  public fixBounds() {
    const view = this.selected;

    if (!view) return;

    const { width, height } = appWindow.getContentBounds();
    view.setBounds({
      x: 0,
      y: this.fullscreen ? 0 : TOOLBAR_HEIGHT + ADDRESS_BAR_HEIGHT + 1,
      width,
      height: this.fullscreen ? height : height - TOOLBAR_HEIGHT - ADDRESS_BAR_HEIGHT,
    });
    view.setAutoResize({
      width: true,
      height: true,
    });
  }

  public hideView() {
    this.isHidden = true;
    appWindow.setBrowserView(null);
  }

  public showView() {
    this.isHidden = false;
    this.select(this.selectedId);
  }

  public destroy(id: number) {
    const view = this.views.find(x => x.webContents.id === id);

    this.views = this.views.filter(x => x.webContents.id !== id);

    if (view) {
      if (appWindow.getBrowserView() === view) {
        appWindow.setBrowserView(null);
      }

      view.destroy();
    }
  }
}
