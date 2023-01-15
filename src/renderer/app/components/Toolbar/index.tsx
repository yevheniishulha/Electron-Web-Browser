import { observer } from 'mobx-react';
import * as React from 'react';

import { StyledToolbar, Buttons } from './style';
import { NavigationButtons } from '../NavigationButtons';
import { Tabbar } from '../Tabbar';
import ToolbarButton from '../ToolbarButton';
import { icons } from '../../constants';
import { ipcRenderer } from 'electron';
import SitesStore from "~/renderer/app/store/SitesStore";

const onUpdateClick = () => {
  ipcRenderer.send('update-install');
};

export const Toolbar = observer(() => {
    const store = SitesStore.activeStore

  return (
    <StyledToolbar isHTMLFullscreen={store.isHTMLFullscreen}>
      <NavigationButtons />
      <Tabbar />
      <Buttons>
        {store.updateInfo.available && (
          <ToolbarButton icon={icons.download} onClick={onUpdateClick} />
        )}
      </Buttons>
    </StyledToolbar>
  );
});
