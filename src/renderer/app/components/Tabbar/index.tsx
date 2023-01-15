import { observer } from 'mobx-react';
import * as React from 'react';

import HorizontalScrollbar from '../HorizontalScrollbar';
import { icons } from '~/renderer/app/constants/icons';
import { AddTab, StyledTabbar, TabsContainer } from './style';
import { Tabs } from '../Tabs';
import SitesStore from "~/renderer/app/store/SitesStore";



export const Tabbar = observer(() => {
    const getContainer = () => SitesStore.activeStore.tabs.containerRef.current;

    const onMouseEnter = () => (SitesStore.activeStore.tabs.scrollbarVisible = true);

    const onMouseLeave = () => (SitesStore.activeStore.tabs.scrollbarVisible = false);

    const onAddTabClick = () => {
        SitesStore.activeStore.tabs.onNewTab();
    };
  return (
    <StyledTabbar>
      <TabsContainer
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={SitesStore.activeStore.tabs.containerRef}
      >
        <Tabs />
      </TabsContainer>
      <AddTab
        id={SitesStore.addTab1.id}
        icon={icons.add}
        onClick={onAddTabClick}
        divRef={(r: any) => (SitesStore.addTab1.ref = r)}
      />
      <HorizontalScrollbar
        ref={SitesStore.activeStore.tabs.scrollbarRef}
        enabled={SitesStore.activeStore.tabs.scrollable}
        visible={SitesStore.activeStore.tabs.scrollbarVisible}
        getContainer={getContainer}
      />
    </StyledTabbar>
  );
});
