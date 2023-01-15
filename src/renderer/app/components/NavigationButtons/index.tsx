import { observer } from 'mobx-react';
import * as React from 'react';

import store from '~/renderer/app/store';
import ToolbarButton from '~/renderer/app/components/ToolbarButton';
import { icons } from '~/renderer/app/constants/icons';
import { StyledContainer } from './style';
import SitesStore from "~/renderer/app/store/SitesStore";



export const NavigationButtons = observer(() => {
    const onBackClick = () => {
        SitesStore.activeStore.tabs.selectedTab.callViewMethod('webContents.goBack');
    };

    const onForwardClick = () => {
        SitesStore.activeStore.tabs.selectedTab.callViewMethod('webContents.goForward');
    };

    const onHomeClick = () => {
        SitesStore.activeStore.tabGroups.currentGroup.selectedTabId = -1;
    }

    const onRefreshClick = () => {

        SitesStore.activeStore.tabs.selectedTab.callViewMethod('webContents.reload');

    };
  const { selectedTab } = SitesStore.activeStore.tabs;

  let isWindow = false;
  let loading = false;

  if (selectedTab) {
    isWindow = selectedTab.isWindow;
    loading = selectedTab.loading;
  }

    return (
    <StyledContainer isFullscreen={SitesStore.activeStore.isFullscreen}>
      <ToolbarButton
        disabled={!SitesStore.activeStore.navigationState.canGoBack}
        size={24}
        icon={icons.back}
        style={{ marginLeft: 8 }}
        onClick={onBackClick}
      />
      <ToolbarButton
        disabled={!SitesStore.activeStore.navigationState.canGoForward}
        size={24}
        icon={icons.forward}
        onClick={onForwardClick}
      />
      <ToolbarButton
        disabled={false}
        size={20}
        icon={icons.home}
        onClick={onHomeClick}
      />
      <ToolbarButton
        disabled={isWindow}
        size={20}
        icon={icons.refresh}
        onClick={onRefreshClick}
      />
    </StyledContainer>
  );
});
