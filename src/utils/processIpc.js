import { ipcMain, ipcRenderer } from 'electron'

export function ipcRendererInvoke(name){
    ipcRenderer.invoke(name)
}



