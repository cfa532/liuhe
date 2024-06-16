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
        _mmsidCur: "",
        _value: {} as ChatCase,
        chatHistory: [] as ChatItem[]
    }),
    getters: {
        id: function(state): string {
            return state._value.id
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
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(await this.api.sid(), this.mid, "last")
            return state._mmsid
        },
        // mimei sid for writing
        mmsidCur: async function() :Promise<string> {
            // if (! await this.api.sid()) {
            //     // re-login
            //     await this.api.client.login()
            // }
            return await this.api.client.MMOpen(await this.api.sid(), this.mid, "cur");
        },
    },
    actions: {
        async backup() {
            const newVer = await this.api.client.MMBackup(await this.api.sid(), this.mid, '', "delref=true")
            // now publish a new version of database Mimei
            const ret:DhtReply = await this.api.client.MiMeiPublish(await this.api.sid(), "", this.mid)
            this._mmsid = await this.api.client.MMOpen(await this.api.sid(), this.mid, "last");
            console.log("Case Mimei newVer="+newVer, ret)
        },
        async addChatItem(ci:ChatItem) {
            // add a chat item to chat history of the current case
            const kase = this._value
            kase.timestamp = Date.now()
            
            // add a new ChatItem to the Case.
            await this.api.client.Hset(await this.mmsidCur, CHAT_HISTORY_KEY+kase.id, kase.timestamp, ci)

            // update timestamp of the current case
            await this.api.client.Hset(await this.mmsidCur, CHAT_CASE_KEY, kase.id, kase);
            await this.backup()
            // this.chatHistory.unshift(ci)
            // await this.getChatHistory()
        },
        async getChatHistory(pageNum: number=-1) {
            const arrFields = (await this.api.client.Hkeys(await this.mmsid, CHAT_HISTORY_KEY+this.id)).sort((a: number, b: number) => a>b? -1:1)
            if (pageNum === -1) {
                // get 20 past chat items. The last one comes first.
                this.chatHistory = await this.api.client.Hmget(await this.mmsid, CHAT_HISTORY_KEY+this.id, ...arrFields.slice(0, PAGE_SIZE))
            } else {
                // get currut page of chat history
                // const start = (pageNum-1)*PAGE_SIZE
                const ch:ChatItem[] = await this.api.client.Hmget(await this.mmsid, CHAT_HISTORY_KEY+this.id, ...arrFields)
                this.chatHistory.concat(ch)
            }
        },
        async initCase(id: string) {
            if (id) {
                // reopen mimei in case it is newly created, so the old mimei id is of old version
                this._mmsid = ""
                this._value = await this.api.client.Hget(await this.mmsid, CHAT_CASE_KEY, id)
                await this.getChatHistory()
            } else {
                this._value = {} as ChatCase
                this.chatHistory = []
            }
        },
    }
})

export const useCaseListStore = defineStore({
    id: "CaseListStore",
    state: ()=>({
        api: useLeitherStore(),     // Leither api handle
        _mid: "", //user.user.mid,            // Mimei database to hold all the cases of a user
        _mmsid: "",         // session id for the current user Mimei
        _activeId: "",
        _allcases: [] as ChatCase[]
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
            if (!state._mid)
                state._mid = useAuthStore().mid
            return state._mid
        },
        // mimei sid for reading
        mmsid: async function(state) :Promise<string> {
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(await this.api.sid(), this.mid, "last")
            return state._mmsid
        },
        // mimei sid for writing
        mmsidCur: async function() :Promise<string> {
            return await this.api.client.MMOpen(await this.api.sid(), this.mid, "cur");
        },
        allCases: async function(state) {
            if (state._allcases.length == 0) {
                // get a sorted list of all cases information
                const tmp = await this.api.client.Hgetall(await this.mmsid, CHAT_CASE_KEY)
                this._allcases = tmp.map((e:any)=>e.value)
                this._allcases = this._allcases.filter(e=>e.show)
                console.log(this._allcases, this._allcases.length)
                this._allcases.sort((a,b)=> b.timestamp - a.timestamp)
            }
            return state._allcases
        }
    },
    actions: {
        async backup() {
            const newVer = await this.api.client.MMBackup(await this.api.sid(), this.mid, '', "delref=true")
            // now publish a new version of database Mimei
            const ret:DhtReply = this.api.client.MiMeiPublish(await this.api.sid(), "", this.mid)
            console.warn("Case list new version="+newVer, ret)
            this._mmsid = await this.api.client.MMOpen(await this.api.sid(), this.mid, "last");
        },
        setActiveId(id:string) {
            localStorage["activeId"] = id
            this._activeId = id
        },
        unsetActiveId() {
            localStorage.removeItem("activeId")
            this._activeId = ""
        },
        async addCase(caption:string) :Promise<string> {
            // A new case created when the 1st round of chat is finished and a chat item passed it.
            // add a new Case to database FV and return the Field. Use
            // also use this hashkey as chat_history key and template FV key
            const kase = {} as ChatCase
            kase.timestamp = Date.now()
            kase.id = kase.timestamp.toString()
            kase.brief = caption
            kase.show = true
            await this.api.client.Hset(await this.mmsidCur, CHAT_CASE_KEY, kase.id, kase);     // to get case list quickly
            await this.backup()
            // add new case into list
            this._allcases.unshift(kase)
            return kase.id
        },
        async hideCase(id:string) {
            // id must be activeId
            const kase = await this.api.client.Hget(await this.mmsid, CHAT_CASE_KEY, id)
            kase.show = false
            await this.api.client.Hset(await this.mmsidCur, CHAT_CASE_KEY, id, kase)    // do NOT delete a case, just hide it.
            await this.backup()
            // remove the id from case list
            this._allcases = this._allcases.filter((e:any)=>e.id!=id)
            console.log(id, this._allcases)
        }
    }
})