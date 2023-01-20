import { observer } from 'mobx-react';
import * as React from 'react';

import { Preloader } from '~/renderer/components/Preloader';
import { Tab } from '~/renderer/app/models';
import store from '~/renderer/app/store/SitesStore';
import {
  StyledTab,
  StyledContent,
  StyledIcon,
  StyledTitle,
  StyledClose,
  StyledBorder,
  StyledOverlay,
  TabContainer,
} from './style';
import { shadeBlendConvert } from '~/renderer/app/utils';
import { remote } from 'electron';
import Ripple from '~/renderer/components/Ripple';
import {SiteTab} from "~/renderer/app/store/sites-tabs";
const removeTab = (tab: SiteTab) => () => {
  tab.close();
};

const onCloseMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
  e.stopPropagation();
};

const onMouseDown = (tab: SiteTab) => (e: React.MouseEvent<HTMLDivElement>) => {
  const { pageX } = e;

  tab.select();

  store.sitesListVisible = false;
  store.tabs.lastMouseX = 0;
  store.tabs.isDragging = true;
  store.tabs.mouseStartX = pageX;
  store.tabs.tabStartX = tab.left;

  store.tabs.lastScrollLeft = store.tabs.containerRef.current.scrollLeft;
};

const onMouseEnter = (tab: SiteTab) => () => {
  if (!store.tabs.isDragging) {
    store.tabs.hoveredTabId = tab.id;
  }
};

const onMouseLeave = () => {
  store.tabs.hoveredTabId = -1;
};

const onClick = (tab: SiteTab) => (e: React.MouseEvent<HTMLDivElement>) => {
  if (e.button === 4) {
    removeTab(tab)();
  }
};

const onMouseUp = (tab: SiteTab) => (e: React.MouseEvent<HTMLDivElement>) => {
  if (e.button === 1) {
    removeTab(tab)();
  }
};

const onContextMenu = (tab: SiteTab) => () => {
  const tabs = store.tabs.list;


};
const Content = observer(({ tab }: { tab: SiteTab }) => {
  return (
    <StyledContent collapsed={tab.isExpanded}>
      {!tab.loading && tab.favicon !== '' && (
        <StyledIcon
          isIconSet={tab.favicon !== ''}
          style={{ backgroundImage: `url(${tab.favicon})` }}
        />
      )}
      {tab.loading && (
        <Preloader
          thickness={6}
          size={16}
          style={{ minWidth: 16 }}
        />
      )}
      <StyledTitle
        isIcon={tab.isIconSet}
        style={{
          color: tab.isSelected
            ? store.theme['tab.selected.textColor']
            : store.theme['tab.textColor'],
        }}
      >
        {tab.id}
      </StyledTitle>
    </StyledContent>
  );
});

const Close = observer(({ tab }: { tab: SiteTab }) => {
  return (
    <StyledClose
      onMouseDown={onCloseMouseDown}
      onClick={removeTab(tab)}
      visible={tab.isExpanded}
    />
  );
});

const Border = observer(({ tab }: { tab: SiteTab }) => {
  return <StyledBorder visible={true} />;
});

const Overlay = observer(({ tab }: { tab: SiteTab }) => {
  return (
    <StyledOverlay
      hovered={tab.isHovered}
      style={{
        backgroundColor: tab.isSelected
          ? shadeBlendConvert(
              store.theme['tab.selectedHover.backgroundOpacity'],
              tab.background,
              store.theme['toolbar.backgroundColor'],
            )
          : store.theme['tab.hover.backgroundColor'],
      }}
    />
  );
});

export default observer(({ tab }: { tab: SiteTab }) => {
  return (
    <StyledTab
      selected={tab.isSelected}
      onMouseDown={onMouseDown(tab)}
      onMouseUp={onMouseUp(tab)}
      onMouseEnter={onMouseEnter(tab)}
      onContextMenu={onContextMenu(tab)}
      onClick={onClick(tab)}
      onMouseLeave={onMouseLeave}
      visible={true}
      ref={tab.ref}
    >
      <TabContainer
        style={{
          backgroundColor: tab.isSelected
            ? shadeBlendConvert(
                store.theme['tab.backgroundOpacity'],
                tab.background,
                store.theme['toolbar.backgroundColor'],
              )
            : tab.isHighlighted ? 'orange' : 'transparent',
        }}
      >
        <Content tab={tab} />
        <Close tab={tab} />

        <Overlay tab={tab} />
        <Ripple
          rippleTime={0.6}
          opacity={0.15}
          color={tab.background}
          style={{ zIndex: 9 }}
        />
      </TabContainer>
      <Border tab={tab} />
    </StyledTab>
  );
});
