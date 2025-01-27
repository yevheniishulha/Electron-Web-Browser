import * as React from 'react';
import { observer } from 'mobx-react';
import Tab from '../Tab';
import SitesStore from "~/renderer/app/store/SitesStore";

export const Tabs = observer(() => {
  const store = SitesStore.activeStore
  return (
    <React.Fragment>
      {store.tabs.list.map(item => (
        <Tab key={item.id} tab={item} />
      ))}
    </React.Fragment>
  );
});
