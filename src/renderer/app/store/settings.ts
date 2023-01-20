import {action, observable} from "mobx";
import {ipcRenderer} from "electron";
import store from "~/renderer/app/store/SitesStore";

class Settings
{
    @observable
    public _notifMuted = false;

    @observable
    public _muted = false;
    @observable
    public zoomLevel = 0;
    @observable
    public maxZoom = 9;
    @observable
    public minZoom = -8;

    public set notifMuted(val:boolean) {
        ipcRenderer.send('setting-notif-muted', val);
        this._notifMuted = val
    }

    public get notifMuted() {
        return this._notifMuted
    }

    public set muted(val: boolean) {
        ipcRenderer.send('setting-muted', val);
        this._muted = val
    }

    public get muted() {
        return this._muted
    }

    @action
    public incrementZoomLevel() {
        if (this.maxZoom > this.zoomLevel) {
            this.zoomLevel++
            ipcRenderer.send('setting-zoom-level', this.zoomLevel);
        }
    }
    @action
    public decrementZoomLevel() {
        if (this.minZoom < this.zoomLevel) {
            this.zoomLevel--
            ipcRenderer.send('setting-zoom-level', this.zoomLevel);
        }
    }


}

export default Settings