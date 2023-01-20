import * as React from 'react';
import {Fab, Tooltip} from "@material-ui/core";
import {Add, Message, Remove, SpeakerNotesOff, VolumeOff, VolumeUp} from "@material-ui/icons";
import sitesStore from "~/renderer/app/store/SitesStore";
import {observer} from "mobx-react";

const SettingsButton = observer(() => {
    return (<div
        style={{position: 'absolute', right: '30px', top: "1px", zIndex:100, zoom: 0.5}}
    >

        <Tooltip title={sitesStore.settings.notifMuted ? 'Включить звук уведомлений' : "Выключить звук уведомлений"} placement={'bottom-start'}>
            <Fab
                color="default"
                aria-label="mute"
                onClick={() => {
                    sitesStore.settings.notifMuted = !sitesStore.settings.notifMuted
                }}

                size={"small"}
            >
                {sitesStore.settings.notifMuted ? <SpeakerNotesOff color={'secondary'}/> : <Message />}
            </Fab>
        </Tooltip>
        <Tooltip title={sitesStore.settings.muted ? 'Включить звук уведомлений' : "Выключить звук уведомлений"} placement={'bottom-start'}>
            <Fab
                color="default"
                aria-label="mute"
                onClick={() => {
                    sitesStore.settings.muted = !sitesStore.settings.muted
                }}

                size={"small"}
            >
                {sitesStore.settings.muted ? <VolumeOff color={'secondary'}/> : <VolumeUp />}
            </Fab>
        </Tooltip>
        <Tooltip title={'Увеличить масштаб'} placement={'bottom'}>
            <Fab
                color="default"
                aria-label="add"
                onClick={() => {
                    sitesStore.settings.incrementZoomLevel();
                }}

                size={"small"}
            >
                <Add />
            </Fab>
        </Tooltip>
        <Tooltip title={'Уменьшить масштаб'} placement={'bottom'}>
            <Fab
                color="default"
                aria-label="add"
                onClick={() => {
                    sitesStore.settings.decrementZoomLevel()
                }}
                size={"small"}
            >
                <Remove />
            </Fab>
        </Tooltip>
    </div>)
})

export default SettingsButton