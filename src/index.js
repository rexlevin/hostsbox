(function() {
    // window.api.test('hello');
    changeBar(0);
})()

const vueApp = {
    data() {
        return {
            hosts:  window.api.hosts(),
            entryCommon: '',
            entries: [],
            choseId: '',
            visible: false
        }
    },
    created() {
        document.addEventListener('keyup', (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key == 'I' || e.key ==  'i')) {
                window.api.devTools();
            }
            if (e.ctrlKey && (e.key == 'r' || e.key == 'R')) {
                window.api.reload();
            }
        });

        window.api.createBackup();
        window.api.initDB(this.hosts, (ret, rows) => {
            console.info('初始化数据库==' + ret);
            if('failed' == ret) {
                alert('init db failed, app will terminated.');
                window.api.exit();
                return;
            }
            if(undefined == rows || 0 >= rows.length) return;
            for(let i = 0; i < rows.length; i++) {
                if('0000' == rows[i]['id']) {
                    this.entryCommon = {'id': rows[i]['id'], 'name': rows[i]['name'], 'content': rows[i]['content'], 'state': rows[i]['state']};
                } else {
                    this.entries.push({'id': rows[i]['id'], 'name': rows[i]['name'], 'content': rows[i]['content'], 'state': rows[i]['state']});
                }
            }
        });
        // document.onkeyup = (e) => {
        //     if(e.keyCode === 27) {
        //         if(undefined != this.$refs.shade && this.$refs.shade.style.display == 'block') {
        //             this.$refs.shade.style.display = 'none';
        //         }
        //     }
        // }
    },
    mounted() {
        // 设置title
        window.api.getTitle('title', (v) => {
            document.title = v;
        });

        let divRightMenu = document.getElementById('rightMenu');
        let lis = divRightMenu.getElementsByTagName('li');
        lis[0].addEventListener('click', (e) => {
            console.info(this.choseId)

            let event = document.createEvent('MouseEvents')
            event.initEvent('click', true, true)
            document.getElementById(this.choseId).dispatchEvent(event);
            event.initEvent('dblclick', true, true)
            document.getElementById(this.choseId).dispatchEvent(event);
        });
        lis[1].addEventListener('click', (e) => {
            this.deleteEntry(this.choseId);
        });
        this.$refs.entryName.addEventListener('keyup', (e) => {
            if(e.keyCode != 13) return;
            let entryName = this.$refs.entryName.value.trim();
            if(undefined == entryName || '' == entryName) return;
            this.addEntryConfirm();
        });
    },
    methods: {
        openHostsDir() { window.api.openHostsDir(); },
        openCommon(e) {
            if(e.target.classList.contains('naviChecked')) return;
            let id = '0000';
            this.choseId = id;
            // console.info('==========content===' + this.entryCommon['content']);
            this.$refs.content.value = this.entryCommon['content'];
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
            this.$refs.shade.addEventListener('keyup', (e) => {
                console.info('key: ', e.key);
                if(e.key === 'Escape') {
                    this.$refs.shade.style.display = 'none';
                }
                if (e.key === 'Enter' && this.$refs.entryName.value.trim() !== undefined && this.$refs.entryName.value.trim() !== '') {
                    this.addEntryConfirm();
                }
            });
        },
        addEntryCancel() { this.$refs.entryName.value = ''; this.$refs.shade.style.display = 'none'; },
        addEntryConfirm() {
            let id = window.api.sid();
            let entryName = this.$refs.entryName.value.trim();
            if(undefined == entryName || '' == entryName) return;
            let content = '#--------- ' + entryName + ' ---------\n';
            this.choseId = id;
            this.entries.push({'id': id, 'name': entryName, 'content': content, 'state': '0'});
            this.$refs.entryName.value = '';
            this.$refs.shade.style.display = 'none';

            let sql = 'insert into hosts_entry(id, name, content, state) values(?, ?, ?, ?)'
            window.api.insert(sql, [[id, entryName, content, '0']]);
            // alert('保存成功');
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
                // update content
            let sql = 'update hosts_entry set content = ? where id = ?';
            window.api.execSQL(sql, [[item['content'], item['id']]]);
            alert('entry内容修改成功');
        },
        deleteEntry(id) {
            /*
             * 1、删除entries中的记录
             * 2、删除库中记录
             * 3、如此条entry是激活状态，还需重写hosts
             * 4、删除界面上的此条entry显示
             */
            let entry;
            for(let item of this.entries) {
                if(id == item['id']) {
                    entry = item;
                    console.info(item.id + '=======index=====' + this.entries.indexOf(item));
                    this.entries.splice(this.entries.indexOf(item), 1);
                    break;
                }
            }
            let sql = 'delete from hosts_entry where id = ?';
            window.api.execSQL(sql, [[entry['id']]]);

            if('1' == entry['state']) {
                let newHosts = buildHosts(this.entryCommon, this.entries);
                window.api.rewriteHosts(newHosts, function(ret) {
                    if('failed' == ret) {
                        alert('重写hosts出错');
                        return;
                    }
                });
            }
        },
        activeEntry(e) {
            /*
             * 激活配置需要：
             * 1、将当前条entry激活
             * 2、获取公共及所有激活的entry
             * 3、将公共及所有激活entry的内容写入hosts
             */

            let id = e.target.id;
            this.choseId = id;

            let state = getItem(this.entries, id)['state'];
            let r1 = changeState(this.entries, id, '1' === state ? '0' : '1');
            // if('failed' == r1) {
            //     alert(('1' == state ? '失效' : '激活') + '当前配置失败');
            //     window.api.exit();
            //     return;
            // }

            console.info('this.entryCommon: ', this.entryCommon);
            console.info('this.entries: ', this.entries);
            let newHosts = buildHosts(this.entryCommon, this.entries);
            console.info('newHosts: ', newHosts);
            const _this = this;
            window.api.rewriteHosts(newHosts, function(ret) {
                if('failed' == ret) {
                    alert('激活配置出错');
                    changeState(this.entries, id, '1' === state ? '0' : '1');
                    return;
                }

                let sql = 'update hosts_entry set state = ? where id = ?';
                window.api.execSQL(sql, [['1' == state ? '0' : '1', id]]);
                console.info('entry激活入库成功');

                if('1' == state) {
                    e.target.firstElementChild.classList.remove('active');
                } else {
                    e.target.firstElementChild.classList.add('active');
                }
            });
        },
        rightMenu(e) {
            console.info(e.target.id);
            this.choseId = e.target.id;
            this.visible = true;
            let menu = document.getElementById('rightMenu');
            let evt = e || window.event;
            menu.style.left = evt.pageX + 'px';
            menu.style.top = evt.pageY + 'px';
            menu.style.display = 'block';
        },
        rightMenuHide() {
            this.visible = false;
        }
    },
    watch: {
        visible(value) {
            if(value) {
                document.body.addEventListener('click', this.rightMenuHide);
            } else {
                document.body.removeEventListener('click', this.rightMenuHide);
            }
        }
    }
}
Vue.createApp(vueApp).mount('#main')

function buildHosts(common, array) {
    let c = common['content'];
    for(let item of array) {
        if('0' == item['state']) continue;
        c += '\n\n';
        c += item['content'];
        c += '\n';
    }
    return c;
}

function changeState(array, id, state) {
    let f = false;
    for(let i = 0; i < array.length; i++) {
        if(id == array[i]['id']) {
            array[i]['state'] = state;
            f = true;
            break;
        }
    }
    return f ? 'success' : 'failed';
}
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
