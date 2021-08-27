module.exports = function registerHook({ exceptions, services, env }) {

    const lodash = require("lodash");

    const { ItemsService } = services;
    const { ServiceUnavailableException } = exceptions;
  
    return {
      "oauth.cas.login.before": async function (payload,{schema, accountability}) {

        const path = env[`OAUTH_CAS_PROFILE_EMAIL`] || 'email';
        const email = lodash.get(payload.profile, path);

        //Filter subdomains
        if (email.endsWith("@udl.cat")) {
           
            //Force permission to create the user           
            const account = accountability || {};
            account.admin = true;

          
            const userService = new ItemsService(
                "directus_users",
                {
                  schema: schema,
                  accountability: account,
                }
            ); 

            try {
                const result = await userService.readByQuery({
                  filter: {email: email},
                });


                console.log ("result", result.length);
                //User don't exist yet
                if (result.length === 0) {

                    const user = {
                        email: email,
                        firstName: '',
                        lastName: '',
                        language: 'ca-ES', 
                        role: '3db98abc-2e53-438d-8a05-730e23225fe4', //Project applicant by default
                        status: 'active'
                    }

                await userService.createOne(user);                    
                }
    
            } catch (error) {
                console.log ("error", error);
            }

        }

      },
    }
};
