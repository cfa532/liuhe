import { useAlertStore, useMainStore } from "@/stores";

export { leitherBackend };

// array in local storage for registered users
const usersKey = 'vue-3-pinia-registration-login-example-users';

function leitherBackend() {
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
                    const user = await useMainStore().authenticate(username, password)
                    localStorage.setItem(usersKey, JSON.stringify(user));
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
                const user = body();

                // check Main DB to see if username exists
                const userDb = useMainStore()
                const ua = {"username":user.username, "familyName":user.familyName, "givenName":user.givenName, "password":user.password}
                userDb.addUser(ua).then((u:UserAccount)=>{
                    console.log("New Leither user=", u)
                    localStorage.setItem(usersKey, JSON.stringify(u));
                    return ok();
                }, err=>{
                    console.error("User register error,", err)
                    useAlertStore().error("Registration error "+ err)
                })
            }

            function getUsers() {
                if (!isAuthenticated()) return unauthorized();
                const arr = new Array()
                arr[0] = basicDetails(JSON.parse(localStorage.getItem(usersKey)!))
                return ok(arr)
            }

            function getUserById() {
                if (!isAuthenticated()) return unauthorized();

                return ok(basicDetails(JSON.parse(localStorage.getItem(usersKey)!)));
            }

            function updateUser() {
                if (!isAuthenticated()) return unauthorized();

                const params = body();
                // only update password if entered
                if (!params.password) {
                    delete params.password;
                }
                // username cannot be changed
                delete params.username
                
                const user = JSON.parse(localStorage.getItem(usersKey)!)
                Object.assign(user, params);
                useMainStore().editUser(user).then(()=>{
                    localStorage.setItem(usersKey, JSON.stringify(user));
                    return ok();
                }, err=>{
                    console.error("update failed:", err)
                    error("Update failed, "+err)
                })

            }

            function deleteUser() {
                // do nothing for now
                if (!isAuthenticated()) return unauthorized();
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
                const { username, familyName, givenName, caseMid } = user;
                return { username, familyName, givenName, caseMid };
            }

            function isAuthenticated() {
                return opts.headers['Authorization'] === 'Bearer fake-jwt-token';
            }

            function body() {
                console.log("return body=", opts)
                return opts.body && JSON.parse(opts.body);
            }

            // function idFromUrl() {
            //     const urlParts = url.split('/');
            //     return urlParts[urlParts.length - 1];
            // }

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
    window.fetch = leitherFetch as any     // to get rid of the type error message, which prevent building from success
}
