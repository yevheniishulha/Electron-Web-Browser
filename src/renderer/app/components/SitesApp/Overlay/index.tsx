import { observer } from 'mobx-react';
import * as React from 'react';

import store from '~/renderer/app/store/SitesStore';
import {
  StyledOverlay,
  HeaderText,
  HeaderArrow,
  Scrollable,
  Title,
  Content,
  Container,
  Handle,
} from './style';
import PortalsList from "~/renderer/app/components/SitesApp/Overlay/PortalsList";


export const Header = ({ children, clickable }: any) => {
  return (
    <HeaderText clickable={clickable}>
      {children}
      {clickable && <HeaderArrow />}
    </HeaderText>
  );
};


export const Overlay = observer(() => {
  return (
    <StyledOverlay visible={store.sitesListVisible} style={{top: '33px'}}>
      <Handle visible={store.sitesListVisible} />
      <PortalsList />
    </StyledOverlay>
  );
});
