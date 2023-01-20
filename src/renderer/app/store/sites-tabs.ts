import {observable, observe, action, computed} from 'mobx';
import * as React from 'react';

import {
    TAB_ANIMATION_DURATION,
    defaultTabOptions,
    TABS_PADDING,
    TOOLBAR_HEIGHT, TAB_ANIMATION_EASING,
} from '~/renderer/app/constants';

import HorizontalScrollbar from '~/renderer/app/components/HorizontalScrollbar';
import store from './SitesStore';
import { ipcRenderer } from 'electron';
import {makeId} from "~/shared/utils/string";
import {TweenLite} from "gsap";
import {Site} from "~/renderer/app/constants/sites";
import Store from "~/renderer/app/store/index";
import {TabGroupsStore} from "~/renderer/app/store/tab-groups";
import {TabsStore} from "~/renderer/app/store/tabs";

export class SiteTabsStore {
    public lastScrollLeft: number = 0;
    @observable
    public isDragging: boolean = false;

    @observable
    public scrollbarVisible: boolean = false;

    @observable
    public hoveredTabId: string|number;

    @observable
    public list: SiteTab[] = [];

    @observable
    public scrollable = false;

    public removedTabs: number = 0;

    public lastMouseX: number = 0;
    public mouseStartX: number = 0;
    public tabStartX: number = 0
    public closedUrl = '';

    public scrollbarRef = React.createRef<HorizontalScrollbar>();
    public containerRef = React.createRef<HTMLDivElement>();

    private rearrangeTabsTimer = {
        canReset: false,
        time: 0,
        interval: null as any,
    };

    constructor() {
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('resize', this.onResize);

        this.rearrangeTabsTimer.interval = setInterval(() => {
            // Set widths and positions for tabs 3 seconds after a tab was closed
            if (
                this.rearrangeTabsTimer.canReset &&
                this.rearrangeTabsTimer.time === 3
            ) {
                this.removedTabs = 0;
                this.updateTabsBounds(true);
                this.rearrangeTabsTimer.canReset = false;
            }
            this.rearrangeTabsTimer.time++;
        }, 1000);

    }

    @action
    public onResize = (e: Event) => {
        if (e.isTrusted) {
            this.removedTabs = 0;
            this.updateTabsBounds(false);
        }
    };

    public get containerWidth() {
        if (this.containerRef.current) {
            return this.containerRef.current.offsetWidth;
        }
        return 0;
    }

    public get selectedTab() {
        return this.getTabById(store.selectedTabId);
    }

    public get hoveredTab() {
        return this.getTabById(this.hoveredTabId);
    }

    public getTabById(id: any) {
        return this.list.find(x => x.id === id);
    }

    @action public createTab(
        site: Site,
        index: number
    ) {

        store.sitesListVisible = false;
        this.removedTabs = 0;

        const tab = new SiteTab(true, site);

        if (index !== undefined) {
            this.list.splice(index, 0, tab);
        } else {
            this.list.push(tab);
        }

        requestAnimationFrame(() => {
            tab.setLeft(tab.getLeft(), false);
            this.updateTabsBounds(true);
        });
        ipcRenderer.send('hide-window');

        return tab;
    }

    @action
    public addTab(site:Site) {
        let tab = store.tabs.list.find(e => e.id === site.name)
        if (tab) {
            tab.select()
        } else {
            const index = store.tabs.list.indexOf(this.selectedTab) + 1;
            this.createTab(site, index);
        }

    }

    public removeTab(id: string) {
        (this.list as any).remove(this.getTabById(id));
        requestAnimationFrame(() => {
            this.updateTabsBounds(true)
        })
    }

    @action
    public updateTabsBounds(animation: boolean) {
        this.setTabsWidths(animation);
        this.setTabsLefts(animation);
    }

    @action
    public setTabsWidths(animation: boolean) {
        const tabs = this.list

        const containerWidth = this.containerWidth;

        for (const tab of tabs) {
            const width = tab.getWidth(containerWidth, tabs);
            tab.setWidth(width, animation);

            this.scrollable = width === 72;
        }
    }

    @action
    public setTabsLefts(animation: boolean) {
        const tabs = this.list

        const { containerWidth } = store.tabs;

        let left = 0;

        for (const tab of tabs) {
            tab.setLeft(left, animation);

            left += tab.width + TABS_PADDING;
        }

        store.addTab.setLeft(
            Math.min(left, containerWidth + TABS_PADDING),
            animation,
        );
    }

    @action
    public replaceTab(firstTab: SiteTab, secondTab: SiteTab) {
        secondTab.setLeft(firstTab.getLeft(true), true);

        const index = this.list.indexOf(secondTab);

        this.list[this.list.indexOf(firstTab)] = secondTab;
        this.list[index] = firstTab;
    }

    public getTabsToReplace(callingTab: SiteTab, direction: string) {
        let tabs = this.list;

        const index = tabs.indexOf(callingTab);

        if (direction === 'left') {
            for (let i = index - 1; i >= 0; i--) {
                const tab = tabs[i];
                if (callingTab.left <= tab.width / 2 + tab.left) {
                    this.replaceTab(tabs[i + 1], tab);
                } else {
                    break;
                }
            }
        } else if (direction === 'right') {
            for (let i = index + 1; i < tabs.length; i++) {
                const tab = tabs[i];
                if (callingTab.left + callingTab.width >= tab.width / 2 + tab.left) {
                    this.replaceTab(tabs[i - 1], tab);
                } else {
                    break;
                }
            }
        }
    }

    @action
    public onMouseUp = () => {
        const selectedTab = this.selectedTab;

        this.isDragging = false;

        this.setTabsLefts(true);

        if (selectedTab) {
            selectedTab.isDragging = false;
        }
    };

    public animateProperty(
        property: string,
        obj: any,
        value: number,
        animation: boolean,
    ) {
        if (obj) {
            const props: any = {
                ease: animation ? TAB_ANIMATION_EASING : null,
            };
            props[property] = value;
            TweenLite.to(obj, animation ? TAB_ANIMATION_DURATION : 0, props);
        }
    }

    @action
    public onMouseMove = (e: any) => {

        const { selectedTab } = store.tabs;

        if (this.isDragging) {
            const container = this.containerRef;
            const { tabStartX, mouseStartX, lastMouseX, lastScrollLeft } = store.tabs;

            const boundingRect = container.current.getBoundingClientRect();

            if (Math.abs(e.pageX - mouseStartX) < 5) {
                return;
            }

            selectedTab.isDragging = true;

            const newLeft =
                tabStartX +
                e.pageX -
                mouseStartX -
                (lastScrollLeft - container.current.scrollLeft);

            let left = Math.max(0, newLeft);

            if (
                newLeft + selectedTab.width >
                store.addTab.left + container.current.scrollLeft - TABS_PADDING
            ) {
                left =
                    store.addTab.left - selectedTab.width + lastScrollLeft - TABS_PADDING;
            }

            selectedTab.setLeft(left, false);

            if (
                e.pageY > TOOLBAR_HEIGHT + 16 ||
                e.pageY < -16 ||
                e.pageX < boundingRect.left ||
                e.pageX - boundingRect.left > store.addTab.left
            ) {
                // TODO: Create a new window
            }

            this.getTabsToReplace(
                selectedTab,
                lastMouseX - e.pageX >= 1 ? 'left' : 'right',
            );

            this.lastMouseX = e.pageX;
        }
    };

    public emitEvent(name: string, ...data: any[]) {
        ipcRenderer.send('emit-tabs-event', name, ...data);
    }

    public onNewTab() {
        store.selectedTabId = null
        store.sitesListVisible = true;

    }
}
export class SiteTab {
    @observable
    public id: string;

    @observable
    public isDragging: boolean = false;

    @observable
    public title: string = 'New tab';

    @observable
    public loading: boolean = false;

    @observable
    public favicon: string = '';

    @observable
    public isHighlighted = false;

    @observable
    public store:Store;
    @observable
    public site:Site;

    @observable
    public width: number = 0;

    @observable
    public url = '';

    @observable
    public findOccurrences = '0/0';

    @observable
    public findText = '';

    @observable
    public blockedAds = 0;

    @computed
    public get isSelected() {
        return store.selectedTabId === this.id;
    }

    @computed
    public get isHovered() {
        return store.tabs.hoveredTabId === this.id;
    }

    @computed
    public get borderVisible() {
        const tabs = store.tabs.list;

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
        return this.isHovered || this.isSelected || !store.tabs.scrollable;
    }

    @computed
    public get isIconSet() {
        return this.favicon !== '' || this.loading;
    }

    public left = 0;
    public background: string = store.theme.accentColor;
    public lastUrl = '';
    public isClosing = false;
    public ref = React.createRef<HTMLDivElement>();
    public lastHistoryId: string;
    public hasThemeColor = false;
    public findRequestId: number;
    public removeTimeout: any;
    public isWindow: boolean = false;

    constructor(
        active:boolean ,
        site: Site,
    ) {
        this.id = site.name;
        this.store = new Store()
        this.site = site
        store.selectedTabId = site.name
        store.activeSite = site
        this.store.tabGroups = new TabGroupsStore()
        this.store.tabs = new TabsStore()
        store.activeStore = this.store
        this.store.tabGroups.addGroup()


        if (active) {
            requestAnimationFrame(() => {
                this.select();
            });
        }

    }


    @action
    public select() {
        this.isHighlighted = false;
        if (!this.isClosing) {

            store.selectedTabId = this.id;
            store.sitesListVisible = false;
            store.activeStore = this.store;
            store.activeSite = this.site

            requestAnimationFrame(() => {
                store.tabs.updateTabsBounds(true);
                store.activeStore.tabs.selectedTab.select()
                store.activeStore.tabs.updateTabsBounds(true);
            });

        }

    }

    public getWidth(containerWidth: number = null, tabs: SiteTab[] = null) {
        if (containerWidth === null) {
            containerWidth = store.tabs.containerWidth;
        }

        if (tabs === null) {
            tabs = store.tabs.list
        }

        const width =
            containerWidth / (tabs.length + store.tabs.removedTabs) - TABS_PADDING;

        if (width > 200) {
            return 200;
        }
        if (width < 72) {
            return 72;
        }

        return width;
    }

    public getLeft(calcNewLeft: boolean = false) {
        const tabs = store.tabs.list.slice();

        const index = tabs.indexOf(this);

        let left = 0;
        for (let i = 0; i < index; i++) {
            left += (calcNewLeft ? this.getWidth() : tabs[i].width) + TABS_PADDING;
        }

        return left;
    }

    @action
    public setLeft(left: number, animation: boolean) {
        store.tabs.animateProperty('x', this.ref.current, left, animation);
        this.left = left;
    }

    @action
    public setWidth(width: number, animation: boolean) {
        store.tabs.animateProperty('width', this.ref.current, width, animation);
        this.width = width;
    }

    @action
    public close() {
        const tabs  = store.tabs.list;
        const selected = store.selectedTabId === this.id;

        const notClosingTabs = tabs.filter(x => !x.isClosing);
        let index = notClosingTabs.indexOf(this);


        this.isClosing = true;
        if (notClosingTabs.length - 1 === index) {
            const previousTab = tabs[index - 1];
            if (previousTab) {
                this.setLeft(previousTab.getLeft(true) + this.getWidth(), true);
            }
            store.tabs.updateTabsBounds(true);
        } else {
            store.tabs.removedTabs++;
        }

        this.setWidth(0, true);
        store.tabs.setTabsLefts(true);

        if (selected) {
            index = tabs.indexOf(this);

            if (
                index + 1 < tabs.length &&
                !tabs[index + 1].isClosing &&
                !store.tabs.scrollable
            ) {
                const nextTab = tabs[index + 1];
                nextTab.select();
            } else if (index - 1 >= 0 && !tabs[index - 1].isClosing) {
                const prevTab = tabs[index - 1];
                prevTab.select();
            }
        }

        if(store.tabs.list.length === 1) {
            store.sitesListVisible = true;
        }

        this.removeTimeout = setTimeout(() => {
            store.tabs.removeTab(this.id);
        }, TAB_ANIMATION_DURATION * 1000);
    }

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
}
