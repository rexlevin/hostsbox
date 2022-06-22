(function() {
    // window.api.test('hello');
    // window.api.initDB((ret) => {
    //     console.info('初始化数据库==' + ret);
    //     if('failed' == ret) {
    //         alert('init db failed, app will terminated.');
    //         window.api.exit();
    //     }
    // });
    changeBar(0);
})()

const vueApp = {
    data() {
        return {
            hosts:  window.api.hosts(),
            entryCommon: '',
            entries: [],
            choseId: ''
        }
    },
    created() {
        window.api.initDB((ret) => {
            console.info('初始化数据库==' + ret);
            if('failed' == ret) {
                alert('init db failed, app will terminated.');
                window.api.exit();
            }
            if('success' == ret) {
                // 初始化db成功，接下来初始化“公共”
                let sql = 'insert into hosts_entry(id, name, content, state) values(\'0000\', \'公共\', ?, \'1\')';
                window.api.insert(sql, [[window.api.hosts()]]);
            }
        });
        // this.hosts = window.api.hosts();
        window.api.queryData('select t.id, t.name, t.content, t.state from hosts_entry t', (rows) => {
            if(undefined == rows || 0 >= rows.length) return;
            for(let i = 0; i < rows.length; i++) {
                if('0000' == rows[i]['id']) {
                    this.entryCommon = {'id': rows[i]['id'], 'name': rows[i]['name'], 'content': rows[i]['content'], 'state': rows[i]['state'], 'flag': '1'};
                } else {
                    this.entries.push({'id': rows[i]['id'], 'name': rows[i]['name'], 'content': rows[i]['content'], 'state': rows[i]['state'], 'flag': '1'});
                }
            }
        });
        document.onkeyup = (e) => {
            if(e.keyCode === 27) {
                if(undefined != this.$refs.shade && this.$refs.shade.style.display == 'block') {
                    this.$refs.shade.style.display = 'none';
                }
            }
        }
    },
    methods: {
        openHostsDir() { window.api.openHostsDir(); },
        openCommon(e) {
            if(e.target.classList.contains('naviChecked')) return;
            let id = '0000';
            this.choseId = id;
            this.$refs.content.value = this.entryCommon['content']; //getItem(this.entries, id)['content'];
            this.$refs.content.focus();
            this.$refs.content.removeAttribute('readonly');
            for(let item of document.querySelectorAll('.navi')) { item.classList.remove('naviChecked'); }
            e.target.classList.add('naviChecked');
            changeBar(1);
        },
        openHosts(e) {
            if(e.target.classList.contains('naviChecked')) return;
            for(let item of document.querySelectorAll('.navi')) { item.classList.remove('naviChecked'); }
            e.target.classList.add('naviChecked');
            this.$refs.content.value = window.api.hosts();
            changeBar(0);
            this.choseId = '';
            this.$refs.content.setAttribute('readonly', true);
        },
        addEntry() {
            this.$refs.shade.style.display = 'block'; this.$refs.entryName.focus();
            // this.$refs.entryName.addEventListener('keyup', (e) => {
            //     if(e.keyCode === 27) {
            //         this.$refs.shade.style.display = 'none';
            //     }
            // });
            this.$refs.shade.addEventListener('keyup', (e) => {
                if(e.keyCode === 27) {
                    this.$refs.shade.style.display = 'none';
                }
            });
        },
        addEntryCancel() { this.$refs.entryName.value = ''; this.$refs.shade.style.display = 'none'; },
        addEntryConfirm() {
            let id = window.api.sid();
            let entryName = this.$refs.entryName.value;
            let content = '#--------- ' + entryName + ' ---------';
            this.choseId = id;
            this.entries.push({'id': id, 'name': entryName, 'content': content, 'state': '0', 'flag': '0'});
            this.$refs.entryName.value = '';
            this.$refs.shade.style.display = 'none';
            // this.$refs.content.value = content;
            // this.$refs.content.removeAttribute('readonly');
            // this.$refs.content.focus();
            // changeBar(1);
        },
        toggleEntry(e) {
            if(e.target.classList.contains('naviChecked')) return;
            let id = e.target.id;
            this.choseId = id;
            this.$refs.content.value = getItem(this.entries, id)['content'];
            this.$refs.content.focus();
            this.$refs.content.removeAttribute('readonly');
            for(let item of document.querySelectorAll('.navi')) { item.classList.remove('naviChecked'); }
            e.target.classList.add('naviChecked');
            changeBar(1);
        },
        saveEntry() {
            saveContent(this.entries, this.choseId, this.$refs.content.value);
            let item = getItem(this.entries, this.choseId);
            // let sql = 'insert into hosts_entry(id, name, content, state)'
            //     + 'values(' + item['id'] + ', ' + item['name'] + ', ' + item['content'] +', \'0\')';
            if(item['flag'] == '0') {
                // add new entry
                let sql = 'insert into hosts_entry(id, name, content, state) values(?, ?, ?, ?)'
                window.api.insert(sql, [[item['id'], item['name'], item['content'], item['state']]]);
            } else {
                // update content
                let sql = 'update hosts_entry set content = ? where id = ?';
            }
        },
        activeEntry(e) {
            let id = e.target.id;
            this.choseId = id;
            let content = getItem(this.entries, id)['content'];
            window.api.writeEntry(content, function(ret) {
                if('failed' == ret) {
                    alert('激活配置出错');
                    return;
                }
                e.target.nextElementSibling.classList.add('active');
            });
        }
    }
}
Vue.createApp(vueApp).mount('#main')

function saveContent(array, id, content) {
    for(let i = 0; i < array.length; i++) {
        if(id == array[i]['id']){
            array[i]['content'] = content;
            break;
        }
    }
}
function getItem(array, id) {
    for(let i = 0; i < array.length; i++) {
        if(id == array[i]['id']){
            return array[i];
        }
    }
}

// 设置“保存”按钮是否可点击，1-不可点击，否则可点击
function changeBar(o) {
    if(1 == o) {
        document.getElementById('saveBtn').disabled = false;
        return;
    }
    document.getElementById('saveBtn').disabled = true;
}
