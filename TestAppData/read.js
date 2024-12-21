(()=>{
console.log("read begin")
// let appsid = lapi.SessionGet(gsid, "appsid")


//sid是一个session id，代表者角本执行的身份
let besid = request["besid"]
console.log("besid=", besid)

let status = lapi.SessionGet(besid, "status")

var ret = ""
ret = "session get status=" + status

let authSid = lapi.SessionGet(besid, "authSid")
ret = ret + "\nauthSid" + authSid 

let authuserid = lapi.GetVar(authSid, "userid")
ret = ret + "\nauth userid" + authuserid 


//读取session中的值
let appsid = lapi.SessionGet(besid, "appsid")
console.log("appsid=", appsid)
ret = ret + "\nget appsid=" + appsid


//数据库操作
try{
	
	//写数据库
	value = lapi.Get(appsid, "apkey");
	console.log("lapi.Get apkey ok")
    ret = ret + "\nlapi.Get apkey value=" + value
} catch(e){
	console.log("lapi.Set err=", e)
}

lapi.SessionSet(besid, "status", "read ok")
ret = ret + "\nsession set status read ok"


console.log("read end")

return ret
})()
    