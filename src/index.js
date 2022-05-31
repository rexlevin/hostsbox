(function() {
    // window.api.test();
    window.api.initDB();
    window.api.queryData('select * from sub_hosts', (rows) => {
        if(0 >= rows.length) return;
        for(let i = 0; i < rows.length; i++) console.info(rows[i]);
    });
})()

const vueApp = {
    data() {
        return {
            hosts: window.api.hosts()
            // sub_hosts: window.api.queryData('select * from sub_hosts', (rows) => {
            //     for(let i = 0; i < rows.length; i++) console.info(rows[i]);
            // })
        }
    },
    methods: {
        add_sub(event) {
            //
            // this.subs.push({});
        }
    }
}
Vue.createApp(vueApp).mount('#main')
