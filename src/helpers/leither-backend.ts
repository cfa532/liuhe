import { useAlertStore, useMainStore, useAuthStore } from "@/stores";
import llmTemplate from '../assets/template.json'
export { leitherBackend };

// array in local storage for registered users

function leitherBackend() {
    const userMimei = useMainStore()
    const realFetch = window.fetch;     // monkey patching
    const leitherFetch = function (url:string, opts:any):Promise<Response> {
        return new Promise((resolve, reject) => {
            switch (true) {
                case url.endsWith('/users/authenticate') && opts.method === 'POST':
                    return authenticate();
                case url.endsWith('/users/register') && opts.method === 'POST':
                    return register();
                case url.endsWith('/users') && opts.method === 'GET':
                    return getUsers();
                case url.match(/\/users\/\w+$/) && opts.method === 'GET':
                    return getUserById();
                case url.match(/\/users\/\w+$/) && opts.method === 'PUT':
                    return updateUser();
                case url.match(/\/users\/\w+$/) && opts.method === 'DELETE':
                    return deleteUser();
                default:
                    // pass through any requests not handled above
                    // handle them with original window.fetch()
                    console.log(url, opts)
                    return realFetch(url, opts)
                        .then(response => {
                            console.log(response)
                            resolve(response)
                        })
                        .catch(error => reject(error));
            }

            // route functions
            async function authenticate() {
                const { username, password } = body();
                try {
                    const user = await userMimei.authenticate(username, password)
                    console.log(user)
                    // user.template = user.template ? JSON.parse(user.template) : {}   // parse the stringified Json
                    return ok({
                        ...basicDetails(user),
                        token: 'fake-jwt-token'     // JWT token of authentication
                    });
                } catch(err) {
                    console.error("Login failed.")
                    error('Username or password is incorrect')
                }
            }

            function register() {
                const user = body();    // http request body
                // register a system admin
                user.role = user.username=="admin" ? "admin" : "user"
                user.template = llmTemplate
                // registerUser will check if username exists
                userMimei.registerUser(user).then((u)=>{
                    console.log("New Leither user=", u)
                    return ok();
                }, err=>{
                    console.error("User register error,", err)
                    useAlertStore().error("Registration error "+ err)
                })
            }

            async function getUsers() {
                if (!isAuthenticated()) return unauthorized();

                const users =  await userMimei.getUsers()
                const user = useAuthStore().user
                if (user?.role === 'admin')
                    return ok(users.map(x => basicDetails(x)));
                return ok(new Array(user))
            }

            async function getUserById() {
                if (!isAuthenticated()) return unauthorized();

                const user = await userMimei.getUser(idFromUrl()!)
                console.log(user)
                return ok(basicDetails(user));
            }

            function updateUser() {
                if (!isAuthenticated()) return unauthorized();

                const params = body();
                // username cannot be changed, remove it from params
                // delete params.username
                // only update password if entered
                if (!params.password) {
                    delete params.password;
                }
                
                const user = useAuthStore().user    // get login user
                let ua: UserAccount = {} as any
                if (user.username !== params.username) {
                    // happens only when admin is changing other user's information
                    Object.assign(ua, params);
                } else {
                    // updating user self
                    Object.assign(user, params);
                    // make a DEEP copy of user, because userMimei makes change to ua
                    // user.role = user.username=="admin" ? "admin" : "user"
                    ua = {username: user.username, familyName: user.familyName, givenName: user.givenName, role: user.role,
                        password: user.password, mid: user.mid, template: llmTemplate, subscription: false}    // a tempt solution to change user template
                }
                userMimei.editUser(ua).then(()=>{
                    if (params.username == user.username)
                        localStorage.setItem('user', JSON.stringify(user));
                    return ok();
                }, err=>{
                    console.error("update failed:", err)
                    error("Update failed, "+err)
                })
            }

            function deleteUser() {
                // do nothing for now
                if (!isAuthenticated()) return unauthorized();
                const id = idFromUrl()!
                console.log(id)
                userMimei.deleteUser(id)
                return ok("");
            }

            // helper functions

            function ok(body:any=null) {
                resolve({ ok: true, ...headers(), json: () => Promise.resolve(body) } as any)
            }

            function unauthorized() {
                resolve({ status: 401, ...headers(), json: () => Promise.resolve({ message: 'Unauthorized' }) } as any)
            }

            function error(message:string) {
                resolve({ status: 400, ...headers(), json: () => Promise.resolve({ message }) } as any)
            }

            function basicDetails(user: any) {
                const { familyName, givenName, mid, username, role, password, template } = user;  // take a subset of User Acccount obj
                // template is stored as string in DB, parse it here
                return { username, familyName, givenName, mid, role, password, template };
            }

            function isAuthenticated() {
                return opts.headers['Authorization'] === 'Bearer fake-jwt-token';
            }

            function body() {
                // console.log("body()", JSON.parse(opts.body))
                console.log(opts.body)
                return opts.body && JSON.parse(opts.body);
            }

            function idFromUrl() {
                return url.split('/').pop();
            }

            function headers() {
                return {
                    headers: {
                        get() {
                            return ['application/json'];
                        }
                    }
                }
            }
        });
    }
    // to get rid of the type error message
    window.fetch = leitherFetch as any
}