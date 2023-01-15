import { observer } from 'mobx-react';
import * as React from 'react';
import { icons } from '~/renderer/app/constants/icons';
import { AddTab, StyledTabbar, TabsContainer } from './style';
import { Tabs } from '../Tabs';
import HorizontalScrollbar from '~/renderer/app/components/HorizontalScrollbar';
import sitesStore from '~/renderer/app/store/SitesStore';

const A = () => {
  const getContainer = () => sitesStore.tabs.containerRef.current;

  const onMouseEnter = () => (sitesStore.tabs.scrollbarVisible = true);

  const onMouseLeave = () => (sitesStore.tabs.scrollbarVisible = false);

  const onAddTabClick = () => {
    sitesStore.tabs.onNewTab()
  };
  return (
        <StyledTabbar>
            <TabsContainer
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                ref={sitesStore.tabs.containerRef}
            >
                <Tabs/>
            </TabsContainer>
            {sitesStore.tabs.list.length > 0 && <AddTab
                className={'tabber'}
                icon={icons.add}
                onClick={onAddTabClick}
                divRef={(r: any) => (sitesStore.addTab.ref = r)}
            />}
            <HorizontalScrollbar
                ref={sitesStore.tabs.scrollbarRef}
                enabled={sitesStore.tabs.scrollable}
                visible={sitesStore.tabs.scrollbarVisible}
                getContainer={getContainer}
            />
        </StyledTabbar>
  );
}
export const Tabbar = observer(A);
