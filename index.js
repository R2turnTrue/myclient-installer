const { ipcMain, app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const request = require('request')
let window
const util = require('./util')
const fs = require('fs')

app.whenReady().then(() => {
    window = new BrowserWindow({
        height: 400,
        width: 650,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    window.loadFile(__dirname + '/index.html')
})

ipcMain.on('loadVersions', (event) => {
    request({
        uri: 'http://localhost:53573',
        method: 'GET',
        headers: {
            Accept: 'Application/json'
        }
    }, (err, res, body) => {
        if(err) {
            console.error(err)
            event.reply('loadedVersions', ['불러오는데 실패하였습니다. 재시작해주세요.']) 
            dialog.showErrorBox('오류!', '불러오는데 실패하였습니다. 재시작해주세요.')
            process.exit(1)
        }
        const oldvers = JSON.parse(body).oldVersions
        const latest = JSON.parse(body).latest
        let arr = oldvers
        arr[arr.length] = latest + '(추천)'
        event.reply('loadedVersions', arr)
    })
})

ipcMain.on('install', (event, arg0) => {
    if(!arg0.includes('추천')) {
        const opt = dialog.showMessageBoxSync(window, {
            
            buttons: ['Yes','No'],
            message: '이 옵션은 추천하지 않습니다. 설치하시겠습니까?',
        })
        console.log(opt)
        if(opt === 0) {
            doInstall(arg0, event)
            return
        } else {
            return
        }
        
    }
    doInstall(arg0, event)
    return
})

function doInstall(tab, event) {
    console.log('Loading...')
    console.log('DL0')
    event.reply('download0')
    util.downloadFile('http://localhost:53573/download_client/' + tab.replace('(추천)', ''), fs.createWriteStream('./MyClient.jar'), () => {
        console.log('DL1 complete')
        event.reply('downloaded1')
        util.downloadFile('http://localhost:53573/download_json/' + tab.replace('(추천)', ''), fs.createWriteStream('./MyClient.json'), () => {
            console.log('DL2 complete')
            event.reply('downloaded2')
        })
    })
}