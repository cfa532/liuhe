import { defineStore } from 'pinia';
import { useAuthStore, useLeitherStore } from '@/stores';
const PAGE_SIZE = 50        // chat items diplayed per page

/**
 * Current case.
 */
export const useCaseStore = defineStore({
    id: "CaseMimei",
    state: ()=>({
        api: useLeitherStore(),    // Leither api handle
        chatCase: {} as ChatCase,   // current case working on
        chatHistory: [] as ChatItem[],
        appId: import.meta.env.VITE_APP_ID,
        userId: useAuthStore().user.username,
        userMid: localStorage.getItem("userMid"),
    }),
    getters: {
        id: (state)=> state.chatCase.id,
    },
    actions: {
        async addChatItem(ci: ChatItem) {
            // add a chat item to chat history of the current case
            await this.api.client.RunMApp("add_chat_item", {aid: this.appId, ver:"last",
                mid: this.userMid, caseid: this.id, chatitem: JSON.stringify(ci)
            })
        },
        async getChatHistory() {
            const cl = await this.api.client.RunMApp("get_chat_items", {aid: this.appId, ver: "last",
                caseid: this.id, pagesize: PAGE_SIZE, mid: this.userMid
            })
            this.chatHistory = cl? cl : []
        },
        async initCase(id: string) {
            if (id) {
                const c = (await useCaseListStore().allCases).find(e => e.id==id)
                if (c) {
                    this.chatCase = c
                    await this.getChatHistory()
                    return
                }
            }
            this.chatCase = {} as ChatCase
            this.chatHistory = []
        },
    }
})

/**
 * Holding all cases of the current user, in a Hash set.
 */
export const useCaseListStore = defineStore({
    id: "CaseListStore",
    state: ()=>({
        appId: import.meta.env.VITE_APP_ID,
        api: useLeitherStore(),     // Leither api handle
        _activeId: "",              // current case Id
        _allcases: [] as ChatCase[],
        user: useAuthStore().user as UserAccount,
        userId: useAuthStore().user.username,
        userMid: localStorage.getItem("userMid"),
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
        allCases: async function(state) {
            if (state._allcases.length > 0)
                return state._allcases

            state._allcases = await state.api.client.RunMApp("get_cases", {aid: state.appId, ver: "last",
                mid: state.userMid
            })
            state._allcases = state._allcases ? state._allcases : []
            state._allcases.sort((a, b) => b.timestamp - a.timestamp)
            return state._allcases
        }
    },
    actions: {
        setActiveId(id:string) {
            localStorage["activeId"] = id
            this._activeId = id
        },
        unsetActiveId() {
            localStorage.removeItem("activeId")
            this._activeId = ""
        },
        async addCase(caption:string) :Promise<string> {
            // A new case created when the 1st round of chat is finished and a chat item passed in.
            // add a new Case to database FV and return the Field.
            // also use this hashkey as chat_history key and template FV key
            const kase = {} as ChatCase
            kase.timestamp = Date.now()
            kase.id = kase.timestamp.toString()
            kase.brief = caption
            await this.api.client.RunMApp("add_case", {aid: this.appId, ver: "last",
                mid: this.userMid, case: JSON.stringify(kase)
            })
            // add new case into list
            this._allcases.unshift(kase)
            return kase.id
        },
        async deleteCase(id:string) {
            // id must be activeId
            await this.api.client.RunMApp("delete_case", {aid: this.appId, ver: "last",
                mid: this.userMid, caseid: id
            })
            // remove the id from case list
            this._allcases = this._allcases.filter((e:any)=>e.id!=id)
            console.log(id, this._allcases)
        }
    }
})