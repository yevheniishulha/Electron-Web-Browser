import * as React from "react"
import Button from '@material-ui/core/Button';
import sites from './../../../constants/sites'
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";
import { icons } from '../../../constants';
import {observer} from "mobx-react";
import store from "~/renderer/app/store/SitesStore";


const PortalsList = observer(() => {

    const addSite = (site: any) => {
        store.tabs.addTab(site)
    }
    const handler = (e: any, elem: any) => {

    };

    let buttonsList: any = [];

    sites.map(function (elem) {
        buttonsList.push(
            <Button variant="outlined" color="primary" style={{
                margin: '10px',
                width: '25%'
            }} onClick={(e) => addSite(elem)}>
                {elem.name}
            </Button>
        )
    })

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            height: '100%',
            justifyContent: 'center',
        }}>
            {buttonsList}
            <Paper
                elevation={3}
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    padding: '15px',
                    left: '20px',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <Box style={{
                    width: '50%',
                }}>
                    <Button
                        color={'primary'}
                        size={'small'}
                        // onClick={() => window.shell.openExternal('https://t.me/HelpChatcomua')}
                    >
                        <img src={icons.telegram}/> Поддержка
                    </Button>
                    <Button
                        color={'primary'}
                        size={'small'}
                        // onClick={() => window.shell.openExternal('https://t.me/helpchatua')}
                    >
                        <img src={icons.telegram}/> Новости
                    </Button>
                    <Button
                        color={'primary'}
                        size={'small'}
                        // onClick={() => window.shell.openExternal('viber://chat?number=+380994162317/')}
                    >
                        <img src={icons.viber} /> Поддержка
                    </Button>
                </Box>
                <Box style={{
                    width: '50%',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <Button
                        color={'primary'}
                        disabled={store.clicked1}
                        size={'small'}
                        onClick={() => store.clicked1 = true}
                    >
                        {store.clicked1 ? 'Чтобы изменения вступили в силу перезапустите приложение' : 'Обновить приложение'}
                    </Button>
                    <Button
                        disabled={store.clicked2}
                        color={'secondary'}
                        size={'small'}
                        onClick={() =>  store.clicked2 = true}
                    >
                        {store.clicked2 ? 'Чтобы изменения вступили в силу перезапустите приложение' : 'Очистить личные данные'}
                    </Button>

                </Box>
            </Paper>
        </div>
    );


})


export default PortalsList;