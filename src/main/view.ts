import {BrowserView, app, IpcMessageEvent, shell, Notification, remote} from 'electron';
import { appWindow, settings } from '.';
import { parse } from 'tldts';
import { getViewMenu } from './menus/view';
import store from "~/main/store/Store";
import {resolve} from "path";
let i = 1;

export class View extends BrowserView {
  public title: string = '';
  public url: string = '';
  public homeUrl: string;

  public storageId: string

  public isDuplicate = false;
  public partitionNumber = 0
  public accountName: string

  public siteId: string
  constructor(url: string, id:string = '', storageId:string='', title:string = '') {

    super({
      webPreferences: {
        preload: `${app.getAppPath()}/build/view-preload.js`,
        nodeIntegrationInWorker: true,
        contextIsolation: false,
        webSecurity: false,
        partition: storageId ? storageId : `persist:view-${i}`,
        plugins: true,
      },
    });
    if (storageId) {
      this.storageId = storageId
      this.isDuplicate = true
    } else {
      this.storageId = `persist:view-${i}`
    }
    if (title && this.isDuplicate) {
      this.title = title
    }
    i++
    this.siteId = id
    this.homeUrl = url;
    this.webContents.on('context-menu', (e, params) => {
      const menu = getViewMenu(appWindow, params, this.webContents);
      menu.popup();
    });

    this.webContents.addListener('found-in-page', (e, result) => {
      appWindow.webContents.send('found-in-page', result);
    });

    this.webContents.addListener('dom-ready', () => {
      this.updateNavigationState();
      if (this.isDuplicate) {
        return
      }
      let data = store.get(this.siteId);
      let siteAccountsData = store.get(this.siteId + '_storage');

      appWindow.webContents.send(`view-loading-${this.webContents.id}`, false);

      this.webContents.executeJavaScript('window.account_data = ' + JSON.stringify(siteAccountsData) + ';');
      this.webContents.executeJavaScript('window.accounts = ' + JSON.stringify(data) + ';');
      this.webContents.executeJavaScript('localStorage.setItem("accounts", \'' + JSON.stringify(data) + '\');localStorage.setItem("account_data", \'' + JSON.stringify(siteAccountsData) + '\');')
      // @ts-ignore
      this.webContents.executeJavaScript(global.content, false, e => console.log(e)).then(() => console.log('WOOOOOOOOOOOOORKS!')).catch(e=>console.log(e))
    });

    this.webContents.addListener('did-start-loading', () => {
      this.updateNavigationState();
      appWindow.webContents.send(`view-loading-${this.webContents.id}`, true);
    });

    this.webContents.addListener('did-start-navigation', (...args: any[]) => {
      this.updateNavigationState();

      const url = this.webContents.getURL();
      appWindow.webContents.send(`load-commit-${this.webContents.id}`, ...args);
    });

    this.webContents.on('ipc-message', (event: IpcMessageEvent, channel, data) => {
      switch (channel) {
        case 'send_notification':
          let options = {
            icon: resolve(app.getAppPath(), 'static/app-icons/icon.png'),
            title: 'Вы получили сообщение ',
            body: 'Вы получили соощение во вкладке: ' + (this.title),
            appID: "HELP-CHAT",
            silent: !appWindow.viewManager.mutedNotif
          };
          if (!appWindow.viewManager.mutedNotif) {
            let n = new Notification(options);
            n.show();

            appWindow.webContents.send(
                `highlight-tab-${this.webContents.id}`
            );
          }



          break;
        case 'add_autofill_data' :
          store.set(this.siteId, data);
          break;

        // case 'open_new_window':
        //   let webview = "<webview src='" + data + "' partition='" + current.getAttribute('partition') + "'></webview>"
        //   current.parentNode.insertAdjacentHTML('beforeend', webview);
        //   break;
        case 'save_account_data':
          let siteAccountsData = store.get(this.siteId + '_storage');
          store.set(this.siteId + '_storage', {...siteAccountsData, ...data});
          break;
        case 'open_external':
          shell.openExternal(data);
          break;
        case 'set_account':
          if (!this.isDuplicate) {
            let loggedIn = data;
            let accountName = loggedIn.age ? loggedIn.name + ',' + loggedIn.age : loggedIn.name;
            this.title = accountName;
          }

          // let duplicate = current.getAttribute('duplicate') === 'true';
          // if (!duplicate) {
          //     current.send('set-account')
          // }
          // console.log(loggedIn);
          // current.setAttribute('handled', {...handled, name: loggedIn.name})

          break;
      }
    })

    this.webContents.addListener(
      'new-window',
      (e, url, frameName, disposition) => {
        if (disposition === 'new-window') {
          if (frameName === '_self') {
            e.preventDefault();
            appWindow.viewManager.selected.webContents.loadURL(url);
          } else if (frameName === '_blank') {
            e.preventDefault();
            appWindow.viewManager.create(
              {
                url,
                active: true,
              },
              true,
            );
          }
        } else if (disposition === 'foreground-tab') {
          e.preventDefault();
          appWindow.viewManager.create({ url, active: true }, true);
        } else if (disposition === 'background-tab') {
          e.preventDefault();
          appWindow.viewManager.create({ url, active: false }, true);
        }
      },
    );

    this.webContents.addListener(
      'page-favicon-updated',
      async (e, favicons) => {
        appWindow.webContents.send(
          `browserview-favicon-updated-${this.webContents.id}`,
          favicons[0],
        );
      },
    );

    this.webContents.addListener('did-change-theme-color', (e, color) => {
      appWindow.webContents.send(
        `browserview-theme-color-updated-${this.webContents.id}`,
        color,
      );
    });

    (this.webContents as any).addListener(
      'certificate-error',
      (
        event: Electron.Event,
        url: string,
        error: string,
        certificate: Electron.Certificate,
        callback: Function,
      ) => {
        console.log(certificate, error, url);
        // TODO: properly handle insecure websites.
        event.preventDefault();
        callback(true);
      },
    );

    this.setAutoResize({
      width: true,
      height: true,
    });
    this.webContents.loadURL(url);
  }

  public updateNavigationState() {
    if (this.isDestroyed()) return;

    if (appWindow.viewManager.selectedId === this.webContents.id) {
      appWindow.webContents.send('update-navigation-state', {
        canGoBack: this.webContents.canGoBack(),
        canGoForward: this.webContents.canGoForward(),
      });
    }
  }

  public async getScreenshot(): Promise<string> {
    return new Promise(resolve => {
      this.webContents.capturePage(img => {
        resolve(img.toDataURL());
      });
    });
  }
}
