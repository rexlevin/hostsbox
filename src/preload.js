const { contextBridge, ipcRenderer } = require('electron');
const path = require('path')
const os = require('os')
const fs = require('fs')
const sqlite3 = require('sqlite3')

contextBridge.exposeInMainWorld(
    'api', {
        test: () => {alert('ok');},
        hosts: () => {return readHosts()},
        initDB: () => {initDB()},
        queryData: (sql, callback) => {queryData(sql, callback)}

    }
);

function readHosts() {
    let content;
    let hostsPath = 'windows' == platform() ? 'c:\\windows\\system32\\drivers\\etc\\hosts' : '/depot/cargo/hosts';
    content = fs.readFileSync(hostsPath, 'utf8');
    if(undefined == content || '' == content) {
        console.error('hosts is not correct');
        return ''
    }
    return content
}

function platform() {
    let type = os.type();
    if (type == 'windows_nt') return "windows";
    if (type == 'linux') return 'linux';
    if (type == 'darwin') return 'darwin'
    return 'other';
}

let dbfile;
const sql1 = 'create table sub_hosts(id text primary key, name text, content text)';
function initDB() {
    // getUserDataPath
    ipcRenderer.send('userdata-message', '')
    ipcRenderer.on('userdata-reply', (event, args) => {
        dbfile = path.join(args, 'hostsbox.db');
        if(fs.existsSync(dbfile)) return;
        console.info('now initialize db');
        fs.appendFileSync(dbfile, '');
        let db = new sqlite3.Database(dbfile)
        db.serialize(() => {
            db.run(sql1);
        });
        db.close();
        // fs.appendFile(dbfile, '', (err) => {
        //     if(err) return 'failed'
        //     let db = new sqlite3.Database(dbfile)
        //     db.serialize(() => {
        //         db.run(sql1);
        //     });
        //     db.close();
        // })
    })
}
function queryData(sql, callback) {
    let db = new sqlite3.Database(dbfile)
    db.serialize(() => {
        db.all(sql, (err, rows) => {
            if(err) return;
            if(callback) callback(rows);
        });
    });
    db.close();
}
function execSQL(sql) {
    let db = new sqlite3.Database(dbfile)
    db.serialize(() => {
        let stmt = db.prepare(sql);
        stmt.run(args[i]);
    });
    db.close();
}
/**
 *
 */
function insert(sql, args) {
    let db = new sqlite3.Database(dbfile)
    db.serialize(() => {
        let stmt = db.prepare(sql);
        for(let i = 0; i < args.length; i++) {
            stmt.run(args[i]);
        }
        db.finalize();
    });
    db.close();
}
