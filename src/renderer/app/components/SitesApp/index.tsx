import * as React from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { Style } from '~/renderer/app/style';
import {StyledApp} from "~/renderer/app/components/App/style";
import {Tabbar} from "~/renderer/app/components/SitesApp/Tabbar";
import {lightTheme} from "~/renderer/constants/themes";
import {Overlay} from "./Overlay";
import {observer} from "mobx-react";
import store from "~/renderer/app/store/SitesStore";
import {StyledToolbar} from "~/renderer/app/components/Toolbar/style";
import {App} from "~/renderer/app/components/App";
const GlobalStyle = createGlobalStyle`${Style}`;
const Sites = observer(() => {
  return(
      <ThemeProvider theme={lightTheme}>
          <StyledApp>
              <GlobalStyle />
              <StyledToolbar isHTMLFullscreen={store.isHTMLFullscreen}>
                  <Tabbar />
              </StyledToolbar>
              <Overlay />
              {!store.sitesListVisible && <App/>}
          </StyledApp>
      </ThemeProvider>
  )
})
export default Sites
