import * as React from 'react';
import { observer } from 'mobx-react';

import store from '~/renderer/app/store/SitesStore';
import Tab from '../Tab';
import sitesStore from "~/renderer/app/store/SitesStore";
import {AddTab} from "~/renderer/app/components/SitesApp/Tabbar/style";
import {icons} from "~/renderer/app/constants";

export const Tabs = observer(() => {

  return (
    <React.Fragment>
      {store.tabs.list.map(item => (
        <Tab key={item.id} tab={item} />
      ))}

    </React.Fragment>
  );
});
