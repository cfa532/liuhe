import { defineStore } from 'pinia';
import { useAuthStore } from '@/stores';

// Hprose API
const ayApi = ["GetVarByContext", "Act", "Login", "Getvar", "SwarmLocal", "DhtGetAllKeys","MFOpenByPath",
    "DhtGet", "DhtGets", "SignPPT", "RequestService", "SwarmAddrs", "MFOpenTempFile", "MFTemp2MacFile", "MFSetData",
    "MFGetData", "MMCreate", "MMOpen", "Hset", "Hget", "Hmset", "Hmget", "Zadd", "Zrangebyscore", "Zrange", "MFOpenMacFile",
    "MFReaddir", "MFGetMimeType", "MFSetObject", "MFGetObject", "Zcount", "Zrevrange", "Hlen", "Hscan", "Hrevscan",
    "MMRelease", "MMBackup", "MFStat", "Zrem", "Zremrangebyscore", "MiMeiPublish", "PullMsg", "MFTemp2Ipfs", "MFSetCid",
    "MMSum", "MiMeiSync", "IpfsAdd", "MMAddRef", "MMDelRef", "MMDelVers", "MMRelease", "MMGetRef", "MMGetRefs", "Hdel",
    "Hgetall", "Hkeys", "Del", "MiMeiSync", "MMSetRight"
];

function getcurips() {
    let ips = "127.0.0.1:4800"
    // getParam is a Leither function
    if (window.getParam != null){
        const p=window.getParam()
        ips = p["ips"][p.CurNode]
        console.log("window.getParam", ips, p)
    } else if (window.location.host != ""){
        ips = window.location.host
        console.log("window.location", ips, window.location)
    }
    return import.meta.env.VITE_LEITHER_IP ? import.meta.env.VITE_LEITHER_IP : ips
};
const ips = getcurips();    // web server's IP. Leither might be on different node, assigned by authentication server.
const client = window.hprose.Client.create("ws://" + ips + "/ws/", ayApi)       // Hprose client

export const useLeitherStore = defineStore({
    id: 'LeitherApiHandler',
    state: () => ({
        _sid: "",       // if sid="", MM read only
        ips: ips,
        sid_timestamp: Date.now(),
        client: client,       // Hprose client
    }),
    getters: {
        hostId: async (state)=>{
            return await state.client.Getvar("", "hostid")
        }
    },
    actions: {
        async sid() {
            if (Date.now() - this.sid_timestamp > 1000 * 60 * 60 * 24 || !this._sid) {
                const result = await client.Login(useAuthStore().ppt)
                this._sid = result ? result.sid : ""
                return this._sid
            } else {
                return this._sid
            }
        },        
    }
})

export const useMainStore = defineStore({
    id: 'MainMimei',      // Mimei to store all users' profile
    state: ()=>({
        api: useLeitherStore(),      // leither api handler, must be inited beforehand
        mid: import.meta.env.VITE_MIMEI_DB,             // main database Mimei ID, for all users' profile data
        // populated after user login. The Id is read from main database Mimei, store all cases handled by the current user
        _mmsid: "",         // session id for reading only access
        user_key: import.meta.env.VITE_USER_ACCOUNTS_KEY,
    }),
    getters: {
        mmsid: async function(state) :Promise<string> {
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(await this.api.sid(), this.mid, "last");
            return state._mmsid;
        },
        mmsidCur: async function() :Promise<string> {
            return await this.api.client.MMOpen(await this.api.sid(), this.mid, "cur");
        },
    },
    actions: {
        init(api:any) {
            this.$state.api = api;        // leither api object
            window.mmInfo = this.$state;    // for easy testing
        },
        async backup(mid: string="") {
            if (!mid) mid = this.mid;
            try {
                const newVer = await this.api.client.MMBackup(await this.api.sid(), mid, '', "delref=true")
                this.$state._mmsid = await this.api.client.MMOpen(await this.api.sid(), mid, "last");
                // now publish a new version of database Mimei
                const ret:DhtReply = this.api.client.MiMeiPublish(await this.api.sid(), "", mid)
                console.log("Main Mimei publish []DhtReply=", ret, this._mmsid, "newVer="+newVer)
            } catch(err:any) {
                throw new Error(err)
            }
        },
        async authenticate(username:string, password:string) :Promise<UserAccount> {
            const str = await this.api.client.Hget(await this.mmsid, this.user_key, username)
            if (str) {
                const user = JSON.parse(str)
                if (user.password === password) {
                    return user
                }
            }
            throw new Error("Username and password do not match")
        },
        async registerUser(user: UserAccount):Promise<UserAccount> {
            // add a new user account into system.
            // first check if the username is taken
            if (await this.api.client.Hget(await this.mmsid, this.user_key, user.username)) {
                throw new Error("The username is taken.")
            }
            // create a new Mimei to store user cases information
            user.mid = await this.api.client.MMCreate(await this.api.sid(), '5KF-zeJy-KUQVFukKla8vKWuSoT', 'USER_MM', import.meta.env.VITE_USER_ACCOUNTS_KEY+'_'+user.username, 2, 0x07276704);
            await this.api.client.Hset(await this.mmsidCur, this.user_key, user.username, JSON.stringify(user))
            await this.api.client.MMAddRef(await this.api.sid(), this.mid, user.mid)        // associate the new MM with Main MMM
            await this.backup()
            return user
        },
        async getUsers() :Promise<UserAccount[]> {
            return await this.api.client.Hgetall(await this.mmsid, this.user_key).map((e:FVPair) => JSON.parse(e.value))
        },
        async getUser(username:string) :Promise<UserAccount> {
            const user = await this.api.client.Hget(await this.mmsid, this.user_key, username)
            return JSON.parse(user)
        },
        async deleteUser(username: string) {
            await this.api.client.Hdel(await this.mmsidCur, this.user_key, username)
            await this.backup()
        },
        async editUser(user: UserAccount) {
            // edit user information such as name, email...
            console.log(user)
            if (!await this.api.client.Hget(await this.mmsid, this.user_key, user.username)) {
                throw new Error("The user does not exist.")
            }
            await this.api.client.Hset(await this.mmsidCur, this.user_key, user.username, JSON.stringify(user))
            await this.backup()
        }
    }
});
