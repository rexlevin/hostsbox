const { contextBridge, ipcRenderer } = require('electron');
const shell = require('electron').shell;
const Store = require('electron-store');
const path = require('path')
const os = require('os')
const fs = require('fs')
const sqlite3 = require('sqlite3')
const { nanoid } = require('nanoid') // nanoid是内部的函数，记得要加{}包起来，否则报错nanoid is not a function

const store = new Store();
(function() {
    if(undefined == store.get('userData')) {
        ipcRenderer.send('userdata-message', '');
        ipcRenderer.on('userdata-reply', (event, args) => {
            store.set('userData', args);
        });
    }
})()

contextBridge.exposeInMainWorld(
    'api', {
        test: (s) => {alert(s)},
        openHostsDir: () => {openHostsDir()},
        hosts: () => {return readHosts()},
        writeEntry: (content,callback) => {writeEntry(content,callback);},
        initDB: (callback) => {initDB(callback)},
        queryData: (sql, callback) => {queryData(sql, callback)},
        insert: (sql, args) => {insert(sql, args);},
        sid: () => {return nanoid()},
        exit: () => { ipcRenderer.send('exit'); }
    }
);

function openHostsDir() {
    let hostsPath = getHostsPath();
    shell.showItemInFolder(hostsPath);
}

function writeEntry(content,callback) {
    let hostsPath = getHostsPath();
    fs.writeFile(hostsPath, content, function(err) {
        if(err) {
            console.error('写入hosts文件出错=====' + err);
            callback('failed');
        }
        callback('success');
    });
}
function readHosts() {
    let content;
    let hostsPath = getHostsPath();
    content = fs.readFileSync(hostsPath, 'utf8');
    if(undefined == content || '' == content) {
        console.error('hosts is not correct');
        return '';
    }
    return content;
}

function getHostsPath() {
    return 'windows' == platform() ? 'c:\\windows\\system32\\drivers\\etc\\hosts' : '/depot/cargo/hosts';
}

function platform() {
    let type = os.type();
    if (type == 'windows_nt') return "windows";
    if (type == 'linux') return 'linux';
    if (type == 'darwin') return 'darwin'
    return 'other';
}

let dbfile;
const sql1 = 'create table hosts_entry(id text primary key, name text comment \'条目名\', content text, state text default \'0\')';
function initDB(callback) {
    if(fs.existsSync(getDbfile())) if(callback) {callback('exists');return;}
    console.info('now initialize db');
    fs.appendFile(getDbfile(), '', (err) => {
        if(err && callback) callback('failed')
        let db = new sqlite3.Database(getDbfile())
        db.serialize(() => {
            db.run(sql1);
        });
        db.close();
        if(callback) callback('success')
    })
}
function queryData(sql, callback) {
    let db = new sqlite3.Database(getDbfile())
    db.serialize(() => {
        db.all(sql, (err, rows) => {
            if(err) return;
            if(callback) callback(rows);
        });
    });
    db.close();
}
function execSQL(sql) {
    let db = new sqlite3.Database(getDbfile())
    db.serialize(() => {
        let stmt = db.prepare(sql);
        stmt.run(args[i]);
    });
    db.close();
}

// [[id, name, content, state], [id, name, content, state], ......]
function insert(sql, args) {
    let db = new sqlite3.Database(getDbfile())
    db.serialize(() => {
        let stmt = db.prepare(sql);
        for(let i = 0; i < args.length; i++) {
            stmt.run(args[i]);
        }
        stmt.finalize();
    });
    db.close();
}

function getDbfile() {
    return path.join(store.get('userData'), 'hostsbox.db');
}
