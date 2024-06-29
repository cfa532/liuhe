(()=>{
console.log("write begin")


//sid是一个session id，代表者角本执行的身份
let besid = request["besid"]
console.log("besid=", besid)

let status = lapi.SessionGet(besid, "status")

var ret = ""
ret = "session get status=" + status

//读取session中的值
let appsid = lapi.SessionGet(besid, "appsid")
console.log("appsid=", appsid)
ret = ret + "\nget appsid=" + appsid


//数据库操作
try{
	
	//写数据库
	lapi.Set(appsid, "apkey", "set at write.js");
	console.log("lapi.Set apkey ok")
    ret = ret + "\nlapi.Set apkey ok"
    
    lapi.SignPTT()
} catch(e){
	console.log("lapi.Set err=", e)
}


lapi.SessionSet(besid, "status", "write ok")
ret = ret + "\nset status write ok"

return ret
})()
