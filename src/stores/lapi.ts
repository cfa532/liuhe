import { defineStore } from 'pinia';
// import { useRouter} from 'vue-router';
import { router } from '@/router'

// const router = useRouter();
// Hprose API
const ayApi = ["GetVarByContext", "Act", "Login", "Getvar", "Getnodeip", "SwarmLocal", "DhtGetAllKeys","MFOpenByPath",
    "DhtGet", "DhtGets", "SignPPT", "RequestService", "SwarmAddrs", "MFOpenTempFile", "MFTemp2MacFile", "MFSetData",
    "MFGetData", "MMCreate", "MMOpen", "Hset", "Hget", "Hmset", "Hmget", "Zadd", "Zrangebyscore", "Zrange", "MFOpenMacFile",
    "MFReaddir", "MFGetMimeType", "MFSetObject", "MFGetObject", "Zcount", "Zrevrange", "Hlen", "Hscan", "Hrevscan",
    "MMRelease", "MMBackup", "MFStat", "Zrem", "Zremrangebyscore", "MiMeiPublish", "PullMsg", "MFTemp2Ipfs", "MFSetCid",
    "MMSum", "MiMeiSync", "IpfsAdd", "MMAddRef", "Hdel"
];
const PAGE_SIZE = 50        // chat items diplayed per page

export const useLeitherStore = defineStore({
    id: 'LeitherApiHandler', 
    state: ()=>({
        _sid: "",
        hostUrl: "ws://" + import.meta.env.VITE_LEITHER_IP +"/ws/",         // IP:port, where leither service runs
    }),
    getters: {
        client: (state) => window.hprose.Client.create(state.hostUrl, ayApi),       // Hprose client
        sid: (state) => {
            if (sessionStorage.getItem("sid")) {
                state._sid = sessionStorage.getItem("sid")!
            }
            return state._sid;
        }
    },
    actions: {
        login(user="lsb", pswd="123456") {
            return new Promise<any>((resolve, reject)=>{
                this.client.Login(user, pswd, "byname").then(
                    (result:any)=>{ 
                        this._sid = result.sid
                        sessionStorage.setItem("sid", result.sid)
                        this.client.SignPPT(this._sid, {
                            CertFor: "Self",
                            Userid: result.uid,
                            RequestService: "mimei"
                        }, 1).then(
                            (ppt:any)=>{
                            console.log("ppt=", JSON.parse(ppt))
                            this.client.RequestService(ppt).then(
                                (map:any)=>{
                                    console.log("Request service: ", map)
                                    resolve(this)
                                }, (err:Error)=>{
                                    console.error("Request service error=", err)
                                    reject("Request service error")
                                })
                        }, (err:Error)=>{
                            console.error("Sign PPT error=", err)
                            reject("Sign PPT error")
                        })
                    }, (e:Error) => {
                        console.error("Leither login error=", e)
                        reject("Leither login error")
                    }
                )
            })
        },
        logout() {
            sessionStorage.setItem("sid", "");
            this._sid = "";
            router.push({name: "main"});
        }
    }
})
export const useCaseStore = defineStore({
    // holding all cases of the current user, in a FV database
    id: "CaseMimei",
    state: ()=>({
        api: {} as any,
        mid: "",        // Mimei database to hold all the cases of a user
        _mmsid: "",         // session id for the current user Mimei
        _fieldKey: "CASE_FIELD_KEY",
        _case: null as any,
        _chatHistory: [] as ChatItem[]
    }),
    getters: {
        // mimei sid for reading
        mmsid: async function(state) :Promise<string> {
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(this.api.sid, this.mid, "last")
            return state._mmsid
        },
        // mimei sid for writing
        mmsidCur: async function() :Promise<string> {
            return await this.api.client.MMOpen(this.api.sid, this.mid, "cur");
        },
        chatHistory: function() :ChatItem[] {
            return this._chatHistory
        },
    },
    actions: {
        init(api:any, mid:string) {
            this.$state.api = api;        // leither api object
            this.$state.mid = mid          // mimei id for Main user database
        },
        async backup(mid: string="") {
            if (!mid) mid = this.mid;
            try {
                const newVer = await this.api.client.MMBackup(this.api.sid, mid, '')
                this.$state._mmsid = await this.api.client.MMOpen(this.api.sid, mid, "last");
                // now publish a new version of database Mimei
                const ret:DhtReply = this.api.client.MiMeiPublish(this.api.sid, "", mid)
                console.log("Case Mimei publish []DhtReply=", ret, this._mmsid, "newVer="+newVer)
            } catch(err:any) {
                throw new Error(err)
            }
        },
        async addCase(c:LegalCase) {
            // add a new Case to database FV and return the Field. Use
            const hk = await this.api.client.MMCreate(this.api.sid, "Liuhe", '', c.title, 1, 0x07276705)
            if (await this.api.client.Hget(await this.mmsid, this._fieldKey, hk)) {
                throw new Error("Case title already exists")
            }
            // also use this hash key as chat history key
            c.id = hk
            this._case = c
            await this.api.client.Hset(await this.mmsidCur, this._fieldKey, hk, c);
            await this.backup()
        },
        async getCase(fieldId:string) {
            this._case = await this.api.client.Hget(await this.mmsid, this._fieldKey, fieldId)
            if (!this._case)
                throw new Error("Case does not exist for "+fieldId)
        },
        async editCase(c:LegalCase) {
            // reset case data with 
            await this.api.client.Hset(await this.mmsidCur, this._fieldKey, c.id, c);
            await this.backup()
        },
        async addChatItem(c: ChatItem) {
            // case id (its field id) is also used as Key of chat history Score-Pair
            await this.api.client.Zadd(await this.mmsidCur, this._fieldKey, new ScorePair(Date.now(), JSON.stringify(c)))
            await this.backup()
        },
        async getChatHistory(pageNum: number) {
            const start = (pageNum-1)*PAGE_SIZE
            await this.api.client.Zrevrange(await this.mmsid, this._fieldKey, start, start+PAGE_SIZE-1),
            (ch:ChatItem[])=>{
                this._chatHistory.concat(ch)
                // get currut page of chat history
            }
        },
    }
})
export const useMainStore = defineStore({
    id: 'MainMimei',      // Mimei to store all users' profile
    state: ()=>({
        api: {} as any,      // leither api handler, entrance to all Leither functions
        mid: "",             // main database Mimei ID, for all users' profile data
        // populated after user login. The Id is read from main database Mimei, store all cases handled by the current user
        _mmsid: "",         // session id for the current user Mimei
        key: "USER_ACCOUNTS",
    }),
    getters: {
        mmsid: async function(state) :Promise<string> {
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(this.api.sid, this.mid, "last");
            return state._mmsid;
        },
        mmsidCur: async function() :Promise<string> {
            return await this.api.client.MMOpen(this.api.sid, this.mid, "cur");
        },
    },
    actions: {
        init(api:any, mid:string) {
            this.$state.api = api;        // leither api object
            this.$state.mid = mid          // mimei id for Main user database
            window.mmInfo = this.$state;    // for easy testing
        },
        async backup(mid: string="") {
            if (!mid) mid = this.mid;
            try {
                const newVer = await this.api.client.MMBackup(this.api.sid, mid, '')
                this.$state._mmsid = await this.api.client.MMOpen(this.api.sid, mid, "last");
                // now publish a new version of database Mimei
                const ret:DhtReply = this.api.client.MiMeiPublish(this.api.sid, "", mid)
                console.log("Main Mimei publish []DhtReply=", ret, this._mmsid, "newVer="+newVer)
            } catch(err:any) {
                throw new Error(err)
            }
        },
        async authenticate(username:string, password:string) :Promise<UserAccount> {
            const u = await this.api.client.Hget(await this.mmsid, this.key, username)
            if (u) {
                if (u.password === password) {
                    return u
                }
            }
            throw new Error("Username and password do not match")
        },
        async addUser(user: UserAccount):Promise<UserAccount> {
            // add a new user account into system.
            // first check if the username is taken
            if (await this.api.client.Hget(await this.mmsid, this.key, user.username)) {
                throw new Error("The username is taken.")
            }
            // create a new Mimei to store user cases information
            user.caseMid = await this.api.client.MMCreate(this.api.sid, '', '', '{{auto}}', 2, 0x07276707);
            await this.api.client.Hset(await this.mmsidCur, this.key, user.username, user)
            await this.api.client.MMAddRef(this.api.sid, this.mid, user.caseMid)        // associate the new MM with Main MMM
            await this.backup()
            return user
        },

        async deleteUser(username: string) {
            await this.api.client.Hdel(await this.mmsidCur, this.key, username)
            await this.api.backup()
        },

        async editUser(user: UserAccount) {
            // edit user information such as name, email...
            // first check if the username is taken
            if (!await this.api.client.Hget(await this.mmsid, this.key, user.username)) {
                throw new Error("The user does not exist.")
            }
            await this.api.client.Hset(await this.mmsidCur, this.key, user.username, user)
            await this.backup()
        }
    }
});
