const { contextBridge, ipcRenderer } = require('electron');
const shell = require('electron').shell;
const Store = require('electron-store');
const path = require('path')
const os = require('os')
const fs = require('fs')
const sqlite3 = require('sqlite3')
const { nanoid } = require('nanoid'); // nanoid是内部的函数，记得要加{}包起来，否则报错nanoid is not a function
const { exit } = require('process');

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
        createBackup: () => {createBackup()},
        openHostsDir: () => {openHostsDir()},
        hosts: () => {return readHosts()},
        rewriteHosts: (content,callback) => {rewriteHosts(content,callback);},
        initDB: (hosts, callback) => {initDB(hosts, callback)},
        queryData: (sql, callback) => {queryData(sql, callback)},
        insert: (sql, args) => {insert(sql, args);},
        execSQL: (sql, args) => {execSQL(sql,args);},
        sid: () => {return nanoid()},
        exit: () => { ipcRenderer.send('exit'); }
    }
);

// 备份hosts文件到程序数据目录下
function createBackup() {
    let origin = getHostsPath(), target = store.get('userData') + '/hosts.bak';
    if(fs.existsSync(target)) return;
    fs.writeFileSync(target, fs.readFileSync(origin));
}

// 使用系统的文件管理器打开hosts文件所在目录
function openHostsDir() {
    let hostsPath = getHostsPath();
    shell.showItemInFolder(hostsPath);
}

function rewriteHosts(content,callback) {
    let hostsPath = getHostsPath();
    fs.writeFile(hostsPath, content, function(err) {
        if(err) {
            console.error('写入hosts文件出错=====' + err);
            if(callback) callback('failed');
        }
        if(callback) callback('success');
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
    return 'windows' == platform() ? 'c:\\windows\\system32\\drivers\\etc\\hosts' : '/etc/hosts';
}

function platform() {
    let type = os.type();
    if (type == 'windows_nt') return "windows";
    if (type == 'linux') return 'linux';
    if (type == 'darwin') return 'darwin'
    return 'other';
}

function initDB(hosts, callback) {
    let sqlCreate = 'create table hosts_entry(id text primary key, name text comment \'条目名\', content text, state text default \'0\')';
    let sqlInsert = 'insert into hosts_entry(id, name, content, state) values(\'0000\', \'公共\', ?, \'1\')';
    let sqlSelect = 'select t.id, t.name, t.content, t.state from hosts_entry t';
    if(fs.existsSync(getDbfile())) {
        let db = new sqlite3.Database(getDbfile());
        db.all(sqlSelect, (err, rows) => {
            if(err) {
                console.error("=====queryData====error====" + err);
                return;
            }
            callback('success', rows);
        });
        db.close();
        callback('exists'); return;
    }
    console.info('now initialize db');

    let db = new sqlite3.Database(getDbfile());
    let args = [[hosts]];
    // db.run(sqlCreate, (err) => {
    //     if(err) callback('failed');
    //     let stmt = db.prepare(sqlInsert);
    //     for(let i = 0; i < args.length; i++) {
    //         stmt.run(args[i]);
    //     }
    //     stmt.finalize();
    //     callback('success');
    // });
    // db.close();

    db.serialize(() => {
        db.run(sqlCreate);
        // let stmt = db.prepare(sqlInsert);
        // for(let i = 0; i < args.length; i++) {
        //     stmt.run(args[i]);
        // }
        // stmt.finalize();
    });
    db.serialize(() => {
        let stmt = db.prepare(sqlInsert);
        for(let i = 0; i < args.length; i++) {
            stmt.run(args[i]);
        }
        stmt.finalize();
    });
    db.all(sqlSelect, (err, rows) => {
        if(err) {
            console.error("=====queryData====error====" + err);
            return;
        }
        callback('success', rows);
    });
    db.close();
}

function queryData(sql, callback) {
    console.info("=====queryData====begin====");
    let db = new sqlite3.Database(getDbfile())
    // db.serialize(() => {
        db.all(sql, (err, rows) => {
            if(err) {
                console.error("=====queryData====error====" + err);
                return;
            }
            if(callback) callback(rows);
        });
    // });
    db.close();
}
function execSQL(sql, args) {
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

// [[id, name, content, state], [id, name, content, state], ......]
function insert(sql, args) {
    let db = new sqlite3.Database(getDbfile());
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
