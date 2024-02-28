import { defineStore } from 'pinia';
import { useAuthStore, useLeitherStore } from '@/stores';

const PAGE_SIZE = 50        // chat items diplayed per page
const CHAT_CASE_KEY = "CHAT_CASE_INFORMATION"   // set of case IDs
const CHAT_HISTORY_KEY = "CHAT_HISTORY_"            // set of chat I

export const useCaseStore = defineStore({
    // holding all cases of the current user, in a FV database
    id: "CaseMimei",
    state: ()=>({
        api: useLeitherStore(),    // Leither api handle
        _mid: "",            // Mimei database to hold all the cases of the user
        _mmsid: "",          // session id for the current user Mimei
        _value: {} as ChatCase,
        chatHistory: [] as ChatItem[]
    }),
    getters: {
        id: function(): string {
            return this._value.id
        },
        mid: function(state) {
            if (!state._mid)
                state._mid = useAuthStore().mid
            return state._mid
        },
        case: function(state) {
            return state._value
        },
        // mimei sid for reading
        mmsid: async function(state) :Promise<string> {
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(this.api.sid, this.mid, "last")
            return state._mmsid
        },
        // mimei sid for writing
        mmsidCur: async function() :Promise<string> {
            return await this.api.client.MMOpen(this.api.sid, this.mid, "cur");
        },
    },
    actions: {
        async backup(mid: string="") {
            if (!mid) mid = this.mid;       // use this mid by default
            try {
                const newVer = await this.api.client.MMBackup(this.api.sid, mid, '', "delref=true")
                this.$state._mmsid = await this.api.client.MMOpen(this.api.sid, mid, "last");
                // now publish a new version of database Mimei
                const ret:DhtReply = this.api.client.MiMeiPublish(this.api.sid, "", mid)
                console.log("Case Mimei publish []DhtReply=", ret, this._mmsid, "newVer="+newVer)
            } catch(err:any) {
                throw new Error(err)
            }
        },
        async createCase(caption:string):Promise<string> {
            // A new case created when the 1st round of chat is finished and a chat item passed it.
            // add a new Case to database FV and return the Field. Use
            // also use this hashkey as chat_history key and template FV key
            const c = this._value
            c.timestamp = Date.now()
            c.id = c.timestamp.toString()
            c.brief = caption

            // create a new Chat Case in Mimei
            await this.api.client.Hset(await this.mmsidCur, CHAT_CASE_KEY, c.id, c);     // to get case list quickly
            await this.backup()
            this.chatHistory = []
            return c.id
        },
        async addChatItem(ci:ChatItem) {
            // add a chat item to chat history of the current case
            const c = this._value
            c.timestamp = Date.now()
            await this.api.client.Hset(await this.mmsidCur, CHAT_HISTORY_KEY+c.id, c.timestamp, ci)
            // update timestamp of the current case
            await this.backup()
            // this.chatHistory.unshift(ci)
            // await this.getChatHistory()
        },
        async getChatHistory(pageNum: number=-1) {
            const arrFields = (await this.api.client.Hkeys(await this.mmsid, CHAT_HISTORY_KEY+this.id)).sort((a: number, b: number) => a>b? -1:1)
            if (pageNum === -1) {
                // get 50 past chat items. The last one comes first.
                this.chatHistory = await this.api.client.Hmget(await this.mmsid, CHAT_HISTORY_KEY+this.id, ...arrFields.slice(0, 50))
            } else {
                // get currut page of chat history
                const start = (pageNum-1)*PAGE_SIZE
                const ch:ChatItem[] = await this.api.client.Hmget(await this.mmsid, CHAT_HISTORY_KEY+this.id, ...arrFields)
                this.chatHistory.concat(ch)
            }
        },
        async initCase(id: string) {
            if (id) {
                this._value = await this.api.client.Hget(await this.mmsid, CHAT_CASE_KEY, id)
                await this.getChatHistory()
            } else {
                this._value = {} as ChatCase
                this.chatHistory = []
            }
        }
    }
})

export const useCaseListStore = defineStore({
    id: "CaseListStore",
    state: ()=>({
        api: useLeitherStore(),     // Leither api handle
        _mid: "", //user.user.mid,            // Mimei database to hold all the cases of a user
        _mmsid: "",         // session id for the current user Mimei
        _activeId: "",
    }),
    getters: {
        activeId: function():string {
            if (this._activeId)
                return this._activeId
            else
                if (localStorage["activeId"]) {
                    this._activeId = localStorage["activeId"]
                    return this._activeId
                }
            return ""
        },
        // current working case
        mid: function(state) {
            state._mid = useAuthStore().mid
            return state._mid
        },
        // mimei sid for reading
        mmsid: async function(state) :Promise<string> {
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(this.api.sid, this.mid, "last")
            return state._mmsid
        },
        // mimei sid for writing
        mmsidCur: async function() :Promise<string> {
            return await this.api.client.MMOpen(this.api.sid, this.mid, "cur");
        },
        allCases: async function() :Promise<ChatCase[]> {
            // get a sorted list of all cases information
            const t = await this.api.client.Hgetall(await this.mmsid, CHAT_CASE_KEY)
            const cases:ChatCase[] = t.map((e:any)=>e.value)
            cases.sort((a,b)=> b.timestamp-a.timestamp)
            return cases
        },
    },
    actions: {
        async backup(mid: string="") {
            if (!mid) mid = this.mid;       // use this mid by default
            try {
                const newVer = await this.api.client.MMBackup(this.api.sid, mid, '', "delref=true")
                this.$state._mmsid = await this.api.client.MMOpen(this.api.sid, mid, "last");
                // now publish a new version of database Mimei
                const ret:DhtReply = this.api.client.MiMeiPublish(this.api.sid, "", mid)
                console.log("Case Mimei publish []DhtReply=", ret, this._mmsid, "newVer="+newVer)
            } catch(err:any) {
                throw new Error(err)
            }
        },
        setActiveId(id:string) {
            localStorage["activeId"] = id
            this._activeId = id
        },
        async deleteCase(id:string) {
            // id must be activeId
            await this.api.client.Hdel(await this.mmsidCur, CHAT_CASE_KEY, id)
            await this.api.client.Del(await this.mmsidCur, CHAT_HISTORY_KEY+id)
            await this.backup()
            localStorage.removeItem(id)
        }
    }
})