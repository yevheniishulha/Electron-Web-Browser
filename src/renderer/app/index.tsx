import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { fonts } from '../constants';
import { ipcRenderer } from 'electron';
import SitesApp from "~/renderer/app/components/SitesApp";

ipcRenderer.setMaxListeners(0);

const styleElement = document.createElement('style');

styleElement.textContent = `
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  src: url(${fonts.robotoRegular}) format('woff2');
}
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  src: url(${fonts.robotoMedium}) format('woff2');
}
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 300;
  src: url(${fonts.robotoLight}) format('woff2');
}
`;

document.head.appendChild(styleElement);

// store.tabGroups.addGroup();
ReactDOM.render(<SitesApp />, document.getElementById('app'));
